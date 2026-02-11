'use client';

import { Streamdown } from 'streamdown';
import { CodeBlock } from '@/components/ui/code-block';

interface StreamingResponseProps {
  content: string;
}

/**
 * Streamdown wrapper for AI responses
 * Handles streaming markdown rendering with:
 * - Full markdown support (headers, lists, tables, links, images, blockquotes)
 * - Syntax highlighting for code blocks via Shiki
 * - Copy buttons on code blocks
 * - Handles incomplete markdown during streaming
 *
 * Streamdown is specifically designed for streaming AI responses,
 * unlike react-markdown which expects complete markdown.
 */
export function StreamingResponse({ content }: StreamingResponseProps) {
  return (
    <Streamdown
      className="prose prose-sm dark:prose-invert max-w-none"
      components={{
        // Use custom CodeBlock component for syntax highlighting and copy button
        code: ({ className, children, ...props }) => {
          const inline = !className;
          return (
            <CodeBlock className={className} inline={inline} {...props}>
              {String(children)}
            </CodeBlock>
          );
        },
      }}
    >
      {content}
    </Streamdown>
  );
}
