'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { Conversation } from '@/lib/db/schema';

/**
 * Conversation search component
 * Searches conversation titles (client-side filtering)
 * Real-time filtering with debouncing (300ms)
 * Keyboard shortcut: Cmd+K (Mac) or Ctrl+K (Windows)
 *
 * Note: Search is client-side only. For message content search,
 * would need to add a Server Action or API route.
 */
interface ConversationSearchProps {
  onSearchChange: (query: string) => void;
  onFilteredResults: (conversations: Conversation[]) => void;
  allConversations: Conversation[];
}

export function ConversationSearch({
  onSearchChange,
  onFilteredResults,
  allConversations,
}: ConversationSearchProps) {
  const [query, setQuery] = useState('');

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!query.trim()) {
        // No query - show all conversations
        onFilteredResults(allConversations);
        onSearchChange('');
        return;
      }

      // Client-side filtering by title
      const filtered = allConversations.filter((conv) =>
        conv.title.toLowerCase().includes(query.toLowerCase())
      );
      onFilteredResults(filtered);
      onSearchChange(query);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, allConversations, onFilteredResults, onSearchChange]);

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('conversation-search')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClear = () => {
    setQuery('');
    onFilteredResults(allConversations);
    onSearchChange('');
  };

  return (
    <div className="p-3 border-b border-gray-200 dark:border-gray-800">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        <input
          id="conversation-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations... (⌘K)"
          className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
}
