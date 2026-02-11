import { google } from '@ai-sdk/google';

/**
 * Google Gemini 1.5 Pro model configuration
 * Uses GOOGLE_GENERATIVE_AI_API_KEY from environment (automatically detected by AI SDK)
 * Using Gemini 1.5 Pro - stable model compatible with v1beta API
 */
export const gemini = google('gemini-1.5-pro');
