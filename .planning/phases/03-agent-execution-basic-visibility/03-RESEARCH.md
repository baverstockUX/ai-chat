# Phase 3: Agent Execution & Basic Visibility - Research

**Researched:** 2026-02-11
**Domain:** Child process management, stream handling, CLI agent spawning, real-time output capture
**Confidence:** HIGH

## Summary

Phase 3 transforms the stub agent implementation into a real process spawner that executes the opencode CLI agent, captures its output in real-time, and surfaces execution status to users through Server-Sent Events (SSE). The core challenge is robust process management: spawning, capturing stdout/stderr without blocking, handling errors gracefully, and ensuring clean cancellation with proper cleanup.

The opencode CLI (v1.1.26) provides a `run` command with `--format json` flag that outputs structured events as newline-delimited JSON. Node.js child_process provides the foundation, but the execa library (v9.6.1) is the production-standard choice for process execution because it handles common pitfalls (shell injection, encoding, signal handling) that are error-prone with raw child_process.

Server-Sent Events (SSE) are already implemented in Phase 2's stub agent and work correctly for streaming. The architecture keeps this pattern: API route spawns process, reads output as it arrives, transforms to progress updates, streams via SSE to client.

**Primary recommendation:** Use execa v9 for process spawning with `--format json` flag to opencode, transform JSON events to AgentProgressUpdate format, stream via existing SSE infrastructure. Implement AbortController for cancellation, process.kill() for cleanup, and structured error recovery suggestions based on exit codes.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| execa | 9.6.1 | Child process execution | Industry-standard process manager - handles encoding, signals, errors, streams better than raw child_process |
| opencode-ai | 1.1.26 | CLI agent for code tasks | Already installed globally, provides structured JSON output via `--format json` |
| AbortController | Native (Node.js 18+) | Process cancellation | Web standard API for cancellation, integrates with Next.js Request.signal |
| ReadableStream | Native (Node.js 18+) | SSE streaming | Already used in stub agent, Web Streams API standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| get-stream | 9.0.0 | Stream to string conversion | Dependency of execa, useful for buffering final output on completion |
| signal-exit | 4.1.0 | Clean exit handling | Dependency of execa, ensures cleanup runs on process termination |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| execa | child_process.spawn | Raw spawn gives more control but requires manual handling of encoding, signals, stream buffering, error codes |
| execa | child_process.execFile | execFile better than exec but still requires manual stream/signal handling - execa provides better DX |
| SSE | WebSockets | WebSockets bidirectional but adds complexity - SSE sufficient for server-to-client streaming |
| JSON format | default format | Default format is human-formatted with ANSI colors - JSON provides structured events easier to parse |

**Installation:**
```bash
npm install execa@9.6.1
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── ai/
│   └── agents/
│       ├── stub-agent.ts          # Existing mock implementation
│       ├── opencode-agent.ts      # Real opencode CLI spawner
│       └── agent-types.ts         # Shared types (AgentProgressUpdate)
app/
└── api/
    └── agent/
        └── execute/
            └── route.ts           # Update to use opencode-agent instead of stub-agent
```

### Pattern 1: Process Spawning with execa

**What:** Spawn opencode CLI process using execa with proper configuration for streaming and cancellation
**When to use:** When user confirms agent request and backend needs to execute the task

**Example:**
```typescript
// Source: execa v9 documentation + Node.js best practices
import { execa } from 'execa';

interface SpawnAgentOptions {
  taskDescription: string;
  workingDirectory: string;
  abortSignal?: AbortSignal;
}

export async function spawnOpencodeAgent(options: SpawnAgentOptions) {
  const { taskDescription, workingDirectory, abortSignal } = options;

  // Spawn with streaming enabled
  const process = execa('opencode', ['run', taskDescription, '--format', 'json'], {
    cwd: workingDirectory,
    // Stream stdout/stderr as they arrive (don't buffer)
    buffer: false,
    // Link to AbortController for cancellation
    signal: abortSignal,
    // Reject on non-zero exit codes
    reject: false, // We'll handle exit codes ourselves
    // Environment isolation
    env: {
      // Inherit PATH so opencode can find node, npm, etc.
      PATH: process.env.PATH,
      // Disable interactive prompts
      CI: '1',
      // Force color off (we're using JSON format anyway)
      NO_COLOR: '1',
    },
    // Prevent shell injection vulnerabilities
    shell: false,
  });

  return process;
}
```

