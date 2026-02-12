'use client';

import type { UIMessage } from '@ai-sdk/react';
import { Conversation, ConversationContent } from '@/components/ai/conversation';
import { Message } from '@/components/ai/message';
import { MessageContent } from './message-content';
import { Loader } from '@/components/ai/loader';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { isWithinTimeThreshold } from '@/lib/utils';
import { Suggestions } from '@/components/ai/suggestion';

type SimpleMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  messageType?: 'text' | 'agent_request' | 'agent_progress' | 'agent_result';
  metadata?: unknown;
};

interface MessageListProps {
  messages: UIMessage[] | SimpleMessage[];
  isLoading: boolean;
  onSuggestionSelect?: (text: string) => void;
  conversationId?: string;
  onApprove?: (messageId: string) => Promise<void>;
  onCancel?: (messageId: string) => Promise<void>;
  onCancelExecution?: (messageId: string) => Promise<void>;
  executingAgentMessageId?: string | null;
  cancellingAgentMessageId?: string | null;
}

const SAMPLE_SUGGESTIONS = [
  'Explain quantum computing in simple terms',
  'Write a haiku about artificial intelligence',
  'Help me debug a React component',
  'Suggest a healthy meal plan for the week',
  'Explain the difference between let, const, and var',
  'Create a SQL query to join two tables',
];

/**
 * Enhanced message list with AI components
 * Features:
 * - Production-quality message display
 * - Better loading states
 * - Prompt suggestions in empty state
 * - Smooth auto-scroll
 * - Message grouping
 */
export function MessageList({
  messages,
  isLoading,
  onSuggestionSelect,
  conversationId,
  onApprove,
  onCancel,
  onCancelExecution,
  executingAgentMessageId,
  cancellingAgentMessageId,
}: MessageListProps) {
  // Determine if message should be grouped with previous
  const shouldGroupWithPrevious = (currentIndex: number): boolean => {
    if (currentIndex === 0) return false;

    const currentMessage = messages[currentIndex];
    const previousMessage = messages[currentIndex - 1];

    const hasCreatedAt = (msg: UIMessage | SimpleMessage): msg is SimpleMessage => {
      return 'createdAt' in msg && msg.createdAt instanceof Date;
    };

    if (currentMessage.role === previousMessage.role) {
      if (hasCreatedAt(previousMessage) && hasCreatedAt(currentMessage)) {
        return isWithinTimeThreshold(previousMessage.createdAt, currentMessage.createdAt, 5);
      }
      return true;
    }

    return false;
  };

  const handleSuggestionSelect = (text: string) => {
    onSuggestionSelect?.(text);
  };

  return (
    <Conversation>
      <ConversationContent>
        {/* Empty state with suggestions */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="text-center mb-8 max-w-md">
              <h2 className="text-2xl font-semibold mb-2 text-foreground">
                Start a conversation
              </h2>
              <p className="text-muted-foreground">
                Choose a prompt below or type your own message
              </p>
            </div>
            <Suggestions
              suggestions={SAMPLE_SUGGESTIONS}
              onSelect={handleSuggestionSelect}
              className="max-w-3xl w-full"
            />
          </div>
        )}

        {/* Message list */}
        {messages.map((message, index) => {
          const simpleMessage = message as SimpleMessage;

          // Use MessageContent for agent_request messages
          if (simpleMessage.messageType === 'agent_request') {
            return (
              <div key={message.id} className="mb-4">
                <MessageContent
                  message={simpleMessage}
                  conversationId={conversationId}
                  onApprove={onApprove}
                  onCancel={onCancel}
                  onCancelExecution={onCancelExecution}
                  isExecuting={executingAgentMessageId === message.id}
                  isCancelling={cancellingAgentMessageId === message.id}
                />
              </div>
            );
          }

          // Use MessageContent for agent_progress messages
          if (simpleMessage.messageType === 'agent_progress') {
            return (
              <div key={message.id} className="mb-4">
                <MessageContent
                  message={simpleMessage}
                  conversationId={conversationId}
                  onApprove={onApprove}
                  onCancel={onCancel}
                  onCancelExecution={onCancelExecution}
                  isExecuting={executingAgentMessageId === message.id}
                  isCancelling={cancellingAgentMessageId === message.id}
                />
              </div>
            );
          }

          // Use existing Message component for text messages
          return (
            <Message
              key={message.id}
              message={message as UIMessage}
              isGrouped={shouldGroupWithPrevious(index)}
            />
          );
        })}

        {/* Loading indicator */}
        {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-xs font-medium">
                AI
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pt-1">
              <Loader />
            </div>
          </div>
        )}
      </ConversationContent>
    </Conversation>
  );
}
