'use client';

import { useEffect, useRef, useState, memo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wrench, CheckCircle, XCircle, Terminal } from 'lucide-react';
import type { AgentProgressUpdate } from '@/lib/types/agent';

interface AgentExecutionViewProps {
  updates: AgentProgressUpdate[];
  isLive?: boolean;
}

/**
 * Real-time execution timeline showing agent progress
 * Features:
 * - Auto-scroll to latest event when user at bottom
 * - Scroll preservation when user scrolls up to read history
 * - Event type styling with icons and colors
 * - Loading state before first event
 */
export function AgentExecutionView({ updates, isLive = false }: AgentExecutionViewProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const lastUpdateCountRef = useRef(0);

  // Auto-scroll to bottom when new updates arrive (if user is at bottom)
  useEffect(() => {
    if (updates.length > lastUpdateCountRef.current) {
      lastUpdateCountRef.current = updates.length;

      if (!isUserScrolling) {
        // Scroll to bottom
        const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }
    }
  }, [updates.length, isUserScrolling]);

  // Detect when user scrolls away from bottom
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const viewport = event.currentTarget;
    const isNearBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 100;

    if (isNearBottom && isUserScrolling) {
      // User scrolled back to bottom - re-enable auto-scroll
      setIsUserScrolling(false);
    } else if (!isNearBottom && !isUserScrolling) {
      // User scrolled up - disable auto-scroll
      setIsUserScrolling(true);
    }
  };

  // Show loading state before first event
  if (updates.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span>Starting agent execution...</span>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-muted/30" ref={scrollAreaRef}>
      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-3" onScroll={handleScroll}>
          {updates.map((update, index) => (
            <ExecutionEventItem key={index} update={update} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// Memoized event item to prevent unnecessary re-renders
const ExecutionEventItem = memo(({ update }: { update: AgentProgressUpdate }) => {
  const { type, content, toolName, success, timestamp } = update;

  // Event type styling
  const eventStyle = getEventStyle(type, success);

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-md ${eventStyle.bg} border ${eventStyle.border}`}
    >
      <div className={`flex-shrink-0 w-5 h-5 ${eventStyle.iconColor}`}>
        {eventStyle.icon}
      </div>
      <div className="flex-1 min-w-0">
        {toolName && (
          <div className="text-xs font-medium mb-1 text-muted-foreground">
            {toolName}
          </div>
        )}
        <div className="text-sm whitespace-pre-wrap break-words">
          {content}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
});

ExecutionEventItem.displayName = 'ExecutionEventItem';

// Helper function to get styling based on event type
function getEventStyle(type: string, success?: boolean) {
  switch (type) {
    case 'tool_call':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-800',
        iconColor: 'text-blue-600 dark:text-blue-400',
        icon: <Wrench className="w-5 h-5" />,
      };
    case 'tool_result':
      if (success) {
        return {
          bg: 'bg-green-50 dark:bg-green-950/30',
          border: 'border-green-200 dark:border-green-800',
          iconColor: 'text-green-600 dark:text-green-400',
          icon: <CheckCircle className="w-5 h-5" />,
        };
      } else {
        return {
          bg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-red-200 dark:border-red-800',
          iconColor: 'text-red-600 dark:text-red-400',
          icon: <XCircle className="w-5 h-5" />,
        };
      }
    case 'text':
    case 'complete':
    default:
      return {
        bg: 'bg-muted/50',
        border: 'border-border',
        iconColor: 'text-muted-foreground',
        icon: <Terminal className="w-5 h-5" />,
      };
  }
}
