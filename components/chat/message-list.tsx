'use client';

import { useEffect, useRef } from 'react';
import type { UIMessage } from '@ai-sdk/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Message } from './message';
import { TypingIndicator } from './typing-indicator';
import { isWithinTimeThreshold } from '@/lib/utils';

type SimpleMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
};

interface MessageListProps {
  messages: UIMessage[] | SimpleMessage[];
  isLoading: boolean;
}

/**
 * Scrollable message list container
 * Features:
 * - Auto-scrolls to bottom on new messages
 * - Groups consecutive messages from same sender within 5 minutes
 * - Shows typing indicator when AI is generating response
 * - Empty state when no messages
 */
export function MessageList({ messages, isLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Determine if message should be grouped with previous message
  const shouldGroupWithPrevious = (currentIndex: number): boolean => {
    if (currentIndex === 0) return false;

    const currentMessage = messages[currentIndex];
    const previousMessage = messages[currentIndex - 1];

    // Type guard to check if messages have createdAt
    const hasCreatedAt = (msg: UIMessage | SimpleMessage): msg is SimpleMessage => {
      return 'createdAt' in msg && msg.createdAt instanceof Date;
    };

    // Same role and within time threshold (5 minutes)
    if (currentMessage.role === previousMessage.role) {
      // Only check time threshold if both messages have createdAt
      if (hasCreatedAt(previousMessage) && hasCreatedAt(currentMessage)) {
        return isWithinTimeThreshold(previousMessage.createdAt, currentMessage.createdAt, 5);
      }
      // If no timestamps, group consecutive messages from same role
      return true;
    }

    return false;
  };

  return (
    <ScrollArea className="flex-1 h-full">
      <div ref={scrollRef} className="p-4 min-h-full">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-muted-foreground">
                <p className="text-lg font-medium mb-2">No messages yet</p>
                <p className="text-sm">Start a conversation by typing a message below!</p>
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((message, index) => (
            <Message
              key={message.id}
              // Message component gracefully handles both UIMessage (with parts)
              // and SimpleMessage (with content) shapes
              message={message as UIMessage}
              isGrouped={shouldGroupWithPrevious(index)}
            />
          ))}

          {/* Typing indicator - show when loading and last message is from user */}
          {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-3">
              <div className="w-8" /> {/* Spacer for alignment with AI messages */}
              <TypingIndicator />
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      </div>
    </ScrollArea>
  );
}
