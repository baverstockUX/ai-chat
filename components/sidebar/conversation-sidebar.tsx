'use client';

import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { SidebarHeader } from './sidebar-header';
import { ConversationSearch } from './conversation-search';
import { ConversationList } from './conversation-list';
import { useState } from 'react';
import type { Conversation } from '@/lib/db/schema';

/**
 * Main sidebar component with collapsible behavior
 * Fixed position on left (desktop) or overlay (mobile)
 * Smooth transition animations for open/close
 */
interface ConversationSidebarProps {
  conversations: Conversation[];
}

export function ConversationSidebar({ conversations }: ConversationSidebarProps) {
  const { isOpen } = useSidebarStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(conversations);

  return (
    <aside
      className={`
        flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-80' : 'w-0'}
      `}
      style={{ flexShrink: 0 }}
    >
      {isOpen && (
        <div className="flex flex-col h-full overflow-hidden">
          <SidebarHeader />
          <ConversationSearch
            onSearchChange={setSearchQuery}
            onFilteredResults={setFilteredConversations}
            allConversations={conversations}
          />
          <ConversationList conversations={filteredConversations} searchQuery={searchQuery} />
        </div>
      )}
    </aside>
  );
}
