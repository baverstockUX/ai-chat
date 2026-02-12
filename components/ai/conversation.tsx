'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ConversationProps {
  children: ReactNode;
  className?: string;
}

interface ConversationContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * Conversation container with auto-scroll
 * Handles smooth scrolling to bottom on new messages
 */
export function Conversation({ children, className }: ConversationProps) {
  return (
    <ScrollArea className={cn('flex-1 h-full', className)}>
      {children}
    </ScrollArea>
  );
}

/**
 * Conversation content wrapper
 * Manages auto-scroll behavior and layout
 */
export function ConversationContent({
  children,
  className,
}: ConversationContentProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [children]);

  return (
    <div ref={containerRef} className={cn('p-4 min-h-full', className)}>
      <div className="max-w-4xl mx-auto space-y-4">
        {children}
        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