### Pattern 2: Real-time Output Capture from JSON Stream

**What:** Read stdout line-by-line, parse JSON events, transform to AgentProgressUpdate format
**When to use:** Immediately after spawning process, to capture output as it's produced

**Example:**
```typescript
// Source: Node.js streams + opencode JSON output format
import { createInterface } from 'readline';

interface OpencodeEvent {
  type: 'text' | 'tool_call' | 'tool_result' | 'error' | 'complete';
  timestamp: number;
  content?: string;
  tool?: string;
  success?: boolean;
  error?: {
    name: string;
    message: string;
  };
}

export async function* captureAgentOutput(
  process: ReturnType<typeof execa>
): AsyncGenerator<AgentProgressUpdate> {
  // readline for line-by-line parsing (handles partial chunks)
  const rl = createInterface({
    input: process.stdout!,
    crlfDelay: Infinity, // Treat \r\n as single line break
  });

  try {
    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const event = JSON.parse(line) as OpencodeEvent;

        // Transform opencode event to our AgentProgressUpdate format
        const update: AgentProgressUpdate = {
          type: event.type as any,
          timestamp: event.timestamp,
          content: event.content || '',
          toolName: event.tool,
          success: event.success,
        };

        yield update;
      } catch (parseError) {
        // Log but don't fail on malformed JSON
        console.error('Failed to parse opencode output:', line);
      }
    }

    // Wait for process to complete
    const result = await process;

    // Final completion event
    yield {
      type: 'complete',
      timestamp: Date.now(),
      content: result.exitCode === 0
        ? 'Agent completed successfully'
        : `Agent exited with code ${result.exitCode}`,
    };
  } catch (error) {
    // Process execution error
    if (error instanceof Error) {
      yield {
        type: 'complete',
        timestamp: Date.now(),
        content: `Agent execution failed: ${error.message}`,
        success: false,
      };
    }
  }
}
```

### Pattern 3: SSE Streaming (Already Implemented)

**What:** Transform async generator to SSE stream for client consumption
**When to use:** In API route to stream progress updates to browser

**Example:**
```typescript
// Source: Existing stub-agent implementation in app/api/agent/execute/route.ts
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { messageId } = await req.json();

  // Look up agent request message
  const [agentMessage] = await db
    .select()
    .from(message)
    .where(eq(message.id, messageId))
    .limit(1);

  if (!agentMessage || agentMessage.messageType !== 'agent_request') {
    return new Response('Agent request not found', { status: 404 });
  }

  const taskDescription = agentMessage.content;

  // Spawn real agent process
  const process = spawnOpencodeAgent({
    taskDescription,
    workingDirectory: process.cwd(),
    abortSignal: req.signal, // Cancel if request aborted
  });

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        // Stream progress updates
        for await (const update of captureAgentOutput(process)) {
          const data = `data: ${JSON.stringify(update)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      } catch (error) {
        // Error already handled in captureAgentOutput
        console.error('Stream error:', error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Pattern 4: Cancellation with AbortController

**What:** Link API request cancellation to process termination for clean shutdown
**When to use:** User clicks cancel button or navigates away during execution

**Example:**
```typescript
// Source: Node.js AbortController + execa signal handling
// In API route - AbortController automatic via req.signal
export async function POST(req: Request) {
  // req.signal automatically aborted when:
  // - User navigates away
  // - Client closes connection
  // - Request timeout reached (maxDuration)

  const process = spawnOpencodeAgent({
    taskDescription,
    workingDirectory: process.cwd(),
    abortSignal: req.signal, // Pass signal to execa
  });

  // execa automatically:
  // - Sends SIGTERM to process when signal aborted
  // - Waits 5 seconds (configurable)
  // - Sends SIGKILL if process doesn't exit
  // - Cleans up streams

  // We just need to handle in stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const update of captureAgentOutput(process)) {
          // Check if aborted
          if (req.signal.aborted) {
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({
                type: 'complete',
                timestamp: Date.now(),
                content: 'Agent execution cancelled',
                success: false,
              })}\n\n`
            ));
            break;
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(update)}\n\n`));
        }
      } finally {
        controller.close();
      }
    },
  });
}

// Client-side cancellation
// User clicks Cancel button -> close EventSource
eventSource.close();
// This closes connection -> req.signal aborted -> process killed
```

