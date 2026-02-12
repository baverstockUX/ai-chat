export interface AgentProgressUpdate {
  type: 'tool_call' | 'tool_result' | 'text' | 'complete';
  timestamp: number;
  content: string;
  toolName?: string;
  success?: boolean;
}

export function createStubAgent() {
  return {
    async* execute(taskDescription: string): AsyncGenerator<AgentProgressUpdate> {
      // Simulate thinking
      yield {
        type: 'text',
        timestamp: Date.now(),
        content: `Analyzing request: ${taskDescription}`,
      };

      await delay(500);

      // Simulate tool call
      yield {
        type: 'tool_call',
        timestamp: Date.now(),
        content: 'Creating file: workflow.ts',
        toolName: 'createFile',
      };

      await delay(800);

      // Simulate tool result
      yield {
        type: 'tool_result',
        timestamp: Date.now(),
        content: 'File created successfully (mock)',
        toolName: 'createFile',
        success: true,
      };

      await delay(500);

      // Simulate completion
      yield {
        type: 'complete',
        timestamp: Date.now(),
        content: 'Task completed successfully (stub implementation)',
      };
    },
  };
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
