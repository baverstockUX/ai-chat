/**
 * Shiki configuration for syntax highlighting
 *
 * Shiki uses VS Code's syntax engine for high-quality code highlighting.
 * This configuration sets up common languages and themes.
 */

export const shikiConfig = {
  themes: {
    light: 'github-light',
    dark: 'github-dark',
  },
  // Common language grammars - Shiki loads these on-demand
  langs: [
    'typescript',
    'javascript',
    'python',
    'java',
    'go',
    'rust',
    'cpp',
    'c',
    'csharp',
    'php',
    'ruby',
    'swift',
    'kotlin',
    'bash',
    'shell',
    'json',
    'yaml',
    'markdown',
    'html',
    'css',
    'sql',
    'graphql',
    'dockerfile',
    'terraform',
  ],
};

export type ShikiTheme = 'github-light' | 'github-dark';
