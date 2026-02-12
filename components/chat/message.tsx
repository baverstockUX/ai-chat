'use client';

import { useState } from 'react';
import type { UIMessage } from '@ai-sdk/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useMobile } from '@/lib/hooks/use-mobile';
import { StreamingResponse } from './streaming-response';

interface MessageProps {
  message: UIMessage;
  isGrouped?: boolean; // If true, hide avatar and timestamp (part of message group)
}

/**
 * Individual message component implementing user design decisions:
 * - User messages: right-aligned, blue background
 * - AI messages: left-aligned, gray background
 * - Avatars next to each message
 * - Timestamps and hover actions
 * - Message grouping support
 */
export function Message({ message, isGrouped = false }: MessageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const isMobile = useMobile();
  const isUser = message.role === 'user';

  // Get text content from message
  // AI SDK v6 uses parts array, but handle legacy content property for compatibility
  const textContent =
    message.parts && message.parts.length > 0
      ? message.parts
          .filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join('')
      : (message as any).content || '';

  // Get user initials for avatar (using first letter for now)
  const userInitial = 'U';
  const aiInitial = 'AI';

  const handleCopy = () => {
    navigator.clipboard.writeText(textContent);
    // Toast notification will be added in later plans
  };

  return (
    <div
      className={cn(
        'flex gap-3 group',
        isUser ? 'flex-row-reverse' : 'flex-row',
        isGrouped && 'mt-1'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar - hidden when grouped, smaller on mobile */}
      {!isGrouped && (
        <Avatar
          className={cn(
            'shrink-0',
            isMobile ? 'h-6 w-6' : 'h-8 w-8',
            isUser ? 'order-2' : 'order-1'
          )}
        >
          <AvatarFallback
            className={cn(
              'font-medium',
              isMobile ? 'text-[10px]' : 'text-xs',
              isUser
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            )}
          >
            {isUser ? userInitial : aiInitial}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Spacer when avatar is hidden in grouped messages */}
      {isGrouped && <div className={cn('shrink-0', isMobile ? 'w-6' : 'w-8')} />}

      {/* Message content */}
      <div className={cn('flex flex-col gap-1', 'flex-1 min-w-0')}>
        <div
          className={cn(
            'rounded-2xl break-words',
            isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2',
            isUser
              ? 'bg-blue-500 text-white ml-auto'
              : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
            isMobile ? 'max-w-[85%]' : 'max-w-[80%]'
          )}
          onClick={() => isMobile && setShowMobileActions(!showMobileActions)}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{textContent}</div>
          ) : (
            <StreamingResponse content={textContent} />
          )}
        </div>

        {/* Timestamp and actions - hidden when grouped */}
        {!isGrouped && (
          <div
            className={cn(
              'flex items-center gap-2 px-2 text-xs text-muted-foreground',
              isUser ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {/* Timestamp */}
            <span>{formatRelativeTime((message as any).createdAt ?? new Date())}</span>

            {/* Message actions - visible on hover (desktop) or tap (mobile) */}
            {((isMobile && showMobileActions) || (!isMobile && isHovered)) && (
              <div className="flex gap-1">
                <button
                  onClick={handleCopy}
                  className={cn(
                    'hover:text-foreground transition-colors rounded hover:bg-muted',
                    isMobile ? 'p-2 touch-target' : 'p-1'
                  )}
                  title="Copy message"
                >
                  <CopyIcon className={cn(isMobile ? 'h-4 w-4' : 'h-3 w-3')} />
                </button>
                {isUser && (
                  <>
                    <button
                      className={cn(
                        'hover:text-foreground transition-colors rounded hover:bg-muted',
                        isMobile ? 'p-2 touch-target' : 'p-1'
                      )}
                      title="Edit message"
                    >
                      <EditIcon className={cn(isMobile ? 'h-4 w-4' : 'h-3 w-3')} />
                    </button>
                    <button
                      className={cn(
                        'hover:text-foreground transition-colors rounded hover:bg-muted',
                        isMobile ? 'p-2 touch-target' : 'p-1'
                      )}
                      title="Delete message"
                    >
                      <DeleteIcon className={cn(isMobile ? 'h-4 w-4' : 'h-3 w-3')} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple icon components (will be replaced with proper icon library in later plans)
function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function DeleteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
