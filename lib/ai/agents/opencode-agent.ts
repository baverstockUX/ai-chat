import { execa } from 'execa';
import * as readline from 'readline';

export interface AgentProgressUpdate {
  type: 'tool_call' | 'tool_result' | 'text' | 'complete';
  timestamp: number;
  content: string;
  toolName?: string;
  success?: boolean;
  recovery?: string;
}

interface OpencodeOptions {
  taskDescription: string;
  workingDirectory: string;
  abortSignal?: AbortSignal;
}

/**
 * Execute opencode agent and stream progress updates
 *
 * Spawns opencode CLI with JSON output format and transforms events
 * to AgentProgressUpdate objects. Handles process errors, exit codes,
 * and provides recovery suggestions.
 *
 * @param options - Task description, working directory, and optional abort signal
 * @yields AgentProgressUpdate objects representing agent progress
 */
export async function* executeOpencodeAgent(
  options: OpencodeOptions
): AsyncGenerator<AgentProgressUpdate> {
  const { taskDescription, workingDirectory, abortSignal } = options;

  // Collect stderr lines for error diagnostics
  const stderrLines: string[] = [];

  try {
    // Spawn opencode with JSON output format
    const subprocess = execa(
      'opencode',
      ['run', taskDescription, '--format', 'json'],
      {
        cwd: workingDirectory,
        buffer: false, // Prevent memory leaks on large output
        reject: false, // Don't throw on non-zero exit
        shell: false, // Prevent shell injection
        cancelSignal: abortSignal,
        env: {
          PATH: process.env.PATH,
          CI: '1',
          NO_COLOR: '1',
        },
      }
    );

    // Create readline interface for stdout JSON parsing
    const stdoutInterface = readline.createInterface({
      input: subprocess.stdout!,
      crlfDelay: Infinity, // Handle partial chunks correctly
    });

    // Create separate readline interface for stderr collection
    const stderrInterface = readline.createInterface({
      input: subprocess.stderr!,
      crlfDelay: Infinity,
    });

    // Collect stderr lines in background
    const stderrPromise = (async () => {
      for await (const line of stderrInterface) {
        stderrLines.push(line);
        // Keep only last 10 lines to prevent memory issues
        if (stderrLines.length > 10) {
          stderrLines.shift();
        }
      }
    })();

    // Yield start event immediately
    yield {
      type: 'text',
      timestamp: Date.now(),
      content: 'Agent started executing task...',
    };

    // Track last event time for heartbeat and timeout warnings
    let lastEventTime = Date.now();

    // Process stdout lines and yield progress updates
    // Wrap in a Promise.race to enable heartbeat checking
    let heartbeatTimer: NodeJS.Timeout | null = null;
    let lineIterator = stdoutInterface[Symbol.asyncIterator]();

    try {
      while (true) {
        // Check if cancelled before processing
        if (abortSignal?.aborted) {
          yield {
            type: 'complete',
            timestamp: Date.now(),
            content: 'Agent execution cancelled by user',
            success: false,
          };
          break; // Exit iteration loop
        }

        // Set up heartbeat promise that resolves after 2 seconds
        const heartbeatPromise = new Promise<{ value: undefined; done: true; isHeartbeat: true }>((resolve) => {
          heartbeatTimer = setTimeout(() => {
            resolve({ value: undefined, done: true, isHeartbeat: true });
          }, 2000);
        });

        // Race between next line and heartbeat
        const result = await Promise.race([
          lineIterator.next().then(r => ({ ...r, isHeartbeat: false })),
          heartbeatPromise,
        ]);

        // Clear the heartbeat timer
        if (heartbeatTimer) {
          clearTimeout(heartbeatTimer);
          heartbeatTimer = null;
        }

        // Handle heartbeat
        if (result.isHeartbeat) {
          const now = Date.now();
          if (now - lastEventTime > 2000) {
            // Yield heartbeat if no events in last 2 seconds
            yield {
              type: 'text',
              timestamp: now,
              content: 'Agent still working...',
            };
            lastEventTime = now;
          }
          continue; // Continue to next iteration
        }

        // Check if iteration is done
        if (result.done) {
          break;
        }

        const line = result.value;
        if (!line.trim()) continue;

        // Update last event time
        lastEventTime = Date.now();

        try {
          const event = JSON.parse(line);

          // Transform opencode JSON events to AgentProgressUpdate
          const update = parseOpencodeEvent(event);

          if (update) {
            yield update;
          }
        } catch (parseError) {
          // Treat non-JSON output as plain text instead of just logging
          console.warn('[opencode-agent] Non-JSON output, treating as plain text:', line);
          yield {
            type: 'text',
            timestamp: Date.now(),
            content: line,
          };
        }
      }
    } finally {
      // Clean up heartbeat timer
      if (heartbeatTimer) {
        clearTimeout(heartbeatTimer);
      }
    }

    // Wait for stderr collection to complete
    await stderrPromise;

    // Wait for process to exit
    const result = await subprocess;

    // Handle non-zero exit codes
    if (result.exitCode !== 0) {
      const recovery = getRecoverySuggestion(result.exitCode ?? null, stderrLines);

      yield {
        type: 'complete',
        timestamp: Date.now(),
        content: `Agent failed with exit code ${result.exitCode ?? 'unknown'}`,
        success: false,
        recovery,
      };
    } else {
      // Success completion
      yield {
        type: 'complete',
        timestamp: Date.now(),
        content: 'Agent completed successfully',
        success: true,
      };
    }
  } catch (error: any) {
    // Check if error caused by cancellation
    if (abortSignal?.aborted) {
      yield {
        type: 'complete',
        timestamp: Date.now(),
        content: 'Agent execution cancelled',
        success: false,
      };
      return; // Exit generator
    }

    // Handle process spawn errors
    const recovery = getRecoverySuggestion(
      error.exitCode || null,
      stderrLines,
      error
    );

    yield {
      type: 'complete',
      timestamp: Date.now(),
      content: `Agent error: ${error.message}`,
      success: false,
      recovery,
    };
  }
}

