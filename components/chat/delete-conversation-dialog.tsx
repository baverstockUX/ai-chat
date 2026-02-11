'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deleteConversation } from '@/app/(chat)/actions';
import { toast } from 'sonner';
import { isRedirectError } from '@/lib/utils';

interface DeleteConversationDialogProps {
  conversationId: string;
  conversationTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Confirmation dialog for conversation deletion
 * Shows conversation title and requires explicit confirmation
 * Displays toast notification on success or error
 */
export function DeleteConversationDialog({
  conversationId,
  conversationTitle,
  open,
  onOpenChange,
}: DeleteConversationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteConversation(conversationId);
      toast.success('Conversation deleted');
      // Server action will redirect to home page
    } catch (error) {
      // Ignore redirect errors (successful navigation after deletion)
      if (isRedirectError(error)) {
        return
      }
      console.error('Failed to delete conversation:', error)
      toast.error('Failed to delete conversation')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete conversation?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{conversationTitle}"? This action
            cannot be undone. All messages in this conversation will be
            permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
