'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useSidebarStore } from '@/lib/stores/sidebar-store';
import {
  MessageSquarePlus,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Edit,
  Pin,
  PinOff,
  LogOut,
  MessageSquare,
} from 'lucide-react';

/**
 * Command palette using cmdk
 * Opens with Cmd/Ctrl + K
 * Provides quick access to common actions with fuzzy search
 *
 * Actions:
 * - New Conversation
 * - Search Conversations
 * - Toggle Sidebar
 * - Delete Conversation
 * - Rename Conversation
 * - Pin/Unpin Conversation
 * - Logout
 * - Recent Conversations (quick navigation)
 */

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  conversations: Array<{
    id: string;
    title: string;
    isPinned: boolean;
  }>;
  onNewConversation: () => void;
  onFocusSearch: () => void;
  onDeleteConversation?: () => void;
  onRenameConversation?: () => void;
  onTogglePin?: () => void;
  onLogout: () => void;
  isPinned?: boolean;
}

export function CommandPalette({
  isOpen,
  onClose,
  conversationId,
  conversations,
  onNewConversation,
  onFocusSearch,
  onDeleteConversation,
  onRenameConversation,
  onTogglePin,
  onLogout,
  isPinned = false,
}: CommandPaletteProps) {
  const router = useRouter();
  const { toggle: toggleSidebar, isOpen: sidebarIsOpen } = useSidebarStore();
  const [search, setSearch] = React.useState('');

  // Close on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset search when opening
  React.useEffect(() => {
    if (isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Get recent conversations (limit to 5)
  const recentConversations = conversations.slice(0, 5);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl">
        <Command
          className="rounded-lg border border-gray-700 bg-gray-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center border-b border-gray-700 px-4">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">
              No results found.
            </Command.Empty>

            {/* Actions Group */}
            <Command.Group heading="Actions" className="px-2 py-2 text-xs font-semibold text-gray-400">
              <Command.Item
                onSelect={() => handleAction(onNewConversation)}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 aria-selected:bg-gray-700"
              >
                <MessageSquarePlus className="h-4 w-4" />
                <span>New Conversation</span>
                <kbd className="ml-auto inline-flex h-5 items-center gap-1 rounded border border-gray-600 bg-gray-900 px-1.5 text-xs font-medium text-gray-400">
                  <span className="text-xs">⌘</span>N
                </kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => handleAction(onFocusSearch)}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 aria-selected:bg-gray-700"
              >
                <Search className="h-4 w-4" />
                <span>Search Conversations</span>
                <kbd className="ml-auto inline-flex h-5 items-center gap-1 rounded border border-gray-600 bg-gray-900 px-1.5 text-xs font-medium text-gray-400">
                  <span className="text-xs">⌘</span>F
                </kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => handleAction(toggleSidebar)}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 aria-selected:bg-gray-700"
              >
                {sidebarIsOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
                <span>Toggle Sidebar</span>
                <kbd className="ml-auto inline-flex h-5 items-center gap-1 rounded border border-gray-600 bg-gray-900 px-1.5 text-xs font-medium text-gray-400">
                  <span className="text-xs">⌘</span>B
                </kbd>
              </Command.Item>
            </Command.Group>

            {/* Conversation Actions Group (only if conversationId exists) */}
            {conversationId && (
              <Command.Group heading="Conversation" className="px-2 py-2 text-xs font-semibold text-gray-400">
                {onRenameConversation && (
                  <Command.Item
                    onSelect={() => handleAction(onRenameConversation)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 aria-selected:bg-gray-700"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Rename Conversation</span>
                    <kbd className="ml-auto inline-flex h-5 items-center gap-1 rounded border border-gray-600 bg-gray-900 px-1.5 text-xs font-medium text-gray-400">
                      <span className="text-xs">⌘</span>R
                    </kbd>
                  </Command.Item>
                )}

                {onTogglePin && (
                  <Command.Item
                    onSelect={() => handleAction(onTogglePin)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 aria-selected:bg-gray-700"
                  >
                    {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    <span>{isPinned ? 'Unpin' : 'Pin'} Conversation</span>
                  </Command.Item>
                )}

                {onDeleteConversation && (
                  <Command.Item
                    onSelect={() => handleAction(onDeleteConversation)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 hover:bg-gray-700 aria-selected:bg-gray-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Conversation</span>
                    <kbd className="ml-auto inline-flex h-5 items-center gap-1 rounded border border-gray-600 bg-gray-900 px-1.5 text-xs font-medium text-gray-400">
                      <span className="text-xs">⌘</span>
                      <span className="text-xs">⇧</span>D
                    </kbd>
                  </Command.Item>
                )}
              </Command.Group>
            )}

            {/* Recent Conversations Group */}
            {recentConversations.length > 0 && (
              <Command.Group heading="Recent Conversations" className="px-2 py-2 text-xs font-semibold text-gray-400">
                {recentConversations.map((conv) => (
                  <Command.Item
                    key={conv.id}
                    onSelect={() => handleAction(() => router.push(`/chat/${conv.id}`))}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 aria-selected:bg-gray-700"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="truncate">{conv.title}</span>
                    {conv.isPinned && <Pin className="ml-auto h-3 w-3 text-blue-400" />}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Account Group */}
            <Command.Group heading="Account" className="px-2 py-2 text-xs font-semibold text-gray-400">
              <Command.Item
                onSelect={() => handleAction(onLogout)}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 aria-selected:bg-gray-700"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
