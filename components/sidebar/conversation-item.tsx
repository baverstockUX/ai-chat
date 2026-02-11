'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Pin, Edit2, Trash2 } from 'lucide-react';
import type { Conversation } from '@/lib/db/schema';
import { pinConversation, deleteConversation } from '@/app/(chat)/actions';
import { DeleteConversationDialog } from '@/components/chat/delete-conversation-dialog';
import { RenameConversationDialog } from '@/components/chat/rename-conversation-dialog';
import { toast } from 'sonner';

/**
 * Individual conversation item component
 * Shows conversation title with hover actions (pin, rename, delete)
 * Minimal, clean display per user decision
 */
interface ConversationItemProps {
  conversation: Conversation;
}

export function ConversationItem({ conversation }: ConversationItemProps) {
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isActive = params?.conversationId === conversation.id;

  const handlePin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      try {
        await pinConversation(conversation.id, !conversation.pinned);
        toast.success(conversation.pinned ? 'Conversation unpinned' : 'Conversation pinned');
      } catch (error) {
        toast.error('Failed to pin conversation');
        console.error(error);
      }
    });
  };

  const handleRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowRenameDialog(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  return (
    <>
      <Link
        href={`/${conversation.id}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          group relative flex items-center justify-between px-3 py-2.5 rounded-lg
          transition-colors duration-150
          ${
            isActive
              ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
          }
        `}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{conversation.title}</p>
        </div>

        {/* Action buttons - show on hover */}
        {isHovered && (
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={handlePin}
              disabled={isPending}
              className={`
                p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors
                ${conversation.pinned ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}
              `}
              title={conversation.pinned ? 'Unpin' : 'Pin'}
              aria-label={conversation.pinned ? 'Unpin conversation' : 'Pin conversation'}
            >
              <Pin className="w-4 h-4" fill={conversation.pinned ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={handleRename}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-400 dark:text-gray-500"
              title="Rename"
              aria-label="Rename conversation"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
              title="Delete"
              aria-label="Delete conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Pin indicator when not hovering */}
        {!isHovered && conversation.pinned && (
          <Pin className="w-4 h-4 text-blue-500 ml-2" fill="currentColor" />
        )}
      </Link>

      <DeleteConversationDialog
        conversationId={conversation.id}
        conversationTitle={conversation.title}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />

      <RenameConversationDialog
        conversationId={conversation.id}
        currentTitle={conversation.title}
        open={showRenameDialog}
        onOpenChange={setShowRenameDialog}
      />
    </>
  );
}
