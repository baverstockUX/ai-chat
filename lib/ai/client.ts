import { google } from '@ai-sdk/google';

/**
 * Google Gemini 3.0 Flash Preview model configuration
 * Uses GOOGLE_GENERATIVE_AI_API_KEY from environment (automatically detected by AI SDK)
 * Using Gemini 3 Flash Preview - latest model from Gemini 3 docs
 */
export const gemini = google('gemini-3-flash-preview');
