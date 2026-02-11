'use client';

interface StreamingResponseProps {
  content: string;
}

/**
 * Streaming response component for AI messages
 * Will be enhanced with Streamdown markdown rendering in Task 3
 */
export function StreamingResponse({ content }: StreamingResponseProps) {
  return <div className="whitespace-pre-wrap">{content}</div>;
}