### Pattern 5: Error Handling with Recovery Suggestions

**What:** Map process exit codes and error types to user-friendly messages with recovery actions
**When to use:** Process fails, exits with error, or crashes

**Example:**
```typescript
// Source: opencode exit codes + Node.js error handling patterns
function getRecoverySuggestion(error: Error, exitCode: number | null): string {
  // Process killed by signal
  if (exitCode === null) {
    return 'The agent was cancelled or timed out. You can try again with a simpler task, or break the task into smaller steps.';
  }

  // Standard exit codes
  if (exitCode === 1) {
    return 'The agent encountered an error. Check if the requested files/directories exist and you have the necessary permissions.';
  }

  if (exitCode === 126 || exitCode === 127) {
    return 'The opencode CLI could not be found or executed. Ensure opencode is installed: npm install -g opencode-ai';
  }

  if (exitCode === 130) {
    return 'The agent was interrupted (Ctrl+C). This usually means a timeout or manual cancellation.';
  }

  // Error-specific suggestions
  if (error.message.includes('ENOENT')) {
    return 'A required file or directory was not found. Try providing a different path or checking the current directory.';
  }

  if (error.message.includes('EACCES')) {
    return 'Permission denied. The agent needs access to this file or directory. Check file permissions.';
  }

  if (error.message.includes('ETIMEDOUT')) {
    return 'The operation timed out. Try again, or check your network connection if the task requires internet access.';
  }

  // API errors
  if (error.message.includes('API key')) {
    return 'API authentication failed. The opencode CLI may need to be re-authenticated: opencode auth';
  }

  // Generic fallback
  return 'An unexpected error occurred. Try simplifying the task or running it again. If the issue persists, check the agent logs for details.';
}

// Usage in error handler
catch (error) {
  const recovery = getRecoverySuggestion(error, process.exitCode);

  yield {
    type: 'complete',
    timestamp: Date.now(),
    content: `Agent failed: ${error.message}`,
    success: false,
    recovery, // Add recovery suggestion to event
  };
}
```

### Pattern 6: Stderr Capture for Warnings and Errors

**What:** Capture stderr separately from stdout for logging and error diagnostics
**When to use:** Always, to capture warnings, errors, and diagnostic output

**Example:**
```typescript
// Source: Node.js streams best practices
export async function* captureAgentOutput(
  process: ReturnType<typeof execa>
): AsyncGenerator<AgentProgressUpdate> {
  const stdoutReader = createInterface({
    input: process.stdout!,
    crlfDelay: Infinity,
  });

  const stderrReader = createInterface({
    input: process.stderr!,
    crlfDelay: Infinity,
  });

  // Collect stderr for error reporting
  const stderrLines: string[] = [];

  // Listen to stderr in background
  const stderrPromise = (async () => {
    for await (const line of stderrReader) {
      stderrLines.push(line);

      // Optionally yield stderr as warning events
      if (line.includes('WARNING') || line.includes('WARN')) {
        // Don't yield warnings as separate events (too noisy)
        // Just collect for final error report
      }
    }
  })();

  // Main stdout processing
  for await (const line of stdoutReader) {
    // ... parse and yield updates
  }

  // Wait for stderr collection to finish
  await stderrPromise;

  // On error, include stderr in recovery info
  const result = await process;
  if (result.exitCode !== 0 && stderrLines.length > 0) {
    yield {
      type: 'complete',
      timestamp: Date.now(),
      content: `Agent failed (exit code ${result.exitCode})`,
      success: false,
      details: stderrLines.join('\n'), // Include stderr for debugging
    };
  }
}
```

