'use client';

import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { useMobile } from '@/lib/hooks/use-mobile';
import { SidebarHeader } from './sidebar-header';
import { ConversationSearch } from './conversation-search';
import { ConversationList } from './conversation-list';
import { UserMenu } from '@/components/auth/user-menu';
import { useState } from 'react';
import { X } from 'lucide-react';
import type { Conversation } from '@/lib/db/schema';

/**
 * Main sidebar component with collapsible behavior
 * Desktop: Fixed position on left, collapsible to icon-only (w-0)
 * Mobile: Full-screen overlay with backdrop, swipe-dismissible
 * Smooth transition animations for open/close
 * Includes user menu with logout at bottom
 */
interface ConversationSidebarProps {
  conversations: Conversation[];
  userEmail?: string;
}

export function ConversationSidebar({ conversations, userEmail }: ConversationSidebarProps) {
  const { isOpen, close } = useSidebarStore();
  const isMobile = useMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(conversations);

  const handleClose = () => {
    if (isMobile) {
      close();
    }
  };

  if (isMobile) {
    // Mobile: Full-screen overlay
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={handleClose}
            aria-hidden="true"
          />
        )}

        {/* Sidebar overlay */}
        <aside
          className={`
            fixed top-0 left-0 bottom-0 z-50 md:hidden
            flex flex-col w-full max-w-sm h-screen
            bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
            transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Mobile header with close button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Conversations</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <ConversationSearch
              onSearchChange={setSearchQuery}
              onFilteredResults={setFilteredConversations}
              allConversations={conversations}
            />
            <div className="flex-1 overflow-hidden">
              <ConversationList conversations={filteredConversations} searchQuery={searchQuery} />
            </div>
            <UserMenu userEmail={userEmail} />
          </div>
        </aside>
      </>
    );
  }

  // Desktop: Fixed sidebar with collapse
  return (
    <aside
      className={`
        hidden md:flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-80' : 'w-0'}
      `}
      style={{ flexShrink: 0 }}
    >
      {isOpen && (
        <div className="flex flex-col h-full overflow-hidden">
          <SidebarHeader showToggle={false} />
          <ConversationSearch
            onSearchChange={setSearchQuery}
            onFilteredResults={setFilteredConversations}
            allConversations={conversations}
          />
          <div className="flex-1 overflow-hidden">
            <ConversationList conversations={filteredConversations} searchQuery={searchQuery} />
          </div>
          <UserMenu userEmail={userEmail} />
        </div>
      )}
    </aside>
  );
}
