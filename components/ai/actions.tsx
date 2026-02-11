'use client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Copy, RotateCw, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionsProps {
  onCopy?: () => void;
  onRegenerate?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  className?: string;
  size?: 'sm' | 'default';
}

/**
 * Action buttons for messages with tooltips
 * Features:
 * - Copy, regenerate, like/dislike actions
 * - Tooltips for better UX
 * - Responsive sizing
 * - Touch-friendly on mobile
 */
export function Actions({
  onCopy,
  onRegenerate,
  onLike,
  onDislike,
  className,
  size = 'sm',
}: ActionsProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const buttonSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('flex items-center gap-1', className)}>
        {onCopy && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCopy}
                className={cn(
                  buttonSize,
                  'hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <Copy className={iconSize} />
                <span className="sr-only">Copy message</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy message</p>
            </TooltipContent>
          </Tooltip>
        )}

        {onRegenerate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRegenerate}
                className={cn(
                  buttonSize,
                  'hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <RotateCw className={iconSize} />
                <span className="sr-only">Regenerate response</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Regenerate response</p>
            </TooltipContent>
          </Tooltip>
        )}

        {onLike && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLike}
                className={cn(
                  buttonSize,
                  'hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <ThumbsUp className={iconSize} />
                <span className="sr-only">Like response</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Like response</p>
            </TooltipContent>
          </Tooltip>
        )}

        {onDislike && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDislike}
                className={cn(
                  buttonSize,
                  'hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <ThumbsDown className={iconSize} />
                <span className="sr-only">Dislike response</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Dislike response</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
