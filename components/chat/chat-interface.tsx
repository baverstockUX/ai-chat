'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageList } from './message-list-new';
import { MessageInput } from './message-input';
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
  const hasSentInitialPrompt = useRef(false);
  const [executingAgentMessageId, setExecutingAgentMessageId] = useState<string | null>(null);
  const [cancellingAgentMessageId, setCancellingAgentMessageId] = useState<string | null>(null);
  const agentControllerRef = useRef<AbortController | null>(null);
  const agentReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  // Abort streaming on unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const handleSend = useCallback(
    async (content: string, imageUrl?: string) => {
      if ((!content.trim() && !imageUrl) || isLoading) return;

      const userMessage = {
        id: crypto.randomUUID(),
        role: 'user' as const,
        content,
        createdAt: new Date(),
      };

      // Use functional update to avoid stale closure over messages
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        // Read current messages via functional ref to avoid stale closure
        const currentMessages = await new Promise<typeof messages>((resolve) => {
          setMessages((prev) => {
            resolve(prev);
            return prev;
          });
        });

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: currentMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            conversationId,
            imageUrl, // Pass imageUrl to API
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
            window.history.replaceState(null, '', `/${newConversationIdRef.current}`);
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

        // Create the assistant message placeholder and add it to state immediately
        const assistantMessageId = crypto.randomUUID();
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            role: 'assistant' as const,
            content: '',
            createdAt: new Date(),
          },
        ]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines from SSE stream
          let newlineIndex: number;
          let hasNewContent = false;
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
                hasNewContent = true;
              }
            } catch {
              // Ignore malformed lines
            }
          }

          // Update state incrementally so Streamdown can render progressively
          if (hasNewContent) {
            const snapshot = assistantText;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: snapshot }
                  : msg
              )
            );
          }
        }

        // For new conversations, use history.replaceState to update the URL
        // without triggering a full navigation/remount. This avoids the race
        // condition where router.push would re-fetch from the DB before the
        // onFinish callback has persisted the messages.
        if (!conversationId && newConversationIdRef.current) {
          window.history.replaceState(null, '', `/${newConversationIdRef.current}`);
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
    [conversationId, isLoading]
  );

  // Auto-send initial prompt (e.g., from sample prompt click)
  useEffect(() => {
    if (initialPrompt && messages.length === 0 && !hasSentInitialPrompt.current) {
      hasSentInitialPrompt.current = true;
      handleSend(initialPrompt);
    }
  }, [initialPrompt, messages.length, handleSend]);

  // Handle agent request approval
  const handleApprove = useCallback(
    async (messageId: string) => {
      if (!conversationId) return;

      let timeoutId: NodeJS.Timeout | null = null;

      try {
        // Track which agent message is executing
        setExecutingAgentMessageId(messageId);

        // Create AbortController for cancellation
        const controller = new AbortController();
        agentControllerRef.current = controller;

        const response = await fetch('/api/agent/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageId,
            conversationId,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          console.error('Failed to execute agent request');
          setExecutingAgentMessageId(null);
          agentControllerRef.current = null;
          return;
        }

        // Create progress message to show updates
        const progressMessageId = crypto.randomUUID();
        const progressMessage: ExtendedMessage = {
          id: progressMessageId,
          role: 'assistant',
          content: 'Starting agent execution...',
          createdAt: new Date(),
          messageType: 'agent_progress',
          metadata: { updates: [] },
        };
        setMessages((prev) => [...prev, progressMessage]);

        // Consume SSE stream and update progress message
        if (!response.body) {
          setExecutingAgentMessageId(null);
          agentControllerRef.current = null;
          return;
        }

        const reader = response.body.getReader();
        agentReaderRef.current = reader;
        const decoder = new TextDecoder();
        let buffer = '';
        const updates: any[] = [];

        // Set timeout for execution (match API maxDuration of 60s)
        timeoutId = setTimeout(() => {
          // If still executing after 60s, show timeout message
          if (agentControllerRef.current) {
            agentControllerRef.current.abort();

            const timeoutMessage: ExtendedMessage = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: 'Agent execution timed out after 60 seconds. The task may still be running in the background.',
              createdAt: new Date(),
              messageType: 'agent_result',
            };
            setMessages((prev) => [...prev, timeoutMessage]);

            setExecutingAgentMessageId(null);
            agentControllerRef.current = null;
            agentReaderRef.current = null;
          }
        }, 60000);

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
              const update = JSON.parse(jsonPart);
              updates.push(update);

              // Build content from updates
              let content = '';
              for (const u of updates) {
                if (u.type === 'text') {
                  content += `\n${u.content}`;
                } else if (u.type === 'tool_call') {
                  content += `\n🔧 ${u.content}`;
                } else if (u.type === 'tool_result') {
                  content += `\n${u.success ? '✅' : '❌'} ${u.content}`;
                } else if (u.type === 'complete') {
                  content += `\n\n${u.content}`;
                }
              }

              // Update progress message
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === progressMessageId
                    ? { ...msg, content: content.trim(), metadata: { updates } }
                    : msg
                )
              );
            } catch {
              // Ignore malformed lines
            }
          }
        }

        // Clear timeout on successful completion
        clearTimeout(timeoutId);

        // Cleanup after completion
        setExecutingAgentMessageId(null);
        agentControllerRef.current = null;
        agentReaderRef.current = null;
      } catch (error) {
        // Clear timeout on error
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if ((error as Error).name !== 'AbortError') {
          console.error('Error approving agent request:', error);
        }
        setExecutingAgentMessageId(null);
        agentControllerRef.current = null;
        agentReaderRef.current = null;
      }
    },
    [conversationId]
  );

  // Handle agent request cancellation (before execution starts)
  const handleCancel = useCallback(
    async (messageId: string) => {
      // Send a follow-up message asking for alternatives
      const cancelMessage =
        'I changed my mind. Can you suggest alternative approaches or help me in a different way?';
      await handleSend(cancelMessage);
    },
    [handleSend]
  );

  // Handle agent execution cancellation (during execution)
  const handleCancelExecution = useCallback(
    async (messageId: string) => {
      if (!agentControllerRef.current || executingAgentMessageId !== messageId) {
        return;
      }

      setCancellingAgentMessageId(messageId);

      // Abort the fetch request
      agentControllerRef.current.abort();

      // Cancel the reader
      if (agentReaderRef.current) {
        try {
          await agentReaderRef.current.cancel();
        } catch {
          // Ignore cancellation errors
        }
      }

      // Cleanup
      agentControllerRef.current = null;
      agentReaderRef.current = null;
      setExecutingAgentMessageId(null);
      setCancellingAgentMessageId(null);

      // Add cancellation confirmation message
      const cancellationMessage: ExtendedMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Agent execution cancelled by user.',
        createdAt: new Date(),
        messageType: 'agent_result',
      };
      setMessages((prev) => [...prev, cancellationMessage]);
    },
    [executingAgentMessageId]
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
        onCancelExecution={handleCancelExecution}
        executingAgentMessageId={executingAgentMessageId}
        cancellingAgentMessageId={cancellingAgentMessageId}
      />
      <MessageInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
