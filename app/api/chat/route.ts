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

// Use Edge Runtime for better streaming performance
export const runtime = 'edge';

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

    // Return streaming response with proper SSE headers
    // Include conversation ID in headers for client-side redirect
    const response = result.toTextStreamResponse();
    if (!conversationId && activeConversationId) {
      response.headers.set('X-Conversation-Id', activeConversationId);
    }
    return response;
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
