import { auth } from '@/app/(auth)/auth';
import { NextResponse } from 'next/server';

/**
 * POST /api/agent/execute - Agent execution endpoint (stub)
 *
 * Accepts approved agent requests and triggers execution.
 * Full implementation will be added in Plan 02-05.
 *
 * For now, returns success to prevent client errors when clicking Proceed.
 */
export async function POST(req: Request) {
  // Check authentication
  const session = await auth();

  if (!session || !session.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { messageId, conversationId } = body;

    // Validate request
    if (!messageId || !conversationId) {
      return new Response('Missing messageId or conversationId', { status: 400 });
    }

    // TODO (Plan 02-05): Implement agent execution logic
    // - Retrieve agent request message and metadata
    // - Execute requested actions
    // - Stream progress updates
    // - Save agent_result message

    console.log('Agent execution requested:', { messageId, conversationId });

    // Return success for now
    return NextResponse.json({
      status: 'pending',
      message: 'Agent execution will be implemented in Plan 02-05',
    });
  } catch (error) {
    console.error('Agent execution error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