### Anti-Patterns to Avoid

- **Using child_process methods that buffer:** Methods that buffer all output in memory cause memory leaks for long-running agents - use streaming approaches
- **Not linking AbortSignal:** Process becomes zombie when user navigates away, wastes resources
- **Buffering stdout before parsing:** Defeats real-time streaming, user sees no progress until completion
- **Ignoring stderr:** Errors and warnings disappear, harder to debug failures
- **Shell=true with user input:** Shell injection vulnerability - always use shell=false and pass args as array
- **Not handling partial lines:** stdout arrives in chunks, not lines - need readline or similar to buffer
- **Generic error messages:** "Something went wrong" unhelpful - map exit codes to actionable suggestions

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Process spawning | Manual child_process.spawn | execa | Handles encoding, signals, stream buffering, error codes, cleanup |
| Line-by-line parsing | Manual string splitting | readline.createInterface | Handles partial chunks, different line endings, encoding |
| Signal handling | Manual SIGTERM/SIGKILL | execa + AbortSignal | Graceful shutdown with timeout, automatic cleanup |
| Stream multiplexing | Custom stdout/stderr merger | Separate readline interfaces + Promise.all | Avoids blocking, preserves error context |
| Exit code mapping | if/else chains | Map/object lookup | Maintainable, extensible, testable |

**Key insight:** Child process management has many edge cases (encoding, signals, partial reads, zombie processes). execa solves 90% of these. Focus implementation effort on opencode-specific output parsing and error recovery UX.

## Common Pitfalls

### Pitfall 1: Partial JSON Lines in stdout

