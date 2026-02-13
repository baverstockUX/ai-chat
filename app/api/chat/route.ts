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
  formatContextForPrompt,
} from '@/lib/db/queries';
import { detectIntent } from '@/lib/ai/intent-classifier';
import { extractContext } from '@/lib/ai/context-extractor';
import { searchWeb } from '@/lib/integrations/search/duckduckgo';
import type { AgentRequestMetadata } from '@/lib/types/agent';
import { readFile } from 'fs/promises';
import { join } from 'path';

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
    const { messages, conversationId, imageUrl } = body;

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
    const userMessageContent = userMessage?.content || '';

    // Load context for this conversation
    const contextPrompt = await formatContextForPrompt(activeConversationId);

    // Detect search intent and fetch search results
    let searchContext = '';
    const lowerMessage = userMessageContent.toLowerCase();

    // Check for search keywords
    const shouldSearch =
      lowerMessage.includes('search for') ||
      lowerMessage.includes('search ') ||
      lowerMessage.includes('look up') ||
      lowerMessage.includes('find information about') ||
      lowerMessage.startsWith('search:');

    if (shouldSearch) {
      console.log('[Chat API] Search keywords detected in message:', userMessageContent);

      // Extract search query - try multiple patterns
      let searchQuery: string | null = null;

      // Pattern 1: "search for X" or "search X"
      let match = userMessageContent.match(/search\s+(?:for\s+)?(.+?)(?:\?|$)/i);
      if (match) {
        searchQuery = match[1].trim();
      }

      // Pattern 2: "look up X"
      if (!searchQuery) {
        match = userMessageContent.match(/look\s+up\s+(.+?)(?:\?|$)/i);
        if (match) {
          searchQuery = match[1].trim();
        }
      }

      // Pattern 3: "find information about X"
      if (!searchQuery) {
        match = userMessageContent.match(/find\s+information\s+about\s+(.+?)(?:\?|$)/i);
        if (match) {
          searchQuery = match[1].trim();
        }
      }

      if (searchQuery) {
        console.log('[Chat API] Extracted search query:', searchQuery);

        try {
          console.log('[Chat API] Calling searchWeb...');
          const results = await searchWeb(searchQuery);
          console.log(`[Chat API] Search returned ${results.length} results`);

          // Format results for AI context injection
          searchContext = results.length > 0
            ? `\n\nWeb search results for "${searchQuery}":\n\n${results
                .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`)
                .join('\n\n')}`
            : `\n\nNo web search results found for "${searchQuery}"`;
        } catch (error) {
          console.error('[Chat API] Search integration error:', error);
        }
      } else {
        console.log('[Chat API] Could not extract search query from message');
      }
    }

    // Detect intent before streaming
    console.log('[Chat API] Calling detectIntent...');
    const intentStartTime = Date.now();
    const intent = await detectIntent(messages);
    console.log(`[Chat API] detectIntent completed in ${Date.now() - intentStartTime}ms`);
    console.log('[Chat API] Intent result:', JSON.stringify(intent, null, 2));

    // If intent is agent_summon, save agent request message and return JSON
    if (intent.intent === 'agent_summon') {
      // Save user message first with attachments if present
      const attachments = imageUrl ? [{ type: 'image', url: imageUrl }] : undefined;
      await createMessage(activeConversationId, 'user', userMessage.content, 'text', undefined, attachments);

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
    // Build multimodal messages array if image is attached
    // If imageUrl is provided, read and convert to base64
    let imageBase64: string | undefined;
    if (imageUrl) {
      try {
        // imageUrl is like "/uploads/images/filename.png"
        // Convert to absolute file system path
        const imagePath = join(process.cwd(), 'public', imageUrl);
        const imageBuffer = await readFile(imagePath);
        imageBase64 = imageBuffer.toString('base64');
      } catch (error) {
        console.error('Error reading image file:', error);
        // Continue without image if file can't be read
      }
    }

    const aiMessages = messages.map((m: any) => {
      // If this is the latest message with an image attachment, use multimodal format
      if (m === userMessage && imageBase64) {
        return {
          role: m.role,
          content: [
            { type: 'text', text: m.content },
            { type: 'image', image: imageBase64 }
          ]
        };
      }
      // Standard text-only message
      return {
        role: m.role,
        content: m.content
      };
    });

    // Stream AI response
    const result = streamText({
      model: gemini,
      messages: aiMessages,
      system: systemPrompt + contextPrompt + searchContext, // Inject context and search results
      abortSignal: req.signal,
      async onFinish({ text }) {
        // Save both user message and AI response to database
        try {
          // Save user message with attachments if present
          const attachments = imageUrl ? [{ type: 'image', url: imageUrl }] : undefined;
          await createMessage(activeConversationId, 'user', userMessage.content, 'text', undefined, attachments);

          // Save AI response
          await createMessage(activeConversationId, 'assistant', text);

          // If this is the first message, generate a proper title
          if (!conversationId) {
            const title = generateConversationTitle(userMessage.content);
            await updateConversationTitle(activeConversationId, title);
          }

          // Extract and store context from conversation
          try {
            await extractContext(activeConversationId, messages);
          } catch (error) {
            console.error('Context extraction failed:', error);
            // Don't fail the response if context extraction errors
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
