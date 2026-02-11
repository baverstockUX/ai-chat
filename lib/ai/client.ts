import { google } from '@ai-sdk/google';

/**
 * Google Gemini 2.0 Flash Experimental model configuration
 * Uses GOOGLE_GENERATIVE_AI_API_KEY from environment (automatically detected by AI SDK)
 * Using Gemini 2.0 Flash Experimental - latest available model
 */
export const gemini = google('gemini-2.0-flash-exp');
