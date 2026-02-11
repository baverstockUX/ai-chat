'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebarStore } from '@/lib/stores/sidebar-store';

/**
 * Global keyboard shortcut handler
 * Handles platform-specific shortcuts (Cmd on Mac, Ctrl on Windows/Linux)
 *
 * Keyboard shortcuts:
 * - Cmd/Ctrl + K: Open command palette
 * - Cmd/Ctrl + N: New conversation
 * - Cmd/Ctrl + F: Focus search
 * - Cmd/Ctrl + B: Toggle sidebar
 * - Cmd/Ctrl + Shift + D: Delete current conversation (with confirmation)
 * - Cmd/Ctrl + R: Rename current conversation
 * - Esc: Close dialogs, blur input, exit search
 * - Arrow Up/Down: Navigate conversation list
 * - Enter: Open selected conversation
 */

interface KeyboardHandlerProps {
  conversationId?: string;
  onOpenCommandPalette: () => void;
  onNewConversation: () => void;
  onFocusSearch: () => void;
  onDeleteConversation?: () => void;
  onRenameConversation?: () => void;
}

export function KeyboardHandler({
  conversationId,
  onOpenCommandPalette,
  onNewConversation,
  onFocusSearch,
  onDeleteConversation,
  onRenameConversation,
}: KeyboardHandlerProps) {
  const router = useRouter();
  const { toggleSidebar, setIsOpen } = useSidebarStore();

  /**
   * Check if the modifier key is pressed (Cmd on Mac, Ctrl on Windows/Linux)
   */
  const isModifierKey = useCallback((e: KeyboardEvent) => {
    // Detect Mac vs Windows/Linux
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    return isMac ? e.metaKey : e.ctrlKey;
  }, []);

  /**
   * Check if we should ignore keyboard shortcuts (when typing in input)
   */
  const shouldIgnoreShortcut = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();

    // Ignore shortcuts when typing in input fields or textareas
    // Exception: Esc key always works
    if (e.key === 'Escape') return false;

    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      target.isContentEditable
    );
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Open command palette
      if (isModifierKey(e) && e.key === 'k') {
        e.preventDefault();
        onOpenCommandPalette();
        return;
      }

      // Cmd/Ctrl + N: New conversation
      if (isModifierKey(e) && e.key === 'n' && !shouldIgnoreShortcut(e)) {
        e.preventDefault();
        onNewConversation();
        return;
      }

      // Cmd/Ctrl + F: Focus search
      if (isModifierKey(e) && e.key === 'f' && !shouldIgnoreShortcut(e)) {
        e.preventDefault();
        onFocusSearch();
        return;
      }

      // Cmd/Ctrl + B: Toggle sidebar
      if (isModifierKey(e) && e.key === 'b' && !shouldIgnoreShortcut(e)) {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Cmd/Ctrl + Shift + D: Delete current conversation
      if (
        isModifierKey(e) &&
        e.shiftKey &&
        e.key === 'D' &&
        !shouldIgnoreShortcut(e) &&
        conversationId &&
        onDeleteConversation
      ) {
        e.preventDefault();
        onDeleteConversation();
        return;
      }

      // Cmd/Ctrl + R: Rename current conversation
      if (
        isModifierKey(e) &&
        e.key === 'r' &&
        !shouldIgnoreShortcut(e) &&
        conversationId &&
        onRenameConversation
      ) {
        e.preventDefault();
        onRenameConversation();
        return;
      }

      // Esc: Close dialogs, blur input, exit search
      if (e.key === 'Escape') {
        const target = e.target as HTMLElement;
        if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea') {
          target.blur();
        }
        return;
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    conversationId,
    isModifierKey,
    shouldIgnoreShortcut,
    onOpenCommandPalette,
    onNewConversation,
    onFocusSearch,
    onDeleteConversation,
    onRenameConversation,
    toggleSidebar,
  ]);

  // This component doesn't render anything
  return null;
}
