import { auth } from '@/app/(auth)/auth';
import { executeOpencodeAgent } from '@/lib/ai/agents/opencode-agent';
import { db } from '@/lib/db';
import { message, resource } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Generate a short resource name from task description
 * Max 50 chars, removes common prefixes like "Create", "Make"
 */
function generateResourceName(taskDescription: string): string {
  // Remove common action words
  let name = taskDescription
    .replace(/^(create|make|write|build|generate|add)\s+/i, '')
    .trim();

  // Capitalize first letter
  name = name.charAt(0).toUpperCase() + name.slice(1);

  // Truncate to 50 chars
  if (name.length > 50) {
    name = name.substring(0, 47) + '...';
  }

  return name || 'Agent Task';
}

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { messageId, conversationId } = await req.json();

    // Look up the agent request message
    const [agentMessage] = await db
      .select()
      .from(message)
      .where(eq(message.id, messageId))
      .limit(1);

    if (!agentMessage || agentMessage.messageType !== 'agent_request') {
      return new Response('Agent request not found', { status: 404 });
    }

    // Get the original user message (immediately before the agent request)
    const messages = await db
      .select()
      .from(message)
      .where(eq(message.conversationId, conversationId))
      .orderBy(asc(message.createdAt))
      .limit(100);

    // Find the user message right before this agent request
    const agentIndex = messages.findIndex(m => m.id === messageId);
    const userMessage = agentIndex > 0 ? messages[agentIndex - 1] : null;

    // Use the original user request as the task description
    const taskDescription = userMessage?.content || agentMessage.content || 'Execute task';

    // Create Server-Sent Events stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let executionSuccess = false;
        const updates: any[] = [];

        try {
          // Use a clean workspace directory isolated from the main project
          // This prevents opencode from scanning node_modules, .next, etc.
          // and significantly speeds up execution (10s vs 60s+)
          const workspaceDir = join(process.cwd(), 'agent-workspace');

          // Ensure workspace directory exists
          await mkdir(workspaceDir, { recursive: true });

          // Stream real agent progress updates
          for await (const update of executeOpencodeAgent({
            taskDescription,
            workingDirectory: workspaceDir,
            abortSignal: req.signal,
          })) {
            updates.push(update);
            const data = `data: ${JSON.stringify(update)}\n\n`;
            controller.enqueue(encoder.encode(data));

            // Check if execution completed successfully
            if (update.type === 'complete' && update.success !== false) {
              executionSuccess = true;
            }
          }

          // Auto-save to Resources on successful completion
          if (executionSuccess) {
            try {
              const resourceName = generateResourceName(taskDescription);
              const [savedResource] = await db
                .insert(resource)
                .values({
                  userId: session.user.id,
                  name: resourceName,
                  description: `Auto-saved from: "${taskDescription.substring(0, 100)}"`,
                  resourceType: 'workflow',
                  content: {
                    task: taskDescription,
                    conversationId,
                    messageId,
                    executedAt: new Date().toISOString(),
                    updates: updates.slice(-10), // Keep last 10 updates for context
                  },
                  lastExecutedAt: new Date(),
                  executionCount: 1,
                })
                .returning();

              // Send resource saved event
              const savedData = `data: ${JSON.stringify({
                type: 'resource_saved',
                timestamp: Date.now(),
                resourceId: savedResource.id,
                resourceName: savedResource.name,
              })}\n\n`;
              controller.enqueue(encoder.encode(savedData));
            } catch (saveError) {
              console.error('Failed to auto-save resource:', saveError);
              // Don't fail the entire execution if save fails
            }
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
