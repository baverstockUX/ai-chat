'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoaderProps {
  className?: string;
}

/**
 * Loading skeleton for streaming AI responses
 * Shows animated placeholder matching message bubble shape
 */
export function Loader({ className }: LoaderProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-4 w-full max-w-lg" />
      <Skeleton className="h-4 w-full max-w-sm" />
    </div>
  );
}
