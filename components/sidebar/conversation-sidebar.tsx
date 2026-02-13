'use client';

import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { useMobile } from '@/lib/hooks/use-mobile';
import { SidebarHeader } from './sidebar-header';
import { ConversationSearch } from './conversation-search';
import { ConversationList } from './conversation-list';
import { UserMenu } from '@/components/auth/user-menu';
import { useState, useTransition } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, BookMarked } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/lib/db/schema';
import { createConversation } from '@/app/(chat)/actions';
import { toast } from 'sonner';
import { isRedirectError } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  const { isOpen, toggle, close } = useSidebarStore();
  const isMobile = useMobile();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(conversations);
  const [isPending, startTransition] = useTransition();

  const handleClose = () => {
    if (isMobile) {
      close();
    }
  };

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
            {/* Mobile header with new chat and close button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Conversations</h2>
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
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <ConversationSearch
              onSearchChange={setSearchQuery}
              onFilteredResults={setFilteredConversations}
              allConversations={conversations}
            />

            {/* Resources Link */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800">
              <Link
                href="/resources"
                onClick={handleClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  pathname === '/resources'
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                )}
              >
                <BookMarked className="w-5 h-5" />
                <span className="font-medium">Resources</span>
              </Link>
            </div>

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
      className={cn(
        "hidden md:flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800",
        "transition-all duration-300 ease-in-out relative",
        isOpen ? "w-80" : "w-0"
      )}
      style={{ flexShrink: 0 }}
    >
      {/* Toggle button - always visible */}
      <button
        onClick={toggle}
        className={cn(
          "absolute top-4 p-2 transition-all duration-200 z-50",
          "hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg",
          "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm",
          isOpen ? "right-4" : "left-4"
        )}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isOpen ? (
          <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        )}
      </button>
      {isOpen && (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Desktop header with new chat button */}
          <div className="flex items-center justify-between p-4 pr-14 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Conversations
            </h2>
            <button
              onClick={handleNewConversation}
              disabled={isPending}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              aria-label="New conversation"
              title="New conversation"
            >
              <Plus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
          <ConversationSearch
            onSearchChange={setSearchQuery}
            onFilteredResults={setFilteredConversations}
            allConversations={conversations}
          />

          {/* Resources Link */}
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800">
            <Link
              href="/resources"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                pathname === '/resources'
                  ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              )}
            >
              <BookMarked className="w-5 h-5" />
              <span className="font-medium">Resources</span>
            </Link>
          </div>

          <div className="flex-1 overflow-hidden">
            <ConversationList conversations={filteredConversations} searchQuery={searchQuery} />
          </div>
          <UserMenu userEmail={userEmail} />
        </div>
      )}
    </aside>
  );
}
