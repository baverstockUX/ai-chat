'use client';

import { useState } from 'react';
import type { UIMessage } from '@ai-sdk/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useMobile } from '@/lib/hooks/use-mobile';
import { StreamingResponse } from '@/components/chat/streaming-response';
import { Actions } from './actions';

interface MessageProps {
  message: UIMessage;
  isGrouped?: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
}

/**
 * Enhanced AI message component with production-quality features:
 * - Clean user/assistant styling
 * - Action buttons with tooltips
 * - Message grouping support
 * - Responsive design
 * - Streaming markdown support
 */
export function Message({
  message,
  isGrouped = false,
  onCopy,
  onRegenerate,
  onLike,
  onDislike,
}: MessageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const isMobile = useMobile();
  const isUser = message.role === 'user';

  // Get text content from message
  // AI SDK v6 uses parts array, handle legacy content for compatibility
  const textContent =
    message.parts && message.parts.length > 0
      ? message.parts
          .filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join('')
      : (message as any).content || '';

  const userInitial = 'U';
  const aiInitial = 'AI';

  const handleCopy = () => {
    navigator.clipboard.writeText(textContent);
    onCopy?.();
  };

  // Show actions on hover (desktop) or tap (mobile)
  const showActions =
    !isGrouped && ((isMobile && showMobileActions) || (!isMobile && isHovered));

  return (
    <div
      className={cn(
        'flex gap-3 group transition-colors',
        isUser ? 'flex-row-reverse' : 'flex-row',
        isGrouped && 'mt-1'
      )}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    >
      {/* Avatar */}
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

      {/* Spacer when avatar hidden */}
      {isGrouped && <div className={cn('shrink-0', isMobile ? 'w-6' : 'w-8')} />}

      {/* Message content */}
      <div className={cn('flex flex-col gap-1.5 flex-1 min-w-0')}>
        {/* Message bubble */}
        <div
          className={cn(
            'rounded-2xl break-words transition-colors',
            isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2.5',
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

        {/* Timestamp and actions */}
        {!isGrouped && (
          <div
            className={cn(
              'flex items-center gap-2 px-2 min-h-[24px]',
              isUser ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {/* Timestamp */}
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(new Date())}
            </span>

            {/* Actions */}
            {showActions && (
              <Actions
                onCopy={handleCopy}
                onRegenerate={!isUser ? onRegenerate : undefined}
                onLike={!isUser ? onLike : undefined}
                onDislike={!isUser ? onDislike : undefined}
                size={isMobile ? 'default' : 'sm'}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
