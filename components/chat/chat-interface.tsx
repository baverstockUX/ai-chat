'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { Message as DBMessage } from '@/lib/db/schema';
import { useRouter } from 'next/navigation';
import { useMobile } from '@/lib/hooks/use-mobile';
import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { Menu } from 'lucide-react';
import { useRef } from 'react';

// Serialized message type for client components (dates as strings)
type SerializedMessage = Omit<DBMessage, 'createdAt'> & {
  createdAt: string | Date;
};

interface ChatInterfaceProps {
  conversationId?: string;
  initialMessages?: SerializedMessage[];
  conversationTitle?: string;
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
}: ChatInterfaceProps) {
  const router = useRouter();
  const isMobile = useMobile();
  const { setIsOpen } = useSidebarStore();
  const newConversationIdRef = useRef<string | null>(null);

  const { messages, sendMessage, status, stop } = useChat({
    api: '/api/chat',
    body: { conversationId },
    // Convert DB messages to AI SDK format - use 'messages' not 'initialMessages'
    messages: initialMessages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: new Date(msg.createdAt),
    })),
    async onResponse(response) {
      // For new conversations, capture the conversation ID from response headers
      // We'll redirect after streaming completes in onFinish
      if (!conversationId) {
        const newConversationId = response.headers.get('X-Conversation-Id');
        if (newConversationId) {
          newConversationIdRef.current = newConversationId;
        }
      }
    },
    onFinish() {
      // Redirect after streaming completes so the AI message displays properly
      if (!conversationId && newConversationIdRef.current) {
        router.push(`/${newConversationIdRef.current}`);
        newConversationIdRef.current = null;
      }
    },
  });

  const handleSend = (content: string) => {
    sendMessage({ role: 'user', content });
  };

  const isLoading = status === 'submitted' || status === 'streaming';

  return (
    <div className="flex flex-col h-screen">
      {/* Mobile header */}
      {isMobile && (
        <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 md:hidden">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {conversationTitle}
          </h1>
        </header>
      )}

      <MessageList messages={messages} isLoading={isLoading} />
      <MessageInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