**What goes wrong:** opencode writes JSON events to stdout, but stream arrives in chunks not lines - get incomplete JSON errors
**Why it happens:** TCP/stdio streams are byte-oriented, not line-oriented
**How to avoid:**
- Use readline.createInterface to buffer partial lines
- Only parse complete lines (after newline received)
- Catch JSON.parse errors and log (don't fail entire stream)
**Warning signs:** Frequent "Unexpected end of JSON input" errors, missing progress updates

### Pitfall 2: Zombie Processes on Cancellation

**What goes wrong:** User closes tab, API request aborted, but opencode process keeps running
**Why it happens:** Process not linked to request lifecycle, no cleanup handler
**How to avoid:**
- Pass req.signal to execa as signal option
- execa automatically kills process when signal aborted
- Ensure no detached: true option (makes process outlive parent)
**Warning signs:** Multiple opencode processes in task manager after user navigates away, high CPU usage

### Pitfall 3: Memory Leak from Buffering Output

**What goes wrong:** Long-running agent (10+ minutes) fills memory, eventually crashes
**Why it happens:** Accidentally buffering all output instead of streaming
**How to avoid:**
- Set buffer: false in execa options
- Process stdout/stderr as they arrive (for await loop)
- Don't concatenate all output into string
**Warning signs:** Memory usage grows continuously, server crashes on long tasks

### Pitfall 4: Blocking on stderr Before stdout Completes

**What goes wrong:** Process hangs waiting for stderr to finish before processing stdout
**Why it happens:** Sequential processing of stdout then stderr
**How to avoid:**
- Read stdout and stderr concurrently (Promise.all or separate async tasks)
- Don't await stderr before yielding stdout events
**Warning signs:** Progress updates stop appearing but process still running, task appears frozen

### Pitfall 5: Shell Injection via Task Description

**What goes wrong:** User message like "Delete all files; rm -rf /" gets passed to shell and executes
**Why it happens:** Using shell: true with user input
**How to avoid:**
- Always use shell: false with execa
- Pass task description as array element, not string
- execa handles quoting/escaping automatically
**Warning signs:** Security audit flags, unexpected file operations

### Pitfall 6: Lost Output on Fast Completion

**What goes wrong:** Agent completes in <100ms, client sees "Working..." then "Complete" with no details
**Why it happens:** SSE events sent before client EventSource connected
**How to avoid:**
- Store progress events in database as they occur
- On reconnect or late connect, replay events from database
- Alternative: Delay first event by 100ms (gives client time to connect)
**Warning signs:** Users report "nothing happened" but logs show success, fast tasks have no visible output

### Pitfall 7: Timeout Without Cleanup

**What goes wrong:** maxDuration exceeded, API route terminates, but opencode process continues
**Why it happens:** Vercel Edge Runtime kills route but doesn't kill child processes
**How to avoid:**
- Use Node.js runtime (not Edge) for routes that spawn processes
- Already done in Phase 2 for postgres compatibility
- AbortSignal automatically aborted on timeout
**Warning signs:** Tasks timeout but processes remain, duplicate work executed

## Code Examples

### Complete Agent Spawner Implementation

```typescript
// lib/ai/agents/opencode-agent.ts
// Source: execa v9 + readline + patterns above
import { execa } from 'execa';
import { createInterface } from 'readline';

export interface AgentProgressUpdate {
  type: 'text' | 'tool_call' | 'tool_result' | 'complete';
  timestamp: number;
  content: string;
  toolName?: string;
  success?: boolean;
  recovery?: string;
}

interface SpawnAgentOptions {
  taskDescription: string;
  workingDirectory: string;
  abortSignal?: AbortSignal;
}

export async function* executeOpencodeAgent(
  options: SpawnAgentOptions
): AsyncGenerator<AgentProgressUpdate> {
  const { taskDescription, workingDirectory, abortSignal } = options;

  let process;
  try {
    // Spawn opencode process
    process = execa('opencode', ['run', taskDescription, '--format', 'json'], {
      cwd: workingDirectory,
      buffer: false,
      signal: abortSignal,
      reject: false,
      env: {
        PATH: process.env.PATH,
        CI: '1',
        NO_COLOR: '1',
      },
      shell: false,
    });

    // Setup readline for stdout
    const stdoutReader = createInterface({
      input: process.stdout!,
      crlfDelay: Infinity,
    });

    // Setup readline for stderr (background collection)
    const stderrReader = createInterface({
      input: process.stderr!,
      crlfDelay: Infinity,
    });

    const stderrLines: string[] = [];
    const stderrPromise = (async () => {
      for await (const line of stderrReader) {
        stderrLines.push(line);
      }
    })();

    // Process stdout events
    for await (const line of stdoutReader) {
      if (!line.trim()) continue;

      try {
        const event = JSON.parse(line);

        yield {
          type: event.type,
          timestamp: event.timestamp,
          content: event.content || event.message || '',
          toolName: event.tool,
          success: event.success,
        };
      } catch (parseError) {
        console.error('Failed to parse opencode output:', line);
      }
    }

    // Wait for process to complete
    await stderrPromise;
    const result = await process;

    // Final status
    if (result.exitCode === 0) {
      yield {
        type: 'complete',
        timestamp: Date.now(),
        content: 'Agent completed successfully',
        success: true,
      };
    } else {
      const error = new Error(`Exit code ${result.exitCode}`);
      const recovery = getRecoverySuggestion(error, result.exitCode, stderrLines);

      yield {
        type: 'complete',
        timestamp: Date.now(),
        content: `Agent failed (exit code ${result.exitCode})`,
        success: false,
        recovery,
      };
    }
  } catch (error) {
    // Process execution error (spawn failed, killed, etc.)
    const recovery = getRecoverySuggestion(
      error as Error,
      process?.exitCode ?? null,
      []
    );

    yield {
      type: 'complete',
      timestamp: Date.now(),
      content: error instanceof Error ? error.message : 'Unknown error',
      success: false,
      recovery,
    };
  }
}

function getRecoverySuggestion(
  error: Error,
  exitCode: number | null,
  stderrLines: string[]
): string {
  // Cancellation
  if (exitCode === null || exitCode === 130) {
    return 'The agent was cancelled. You can try again or break the task into smaller steps.';
  }

  // File not found
  if (error.message.includes('ENOENT') || exitCode === 127) {
    return 'The opencode command was not found. Ensure opencode is installed: npm install -g opencode-ai';
  }

  // Permission denied
  if (error.message.includes('EACCES') || exitCode === 126) {
    return 'Permission denied. Check file permissions or run with appropriate access.';
  }

  // API authentication
  if (error.message.includes('API key') || stderrLines.some(l => l.includes('API key'))) {
    return 'API authentication failed. Re-authenticate opencode: opencode auth';
  }

  // Generic failure
  if (exitCode === 1) {
    const stderrHint = stderrLines.length > 0
      ? ` Details: ${stderrLines.slice(-3).join(' ')}`
      : '';
    return `The agent encountered an error.${stderrHint} Try simplifying the task or checking the requirements.`;
  }

  return 'An unexpected error occurred. Try again or simplify the task.';
}
```

### Updated API Route

```typescript
// app/api/agent/execute/route.ts
// Source: Existing route + new opencode-agent
import { auth } from '@/app/(auth)/auth';
import { executeOpencodeAgent } from '@/lib/ai/agents/opencode-agent';
import { db } from '@/lib/db';
import { message } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs'; // Required for child processes
export const maxDuration = 60; // 60 seconds timeout

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { messageId } = await req.json();

    // Look up agent request message
    const [agentMessage] = await db
      .select()
      .from(message)
      .where(eq(message.id, messageId))
      .limit(1);

    if (!agentMessage || agentMessage.messageType !== 'agent_request') {
      return new Response('Agent request not found', { status: 404 });
    }

    const taskDescription = agentMessage.content || 'Execute task';

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // Stream real agent execution
          for await (const update of executeOpencodeAgent({
            taskDescription,
            workingDirectory: process.cwd(),
            abortSignal: req.signal,
          })) {
            const data = `data: ${JSON.stringify(update)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        } catch (error) {
          console.error('Agent execution error:', error);
          const errorData = `data: ${JSON.stringify({
            type: 'complete',
            timestamp: Date.now(),
            content: 'Agent execution failed',
            success: false,
            recovery: 'An unexpected error occurred. Please try again.',
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to start agent execution',
    }), { status: 500 });
  }
}
```

### Client-Side Cancellation

```typescript
// components/chat/agent-execution-card.tsx
// Source: Browser EventSource API + React patterns
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function AgentExecutionCard({ messageId }: { messageId: string }) {
  const [status, setStatus] = useState<'running' | 'completed' | 'failed'>('running');
  const [progress, setProgress] = useState<string[]>([]);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const handleExecute = () => {
    const es = new EventSource(`/api/agent/execute?messageId=${messageId}`);

    es.onmessage = (event) => {
      const update = JSON.parse(event.data);

      setProgress(prev => [...prev, update.content]);

      if (update.type === 'complete') {
        setStatus(update.success ? 'completed' : 'failed');
        es.close();
      }
    };

    es.onerror = () => {
      setStatus('failed');
      es.close();
    };

    setEventSource(es);
  };

  const handleCancel = () => {
    // Close EventSource -> request aborted -> process killed
    eventSource?.close();
    setStatus('failed');
    setProgress(prev => [...prev, 'Execution cancelled']);
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="mb-4">
        <h3 className="font-semibold">Agent Execution</h3>
        <p className="text-sm text-muted-foreground">Status: {status}</p>
      </div>

      <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
        {progress.map((msg, i) => (
          <div key={i} className="text-sm font-mono">
            {msg}
          </div>
        ))}
      </div>

      {status === 'running' && (
        <Button onClick={handleCancel} variant="destructive">
          Cancel Execution
        </Button>
      )}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual child_process | execa with streaming | 2020-2024 | Better error handling, no memory buffering, cleaner API |
| Manual signal handling | AbortController + execa signal | 2021-2024 | Web standard API, automatic cleanup, simpler code |
| Polling for output | ReadableStream with async iteration | 2020+ | Real-time updates, lower latency, standard streams API |
| Shell scripts for orchestration | Direct CLI invocation with JSON | 2023+ | Type-safe, no shell injection, structured output |
| Custom streaming protocols | Server-Sent Events (SSE) | 2015+ | Browser-native, simpler than WebSockets, good for server-to-client |

**Deprecated/outdated:**
- **Methods that buffer output:** Use execa with buffer: false for streaming - buffering causes memory issues
- **Promisified spawn without streams:** Use execa with buffer: false for streaming
- **process.on('SIGTERM') for cleanup:** Use AbortController/Signal pattern - more composable
- **shell: true with user input:** Major security risk - always use shell: false

## Open Questions

1. **Working Directory for Agent Execution**
   - What we know: Need to pass cwd to opencode
   - What's unclear: Should it be user's home directory, a project-specific directory, or a sandboxed temp directory?
   - Recommendation: Start with process.cwd() (Next.js project root). Add workspace/project selection in later phase.

2. **Agent Output Persistence**
   - What we know: SSE is ephemeral - if user refreshes, output lost
   - What's unclear: Should we store progress updates in database for replay?
   - Recommendation: Phase 3 focus is basic visibility - ephemeral is acceptable. Add persistence in Phase 4 if users report refresh issues.

3. **Concurrent Agent Executions**
   - What we know: Users might trigger multiple agents
   - What's unclear: Limit to one agent per user? Per conversation? Allow unlimited?
   - Recommendation: No artificial limit - each request spawns its own process. OS handles resource limits. Monitor for DoS patterns.

4. **Agent Session Management**
   - What we know: opencode supports --session flag for continuity
   - What's unclear: Should we create persistent sessions per conversation or one-shot per request?
   - Recommendation: One-shot for Phase 3 (simpler, stateless). Session continuity in later phase if needed.

5. **Timeout Configuration**
   - What we know: maxDuration is 60s for API route
   - What's unclear: Is 60s enough? Should it be configurable per task?
   - Recommendation: Start with 60s. If users hit limits frequently, extend to 300s (5 min) or make configurable.

6. **Error Retry Strategy**
   - What we know: Should offer recovery suggestions
   - What's unclear: Auto-retry with backoff, or require user to manually retry?
   - Recommendation: Manual retry for Phase 3 (simpler, gives user control). Auto-retry can mask real issues.

## Sources

### Primary (HIGH confidence)
- opencode CLI v1.1.26 (`opencode --help`, `opencode run --help`) - Command interface, flags, JSON format
- execa v9.6.1 npm documentation - Process spawning patterns, signal handling, stream options
- Node.js v18+ documentation - AbortController, ReadableStream, readline, child_process
- Existing codebase (`app/api/agent/execute/route.ts`, `lib/ai/agents/stub-agent.ts`) - SSE streaming pattern, message types

### Secondary (MEDIUM confidence)
- Phase 2 research (`02-RESEARCH.md`) - Agent orchestration context, message schema, SSE patterns
- Phase 2 implementation - AgentProgressUpdate type, SSE headers, error handling

### Tertiary (LOW confidence)
- General Node.js child process best practices - Security patterns, stream handling
- Industry patterns for CLI agent systems - Process management, cancellation flows

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - execa is well-documented, production-proven library for Node.js process execution
- Architecture patterns: HIGH - Process spawning, stream capture, SSE streaming all verified in Node.js docs
- Error handling: MEDIUM - Exit code mapping based on common conventions, but opencode-specific codes need testing
- Pitfalls: HIGH - Documented Node.js stream/process pitfalls, verified through industry experience

**Research date:** 2026-02-11
**Valid until:** ~90 days (2026-05-11) - Node.js APIs stable, execa mature, but opencode CLI evolving

**Key assumptions:**
1. opencode CLI installed globally and accessible in PATH (verified: v1.1.26 present)
2. opencode `--format json` outputs newline-delimited JSON events (needs verification by testing)
3. execa handles process cleanup on abort correctly (documented in execa v9 docs)
4. 60s timeout sufficient for most agent tasks (needs validation in practice)
5. Node.js runtime (not Edge) required for child_process (already using Node.js runtime from Phase 2)
