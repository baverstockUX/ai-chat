'use client';

import { PromptInput } from '@/components/ai/prompt-input';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

/**
 * Wrapper for PromptInput component
 * Maintains the same interface as the old MessageInput
 */
export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  return (
    <PromptInput
      onSubmit={onSend}
      disabled={disabled}
      placeholder="Type a message..."
      autoFocus
    />
  );
}
