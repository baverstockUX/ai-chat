'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageList } from './message-list-new';
import { MessageInput } from './message-input-new';
import { Message as DBMessage } from '@/lib/db/schema';
import { useRouter } from 'next/navigation';
import { useMobile } from '@/lib/hooks/use-mobile';
import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { Menu } from 'lucide-react';
import type { AgentRequestMetadata } from '@/lib/types/agent';

// Serialized message type for client components (dates as strings)
type SerializedMessage = Omit<DBMessage, 'createdAt'> & {
  createdAt: string | Date;
};

// Extended message type to support agent orchestration
interface ExtendedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  messageType?: 'text' | 'agent_request' | 'agent_progress' | 'agent_result';
  metadata?: unknown;
}

interface ChatInterfaceProps {
  conversationId?: string;
  initialMessages?: SerializedMessage[];
  conversationTitle?: string;
  initialPrompt?: string;
}

/**
 * Main chat interface using AI SDK's useChat hook
 * Features:
 * - Streaming AI responses
 * - Message history display
 * - Fixed bottom input
 * - Auto-save messages via API route
 * - Redirects to conversation URL after first message
 * - Mobile header with menu button (opens sidebar)
 */
export function ChatInterface({
  conversationId,
  initialMessages = [],
  conversationTitle = 'New Conversation',
  initialPrompt,
}: ChatInterfaceProps) {
  const router = useRouter();
  const isMobile = useMobile();
  const { toggle: toggleSidebar } = useSidebarStore();
  const [messages, setMessages] = useState<ExtendedMessage[]>(
    initialMessages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: new Date(msg.createdAt),
      messageType: msg.messageType || 'text',
      metadata: msg.metadata,
    }))
  );
  const [isLoading, setIsLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const newConversationIdRef = useRef<string | null>(null);

  // Abort streaming on unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage = {
        id: crypto.randomUUID(),
        role: 'user' as const,
        content,
        createdAt: new Date(),
      };

      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setIsLoading(true);

      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: nextMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            conversationId,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          setIsLoading(false);
          return;
        }

        // Capture new conversation id if this was a new conversation
        if (!conversationId) {
          const newConversationId = response.headers.get('X-Conversation-Id');
          if (newConversationId) {
            newConversationIdRef.current = newConversationId;
            // Don't redirect yet - wait for response to complete
          }
        }

        // Check if response is JSON (agent_request) or streaming (text)
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          // Handle agent_request JSON response
          const data = await response.json();
          if (data.type === 'agent_request' && data.message) {
            const agentMessage: ExtendedMessage = {
              id: data.message.id,
              role: 'assistant',
              content: data.message.content,
              createdAt: new Date(data.message.createdAt),
              messageType: 'agent_request',
              metadata: data.message.metadata,
            };
            setMessages((prev) => [...prev, agentMessage]);
          }

          // Redirect after agent request if new conversation
          if (!conversationId && newConversationIdRef.current) {
            router.push(`/${newConversationIdRef.current}`);
            newConversationIdRef.current = null;
          }

          setIsLoading(false);
          return;
        }

        // Handle streaming response (text messages)
        if (!response.body) {
          setIsLoading(false);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = '';
        let buffer = '';

        // Create streaming message with temp ID
        const streamingMessageId = crypto.randomUUID();
        const streamingMessage = {
          id: streamingMessageId,
          role: 'assistant' as const,
          content: '',
          createdAt: new Date(),
        };

        // Add empty streaming message to state immediately
        setMessages((prev) => [...prev, streamingMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines from SSE stream
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);

            if (!line.startsWith('data:')) continue;

            const jsonPart = line.slice('data:'.length).trim();
            if (!jsonPart) continue;

            try {
              const event = JSON.parse(jsonPart) as { type?: string; delta?: unknown };

              if (event.type === 'text-delta' && typeof event.delta === 'string') {
                assistantText += event.delta;

                // Update streaming message in state immediately
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === streamingMessageId
                      ? { ...msg, content: assistantText }
                      : msg
                  )
                );
              }
            } catch {
              // Ignore malformed lines
            }
          }
        }

        // Streaming message already in state with final content
        // Just ensure it has the final text (in case last chunk was missed)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingMessageId
              ? { ...msg, content: assistantText }
              : msg
          )
        );

        // Now redirect after streaming completes and messages are in local state
        if (!conversationId && newConversationIdRef.current) {
          router.push(`/${newConversationIdRef.current}`);
          newConversationIdRef.current = null;
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sending message', err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, isLoading, messages, router]
  );

  // Auto-send initial prompt (e.g., from sample prompt click)
  useEffect(() => {
    if (initialPrompt && messages.length === 0) {
      console.log('[ChatInterface] Auto-sending initial prompt:', initialPrompt);
      handleSend(initialPrompt);
    }
  }, [initialPrompt, messages.length, handleSend]);

  // Handle agent request approval
  const handleApprove = useCallback(
    async (messageId: string) => {
      if (!conversationId) return;

      try {
        const response = await fetch('/api/agent/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageId,
            conversationId,
          }),
        });

        if (!response.ok) {
          console.error('Failed to execute agent request');
          return;
        }

        // Agent execution will be handled in Plan 02-05
        // For now, just mark the request as approved
        console.log('Agent request approved:', messageId);
      } catch (error) {
        console.error('Error approving agent request:', error);
      }
    },
    [conversationId]
  );

  // Handle agent request cancellation
  const handleCancel = useCallback(
    async (messageId: string) => {
      // Send a follow-up message asking for alternatives
      const cancelMessage =
        'I changed my mind. Can you suggest alternative approaches or help me in a different way?';
      await handleSend(cancelMessage);
    },
    [handleSend]
  );

  return (
    <div className="flex flex-col h-screen">
      {/* Mobile header */}
      {isMobile && (
        <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 md:hidden">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {conversationTitle}
          </h1>
        </header>
      )}

      <MessageList
        messages={messages}
        isLoading={isLoading}
        onSuggestionSelect={handleSend}
        conversationId={conversationId}
        onApprove={handleApprove}
        onCancel={handleCancel}
      />
      <MessageInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
