import { auth } from '@/app/(auth)/auth';
import { createStubAgent } from '@/lib/ai/agents/stub-agent';

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { taskDescription } = await req.json();

    // Create stub agent
    const agent = createStubAgent();

    // Create Server-Sent Events stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // Stream mock progress updates
          for await (const update of agent.execute(taskDescription)) {
            const data = `data: ${JSON.stringify(update)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        } catch (error) {
          console.error('Agent execution error:', error);
          const errorData = `data: ${JSON.stringify({
            type: 'error',
            timestamp: Date.now(),
            content: 'Agent execution failed',
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
