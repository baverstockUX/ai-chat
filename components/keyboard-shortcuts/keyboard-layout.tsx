'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { KeyboardHandler } from './keyboard-handler';
import { CommandPalette } from './command-palette';
import { createConversation, deleteConversation, renameConversation, pinConversation } from '@/app/(chat)/actions';
import type { Conversation } from '@/lib/db/schema';
import { DeleteConversationDialog } from '@/components/chat/delete-conversation-dialog';
import { RenameConversationDialog } from '@/components/chat/rename-conversation-dialog';
import { toast } from 'sonner';

/**
 * Keyboard layout wrapper
 * Provides keyboard shortcut handling and command palette to entire chat layout
 * Handles all keyboard actions and command palette actions
 * Detects conversationId from URL pathname
 */

interface KeyboardLayoutProps {
  children: React.ReactNode;
  conversations: Conversation[];
}

export function KeyboardLayout({
  children,
  conversations,
}: KeyboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);

  // Extract conversationId from pathname (e.g., /chat/uuid or /uuid)
  const conversationId = pathname?.startsWith('/chat/')
    ? pathname.split('/')[2]
    : pathname?.startsWith('/')
    ? pathname.split('/')[1]
    : undefined;

  // Get current conversation from conversations list
  const currentConversation = conversationId
    ? conversations.find((c) => c.id === conversationId)
    : undefined;
  const currentConversationPinned = currentConversation?.isPinned || false;

  // Handler functions
  const handleOpenCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  const handleCloseCommandPalette = useCallback(() => {
    setCommandPaletteOpen(false);
  }, []);

  const handleNewConversation = useCallback(async () => {
    try {
      await createConversation();
      // Redirect happens in server action
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to create conversation');
    }
  }, []);

  const handleFocusSearch = useCallback(() => {
    // Focus the search input in the sidebar
    const searchInput = document.getElementById('conversation-search');
    if (searchInput) {
      searchInput.focus();
    }
  }, []);

  const handleDeleteConversation = useCallback(() => {
    if (!conversationId) return;
    setDeleteDialogOpen(true);
  }, [conversationId]);

  const handleConfirmDelete = useCallback(async () => {
    if (!conversationId) return;
    try {
      await deleteConversation(conversationId);
      // Redirect happens in server action
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    }
  }, [conversationId]);

  const handleRenameConversation = useCallback(() => {
    if (!conversationId) return;
    setRenameDialogOpen(true);
  }, [conversationId]);

  const handleConfirmRename = useCallback(
    async (newTitle: string) => {
      if (!conversationId) return;
      try {
        await renameConversation(conversationId, newTitle);
        toast.success('Conversation renamed');
        setRenameDialogOpen(false);
      } catch (error) {
        console.error('Failed to rename conversation:', error);
        toast.error('Failed to rename conversation');
      }
    },
    [conversationId]
  );

  const handleTogglePin = useCallback(async () => {
    if (!conversationId) return;
    try {
      await pinConversation(conversationId, !currentConversationPinned);
      toast.success(currentConversationPinned ? 'Conversation unpinned' : 'Conversation pinned');
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      toast.error('Failed to update conversation');
    }
  }, [conversationId, currentConversationPinned]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut({ redirect: false });
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Failed to logout:', error);
      toast.error('Failed to logout');
    }
  }, [router]);

  // Get current conversation title for dialogs
  const currentTitle = currentConversation?.title || 'New Conversation';

  return (
    <>
      <KeyboardHandler
        conversationId={conversationId}
        onOpenCommandPalette={handleOpenCommandPalette}
        onNewConversation={handleNewConversation}
        onFocusSearch={handleFocusSearch}
        onDeleteConversation={conversationId ? handleDeleteConversation : undefined}
        onRenameConversation={conversationId ? handleRenameConversation : undefined}
      />

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={handleCloseCommandPalette}
        conversationId={conversationId}
        conversations={conversations.map((c) => ({
          id: c.id,
          title: c.title,
          isPinned: c.isPinned,
        }))}
        onNewConversation={handleNewConversation}
        onFocusSearch={handleFocusSearch}
        onDeleteConversation={conversationId ? handleDeleteConversation : undefined}
        onRenameConversation={conversationId ? handleRenameConversation : undefined}
        onTogglePin={conversationId ? handleTogglePin : undefined}
        onLogout={handleLogout}
        isPinned={currentConversationPinned}
      />

      {conversationId && (
        <>
          <DeleteConversationDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={handleConfirmDelete}
            conversationTitle={currentTitle}
          />

          <RenameConversationDialog
            open={renameDialogOpen}
            onOpenChange={setRenameDialogOpen}
            onConfirm={handleConfirmRename}
            currentTitle={currentTitle}
          />
        </>
      )}

      {children}
    </>
  );
}
