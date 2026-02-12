'use client';

import { useState, useEffect } from 'react';
import { codeToHtml } from 'shiki';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  children?: string;
  className?: string;
  language?: string;
  inline?: boolean;
}

/**
 * Code block component with syntax highlighting and copy button
 * Uses Shiki for VS Code-quality syntax highlighting
 *
 * Features:
 * - Automatic language detection from className (e.g., "language-typescript")
 * - Copy button with visual feedback
 * - Language label display
 * - Dark/light theme support
 *
 * Note: Uses dangerouslySetInnerHTML with Shiki-generated HTML.
 * Shiki output is safe as it only generates syntax-highlighted code.
 */
export function CodeBlock({ children, className, language, inline = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState<string>('');

  // Extract language from className (format: "language-xxx")
  const detectedLang = className?.replace(/language-/, '') || language || 'text';
  const code = children?.trim() || '';

  // Inline code (not a code block)
  if (inline) {
    return (
      <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-sm">
        {children}
      </code>
    );
  }

  // Highlight code on mount and when code/language changes
  useEffect(() => {
    let isMounted = true;

    const highlight = async () => {
      try {
        const html = await codeToHtml(code, {
          lang: detectedLang,
          theme: 'github-dark',
        });
        if (isMounted) {
          setHighlightedCode(html);
        }
      } catch (error) {
        // If language not supported, fall back to plain code block
        if (isMounted) {
          setHighlightedCode('');
        }
      }
    };

    if (code) {
      highlight();
    }

    return () => {
      isMounted = false;
    };
  }, [code, detectedLang]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      {/* Language label and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 rounded-t-lg border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono">{detectedLang}</span>
        <button
          onClick={handleCopy}
          className={cn(
            'text-xs px-3 py-1 rounded font-medium transition-all',
            copied
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          )}
          title="Copy code"
        >
          {copied ? (
            <span className="flex items-center gap-1">
              <CheckIcon className="h-3 w-3" />
              Copied!
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <CopyIcon className="h-3 w-3" />
              Copy
            </span>
          )}
        </button>
      </div>

      {/* Code content - Shiki-generated HTML is safe */}
      {highlightedCode ? (
        <div
          className="overflow-x-auto rounded-b-lg [&>pre]:!my-0 [&>pre]:!rounded-none"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      ) : (
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
          <code className="font-mono text-sm">{code}</code>
        </pre>
      )}
    </div>
  );
}

// Simple icon components
function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
