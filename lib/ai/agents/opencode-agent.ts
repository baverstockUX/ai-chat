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
        signal: abortSignal,
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

    // Process stdout lines and yield progress updates
    for await (const line of stdoutInterface) {
      if (!line.trim()) continue;

      try {
        const event = JSON.parse(line);

        // Transform opencode JSON events to AgentProgressUpdate
        const update: AgentProgressUpdate = {
          type: mapEventType(event.type),
          timestamp: event.timestamp || Date.now(),
          content: event.content || event.message || '',
          toolName: event.tool || event.toolName,
          success: event.success,
        };

        yield update;
      } catch (parseError) {
        // Log parse error but don't fail entire stream
        console.error('[opencode-agent] Failed to parse output line:', line);
        console.error('[opencode-agent] Parse error:', parseError);
        // Continue processing remaining output
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
      return 'tool_call';
    case 'tool_result':
    case 'tool-result':
      return 'tool_result';
    case 'complete':
    case 'completion':
      return 'complete';
    case 'text':
    case 'progress':
    case 'message':
    default:
      return 'text';
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
