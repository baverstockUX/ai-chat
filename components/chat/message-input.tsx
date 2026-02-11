'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

/**
 * Fixed bottom message input with auto-resize textarea
 * Features:
 * - Enter to send, Shift+Enter for new line
 * - Auto-resize up to max height
 * - Disabled state during streaming
 * - Auto-focus on mount
 */
export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (trimmedInput && !disabled) {
      onSend(trimmedInput);
      setInput('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift = send message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="flex gap-2 max-w-4xl mx-auto">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-lg border bg-background px-4 py-3',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'min-h-[44px] max-h-[200px]'
          )}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className={cn(
            'px-6 py-3 rounded-lg font-medium transition-colors',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-w-[80px]'
          )}
        >
          {disabled ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
