'use client';

import { PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';
import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { createConversation } from '@/app/(chat)/actions';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { isRedirectError } from '@/lib/utils';

/**
 * Sidebar header component
 * Contains new conversation button and collapse toggle
 */
interface SidebarHeaderProps {
  showToggle?: boolean;
}

export function SidebarHeader({ showToggle = true }: SidebarHeaderProps = {}) {
  const { isOpen, toggle } = useSidebarStore();
  const [isPending, startTransition] = useTransition();

  const handleNewConversation = () => {
    startTransition(async () => {
      try {
        await createConversation();
      } catch (error) {
        // Ignore redirect errors (successful navigation)
        if (isRedirectError(error)) {
          return;
        }
        console.error('Failed to create conversation:', error);
        toast.error('Failed to create conversation');
      }
    });
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Conversations
      </h2>
      <div className="flex items-center gap-2">
        <button
          onClick={handleNewConversation}
          disabled={isPending}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          aria-label="New conversation"
          title="New conversation"
        >
          <Plus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        {showToggle && (
          <button
            onClick={toggle}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? (
              <PanelLeftClose className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <PanelLeftOpen className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
