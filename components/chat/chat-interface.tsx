'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { Message as DBMessage } from '@/lib/db/schema';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ChatInterfaceProps {
  conversationId?: string;
  initialMessages?: DBMessage[];
}

/**
 * Main chat interface using AI SDK's useChat hook
 * Features:
 * - Streaming AI responses
 * - Message history display
 * - Fixed bottom input
 * - Auto-save messages via API route
 * - Redirects to conversation URL after first message
 */
export function ChatInterface({
  conversationId,
  initialMessages = [],
}: ChatInterfaceProps) {
  const router = useRouter();

  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { conversationId },
    }),
    // Convert DB messages to AI SDK format
    initialMessages: initialMessages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt,
    })),
    async onResponse(response) {
      // For new conversations, get conversation ID from response and redirect
      if (!conversationId) {
        const newConversationId = response.headers.get('X-Conversation-Id');
        if (newConversationId) {
          router.push(`/${newConversationId}`);
        }
      }
    },
  });

  const handleSend = (content: string) => {
    sendMessage({ text: content });
  };

  const isLoading = status === 'submitted' || status === 'streaming';

  return (
    <div className="flex flex-col h-screen">
      <MessageList messages={messages} isLoading={isLoading} />
      <MessageInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
