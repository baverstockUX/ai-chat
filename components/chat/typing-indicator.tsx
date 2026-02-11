'use client';

/**
 * Typing indicator with animated dots
 * Shows "AI is typing..." with animated dots
 */
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <span>AI is typing</span>
      <div className="flex gap-1">
        <span className="animate-bounce [animation-delay:-0.3s]">.</span>
        <span className="animate-bounce [animation-delay:-0.15s]">.</span>
        <span className="animate-bounce">.</span>
      </div>
    </div>
  );
}
