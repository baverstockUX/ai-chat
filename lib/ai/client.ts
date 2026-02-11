import { google } from '@ai-sdk/google';

/**
 * Google Gemini 1.5 Flash model configuration
 * Uses GOOGLE_GENERATIVE_AI_API_KEY from environment (automatically detected by AI SDK)
 * Note: Using 'gemini-1.5-flash' (not 'gemini-1.5-flash-latest') for v1beta API
 */
export const gemini = google('gemini-1.5-flash');