/**
 * Map opencode event types to AgentProgressUpdate types
 */
function mapEventType(
  eventType?: string
): 'tool_call' | 'tool_result' | 'text' | 'complete' {
  switch (eventType) {
    case 'tool_call':
    case 'tool-call':
    case 'tool_use':
      return 'tool_call';
    case 'tool_result':
    case 'tool-result':
      return 'tool_result';
    case 'complete':
    case 'completion':
    case 'step_finish':
      return 'complete';
    case 'text':
    case 'progress':
    case 'message':
    case 'step_start':
    default:
      return 'text';
  }
}

/**
 * Parse opencode JSON event into AgentProgressUpdate
 * Opencode events have structure: { type, timestamp, part: {...} }
 */
function parseOpencodeEvent(event: any): AgentProgressUpdate | null {
  const eventType = event.type;
  const timestamp = event.timestamp || Date.now();
  const part = event.part || {};

  switch (eventType) {
    case 'step_start':
      return {
        type: 'text',
        timestamp,
        content: 'Starting new step...',
      };

    case 'tool_use': {
      const toolName = part.tool || 'unknown';
      const state = part.state || {};
      const input = state.input || {};
      const output = state.output || '';
      const description = input.description || input.command || '';
      const status = state.status || '';

      // For completed tool calls, show the result
      if (status === 'completed') {
        return {
          type: 'tool_result',
          timestamp,
          content: output || 'Tool completed successfully',
          toolName,
          success: true,
        };
      }

      // For in-progress tool calls, show the description
      return {
        type: 'tool_call',
        timestamp,
        content: description || `Calling ${toolName}`,
        toolName,
      };
    }

    case 'text':
      return {
        type: 'text',
        timestamp,
        content: part.text || '',
      };

    case 'step_finish': {
      const reason = part.reason || 'unknown';
      const cost = part.cost || 0;

      if (reason === 'stop') {
        return {
          type: 'complete',
          timestamp,
          content: `Task completed (cost: $${cost.toFixed(4)})`,
          success: true,
        };
      }

      return null; // Don't show intermediate step finishes
    }

    default:
      return null; // Ignore unknown event types
  }
}

/**
 * Get user-friendly recovery suggestions based on exit codes and errors
 *
 * @param exitCode - Process exit code (null if cancelled or ENOENT)
 * @param stderrLines - Last stderr lines for diagnostics
 * @param error - Optional error object
 * @returns Recovery suggestion message
 */
export function getRecoverySuggestion(
  exitCode: number | null,
  stderrLines: string[] = [],
  error?: any
): string {
  // Cancellation (user aborted or timeout)
  if (exitCode === null || exitCode === 130) {
    return 'Agent was cancelled. Try again or break into smaller steps.';
  }

  // Command not found
  if (exitCode === 127 || error?.code === 'ENOENT') {
    return 'opencode command not found. Install: npm install -g opencode-ai';
  }

  // Permission denied
  if (exitCode === 126 || error?.code === 'EACCES') {
    return 'Permission denied. Check file permissions or run with appropriate access.';
  }

  // API authentication issues
  const stderrText = stderrLines.join('\n').toLowerCase();
  if (
    stderrText.includes('api key') ||
    stderrText.includes('authentication') ||
    stderrText.includes('unauthorized')
  ) {
    return 'API authentication failed. Re-authenticate: opencode auth';
  }

  // General failure with stderr context
  if (exitCode === 1 && stderrLines.length > 0) {
    const lastLines = stderrLines.slice(-3).join('\n');
    return `Agent failed. Recent errors:\n${lastLines}\n\nTry simplifying the task or check the error details.`;
  }

  // Default fallback
  return 'An unexpected error occurred. Try again or simplify the task.';
}
