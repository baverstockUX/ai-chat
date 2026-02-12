'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Send } from 'lucide-react';

interface PromptInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Enhanced prompt input with production-quality features:
 * - Auto-resize textarea
 * - Better keyboard handling (Enter to send, Shift+Enter for newline)
 * - Loading states
 * - Smooth animations
 * - Accessibility features
 */
export function PromptInput({
  onSubmit,
  disabled = false,
  placeholder = 'Type a message...',
  autoFocus = true,
  className,
}: PromptInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmedInput = input.trim();
    if (trimmedInput && !disabled) {
      onSubmit(trimmedInput);
      setInput('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = input.trim() && !disabled;

  return (
    <div className={cn('border-t bg-background p-4', className)}>
      <div className="flex gap-2 max-w-4xl mx-auto items-end">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none min-h-[44px] max-h-[200px]',
            'transition-all duration-200',
            disabled && 'cursor-not-allowed'
          )}
        />
        <Button
          onClick={handleSubmit}
          disabled={!canSend}
          size="icon"
          className={cn(
            'h-11 w-11 shrink-0',
            'transition-all duration-200',
            canSend
              ? 'bg-primary hover:bg-primary/90'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">{disabled ? 'Sending...' : 'Send message'}</span>
        </Button>
      </div>
      {/* Keyboard hint */}
      <div className="flex justify-center mt-2">
        <p className="text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
