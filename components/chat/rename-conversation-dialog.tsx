'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { renameConversation } from '@/app/(chat)/actions';
import { toast } from 'sonner';

/**
 * Rename conversation dialog component
 * Similar to delete dialog but with input field for new title
 */
interface RenameConversationDialogProps {
  conversationId: string;
  currentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameConversationDialog({
  conversationId,
  currentTitle,
  open,
  onOpenChange,
}: RenameConversationDialogProps) {
  const [title, setTitle] = useState(currentTitle);
  const [isPending, startTransition] = useTransition();

  const handleRename = () => {
    // Validate
    if (title.length < 1) {
      toast.error('Title cannot be empty');
      return;
    }
    if (title.length > 100) {
      toast.error('Title must be 100 characters or less');
      return;
    }
    if (title === currentTitle) {
      onOpenChange(false);
      return;
    }

    startTransition(async () => {
      try {
        await renameConversation(conversationId, title);
        toast.success('Conversation renamed');
        onOpenChange(false);
      } catch (error) {
        toast.error('Failed to rename conversation');
        console.error(error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Conversation</DialogTitle>
          <DialogDescription>
            Enter a new title for this conversation (1-100 characters)
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Enter conversation title"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleRename();
              }
            }}
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {title.length}/100 characters
          </p>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleRename}
            disabled={isPending || title.length < 1 || title.length > 100}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Renaming...' : 'Rename'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
