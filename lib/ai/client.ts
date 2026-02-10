import { google } from '@ai-sdk/google';

/**
 * Google Gemini 3.0 Flash model configuration
 * Uses GOOGLE_GENERATIVE_AI_API_KEY from environment (automatically detected)
 */
export const gemini = google('gemini-3-flash-preview');
