import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date as relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Format date as full timestamp (e.g., "Jan 15, 2024 at 3:45 PM")
 */
export function formatFullTimestamp(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM d, yyyy \'at\' h:mm a');
}

/**
 * Check if two dates are within a time threshold (for message grouping)
 */
export function isWithinTimeThreshold(
  date1: Date | string,
  date2: Date | string,
  thresholdMinutes: number = 5
): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes <= thresholdMinutes;
}

/**
 * Check if error is a Next.js redirect error (thrown by redirect() in Server Actions)
 * These should not be shown to users as failures - they indicate successful navigation
 */
export function isRedirectError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'digest' in error &&
    typeof error.digest === 'string' &&
    error.digest.startsWith('NEXT_REDIRECT')
  )
}
