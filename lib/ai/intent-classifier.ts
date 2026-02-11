import { generateText, Output } from 'ai';
import { gemini } from '@/lib/ai/client';
import { orchestrationPrompt } from '@/lib/ai/prompts';
import { z } from 'zod';
import type { IntentResult } from '@/lib/types/agent';

/**
 * Zod schema for intent detection structured output
 * Validates AI response conforms to IntentResult interface
 */
const intentSchema = z.object({
  intent: z.enum(['chat', 'agent_summon']),
  confidence: z.number().min(0).max(1),
  // Chat fields
  response: z.string().optional(),
  offerBuild: z.boolean().optional(),
  // Agent summon fields
  summary: z.string().optional(),
  actions: z.array(z.string()).optional(),
  destructive: z.boolean().optional(),
  requiresExtraConfirm: z.boolean().optional(),
});

/**
 * Detect user intent from conversation messages
 * Uses AI SDK structured output to classify as chat or agent_summon
 *
 * @param messages - Array of conversation messages
 * @returns IntentResult with classification, confidence, and type-specific fields
 */
export async function detectIntent(messages: any[]): Promise<IntentResult> {
  const { output } = await generateText({
    model: gemini,
    messages,
    system: orchestrationPrompt,
    output: Output.object({
      schema: intentSchema,
    }),
  });

  return output as IntentResult;
}
