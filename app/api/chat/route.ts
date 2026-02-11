import { auth } from '@/app/(auth)/auth';
import { streamText } from 'ai';
import { gemini } from '@/lib/ai/client';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  createConversation,
  getConversation,
  createMessage,
  generateConversationTitle,
  updateConversationTitle,
} from '@/lib/db/queries';
import { detectIntent } from '@/lib/ai/intent-classifier';
import type { AgentRequestMetadata } from '@/lib/types/agent';

// Note: Using Node.js runtime (not Edge) because postgres library requires Node.js APIs
// Edge Runtime doesn't support the postgres client used by Drizzle
// Streaming still works perfectly in Node.js runtime

// Prevent Vercel timeout on long streaming responses
export const maxDuration = 30;

/**
 * POST /api/chat - Streaming chat endpoint
 *
 * Accepts messages and optional conversationId.
 * Returns streaming AI response in Server-Sent Events format.
 * Saves messages to database after streaming completes.
 */
export async function POST(req: Request) {
  // Check authentication
  const session = await auth();

  if (!session || !session.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const { messages, conversationId } = body;

    // Validate messages array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response('Invalid messages', { status: 400 });
    }

    // Handle conversation management
    let activeConversationId = conversationId;

    if (conversationId) {
      // Verify conversation belongs to user
      const conv = await getConversation(conversationId, userId);
      if (!conv) {
        return new Response('Conversation not found or unauthorized', {
          status: 404,
        });
      }
    } else {
      // Create new conversation with temporary title
      // Will be updated after first message completes
      const newConv = await createConversation(userId, 'New conversation');
      activeConversationId = newConv.id;
    }

    // Get the user's latest message
    const userMessage = messages[messages.length - 1];

    // Detect intent before streaming
    const intent = await detectIntent(messages);

    // If intent is agent_summon, save agent request message and return JSON
    if (intent.intent === 'agent_summon') {
      // Save user message first
      await createMessage(activeConversationId, 'user', userMessage.content);

      // Save agent request message with metadata
      const agentMessage = await createMessage(
        activeConversationId,
        'assistant',
        intent.summary!,
        'agent_request',
        {
          summary: intent.summary,
          actions: intent.actions,
          destructive: intent.destructive,
          requiresExtraConfirm: intent.requiresExtraConfirm,
          requestedAt: new Date().toISOString(),
        } as AgentRequestMetadata
      );

      // Generate conversation title if first message
      if (!conversationId) {
        const title = generateConversationTitle(userMessage.content);
        await updateConversationTitle(activeConversationId, title);
      }

      // Return JSON response with agent request details
      const response = Response.json({
        type: 'agent_request',
        message: agentMessage,
      });

      // Include conversation ID in headers for client-side redirect
      if (!conversationId && activeConversationId) {
        response.headers.set('X-Conversation-Id', activeConversationId);
      }

      return response;
    }

    // For chat intent, continue with existing streamText flow
    // Stream AI response
    const result = streamText({
      model: gemini,
      messages,
      system: systemPrompt,
      abortSignal: req.signal,
      async onFinish({ text }) {
        // Save both user message and AI response to database
        try {
          // Save user message
          await createMessage(activeConversationId, 'user', userMessage.content);

          // Save AI response
          await createMessage(activeConversationId, 'assistant', text);

          // If this is the first message, generate a proper title
          if (!conversationId) {
            const title = generateConversationTitle(userMessage.content);
            await updateConversationTitle(activeConversationId, title);
          }
        } catch (error) {
          console.error('Error saving messages:', error);
          // Don't throw - streaming already completed successfully
        }
      },
    });

    // Return streaming response as UI message stream for useChat compatibility
    // toUIMessageStreamResponse() creates a structured stream that useChat can consume
    // Include conversation ID in headers for client-side redirect
    const response = result.toUIMessageStreamResponse();
    if (!conversationId && activeConversationId) {
      response.headers.set('X-Conversation-Id', activeConversationId);
    }
    return response;
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
