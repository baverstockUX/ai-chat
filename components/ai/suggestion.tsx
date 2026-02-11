'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface SuggestionProps {
  onClick: (text: string) => void;
  children: string;
  className?: string;
}

/**
 * Prompt suggestion pill
 * Features:
 * - Click to send suggested prompt
 * - Hover effects
 * - Icon for visual interest
 */
export function Suggestion({ onClick, children, className }: SuggestionProps) {
  return (
    <Button
      variant="outline"
      onClick={() => onClick(children)}
      className={cn(
        'h-auto py-3 px-4 text-left justify-start',
        'hover:bg-accent hover:border-primary/50 transition-all',
        'whitespace-normal text-sm',
        className
      )}
    >
      <Sparkles className="h-4 w-4 mr-2 shrink-0 text-primary" />
      <span>{children}</span>
    </Button>
  );
}

interface SuggestionsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
  className?: string;
}

/**
 * Grid of prompt suggestions
 */
export function Suggestions({
  suggestions,
  onSelect,
  className,
}: SuggestionsProps) {
  return (
    <div
      className={cn(
        'grid gap-3',
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {suggestions.map((suggestion, i) => (
        <Suggestion key={i} onClick={onSelect}>
          {suggestion}
        </Suggestion>
      ))}
    </div>
  );
}
