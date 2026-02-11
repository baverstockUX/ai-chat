'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { ConversationItem } from './conversation-item';
import type { Conversation } from '@/lib/db/schema';
import { MessageSquare, Sparkles } from 'lucide-react';
import { createConversation } from '@/app/(chat)/actions';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { isRedirectError } from '@/lib/utils';

/**
 * Conversation list component
 * Groups conversations into Pinned and Recent sections
 * Shows empty state with sample prompts when no conversations exist
 */
interface ConversationListProps {
  conversations: Conversation[];
  searchQuery: string;
}

const SAMPLE_PROMPTS = [
  'Help me automate a workflow',
  'Analyze this data',
  'Explain a complex concept',
  'Review my code',
];

export function ConversationList({ conversations, searchQuery }: ConversationListProps) {
  const [isPending, startTransition] = useTransition();

  const pinnedConversations = conversations.filter((conv) => conv.pinned);
  const recentConversations = conversations.filter((conv) => !conv.pinned);

  const handleSamplePrompt = (prompt: string) => {
    startTransition(async () => {
      try {
        // Pass prompt to server action - it will redirect with prompt in URL
        await createConversation(prompt);
      } catch (error) {
        // Ignore redirect errors (successful navigation)
        if (isRedirectError(error)) {
          return
        }
        console.error('Failed to create conversation:', error)
        toast.error('Failed to create conversation')
      }
    });
  };

  // Empty state
  if (conversations.length === 0 && !searchQuery) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Welcome!
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Start a conversation to get started
        </p>
        <div className="space-y-2 w-full">
          <p className="text-xs text-gray-400 dark:text-gray-600 mb-3">
            Try these prompts:
          </p>
          {SAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSamplePrompt(prompt)}
              disabled={isPending}
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 inline mr-2 text-blue-500" />
              {prompt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // No search results
  if (conversations.length === 0 && searchQuery) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No conversations found for "{searchQuery}"
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-4">
        {/* Pinned Section */}
        {pinnedConversations.length > 0 && (
          <div>
            <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Pinned
            </h3>
            <div className="space-y-1">
              {pinnedConversations.map((conversation) => (
                <ConversationItem key={conversation.id} conversation={conversation} />
              ))}
            </div>
          </div>
        )}

        {/* Recent Section */}
        {recentConversations.length > 0 && (
          <div>
            <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Recent
            </h3>
            <div className="space-y-1">
              {recentConversations.map((conversation) => (
                <ConversationItem key={conversation.id} conversation={conversation} />
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
