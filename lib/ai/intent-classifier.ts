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
  summary: z.string().max(200).optional(),
  actions: z.array(z.string()).optional(),
  destructive: z.boolean().optional(),
  requiresExtraConfirm: z.boolean().optional(),
});

/**
 * Deterministic fallback to detect destructive operations
 * Catches cases where AI fails to detect dangerous keywords
 */
function applyDestructiveSafetyCheck(
  userMessage: string,
  result: IntentResult
): IntentResult {
  const message = userMessage.toLowerCase();

  // Destructive keywords that should ALWAYS require confirmation
  const destructiveKeywords = [
    'delete',
    'remove',
    'drop',
    'purge',
    'destroy',
    'wipe',
    'truncate',
    'clear all',
  ];

  // Critical environment keywords
  const criticalEnvironments = [
    'production',
    'prod',
    'live',
    'staging',
    'database',
    'db',
    ' all ',
    'all files',
    'all data',
  ];

  // Check for destructive keywords
  const hasDestructiveKeyword = destructiveKeywords.some((keyword) =>
    message.includes(keyword)
  );

  // Check for critical environment mention
  const hasCriticalEnvironment = criticalEnvironments.some((env) =>
    message.includes(env)
  );

  // If AI classified as agent_summon and message contains destructive patterns,
  // ensure destructive flag is set
  if (
    result.intent === 'agent_summon' &&
    hasDestructiveKeyword &&
    !result.destructive
  ) {
    console.warn(
      '[Safety Check] AI missed destructive operation, forcing flag:',
      userMessage
    );
    result.destructive = true;
    result.requiresExtraConfirm = true;
  }

  // Extra check: If both destructive keyword AND critical environment mentioned
  if (hasDestructiveKeyword && hasCriticalEnvironment && result.destructive) {
    // Already marked as destructive, just log for monitoring
    console.log('[Safety Check] High-risk operation detected:', userMessage);
  }

  return result;
}

/**
 * Deterministic classification for common agent patterns
 * Used as fallback when AI detection fails or times out
 */
function classifyWithFallbackRules(userMessage: string): IntentResult | null {
  const message = userMessage.toLowerCase();

  // Strong action verbs that clearly indicate agent summon
  const actionVerbs = [
    'create',
    'build',
    'write',
    'generate',
    'make',
    'set up',
    'configure',
    'deploy',
  ];

  // Question words that indicate learning/information request
  const questionWords = [
    'how',
    'what',
    'why',
    'when',
    'where',
    'can you tell',
    'can you explain',
    'explain',
    'tell me about',
  ];

  // Destructive keywords
  const destructiveKeywords = [
    'delete',
    'remove',
    'drop',
    'purge',
    'destroy',
    'wipe',
  ];

  // Check if it starts with a question word
  const startsWithQuestion = questionWords.some((word) =>
    message.startsWith(word)
  );
  if (startsWithQuestion) {
    return {
      intent: 'chat',
      confidence: 0.7,
      response: '',
      offerBuild: false,
    };
  }

  // Check for action verbs
  const hasActionVerb = actionVerbs.some((verb) => message.includes(verb));
  const hasDestructiveKeyword = destructiveKeywords.some((keyword) =>
    message.includes(keyword)
  );

  if (hasActionVerb || hasDestructiveKeyword) {
    return {
      intent: 'agent_summon',
      confidence: 0.7,
      summary: `I will ${message.slice(0, 50)}`,
      actions: ['Execute user request'],
      destructive: hasDestructiveKeyword,
      requiresExtraConfirm: hasDestructiveKeyword,
    };
  }

  return null; // Can't determine with fallback rules
}

/**
 * Detect user intent from conversation messages
 * Uses AI SDK structured output to classify as chat or agent_summon
 *
 * @param messages - Array of conversation messages
 * @returns IntentResult with classification, confidence, and type-specific fields
 */
export async function detectIntent(messages: any[]): Promise<IntentResult> {
  const userMessage = messages[messages.length - 1]?.content || '';

  try {
    const { output } = await generateText({
      model: gemini,
      messages,
      system: orchestrationPrompt,
      output: Output.object({
        schema: intentSchema,
      }),
      maxRetries: 0, // Don't retry, use fallback instead
      abortSignal: AbortSignal.timeout(15000), // 15 second timeout
    });

    let result = output as IntentResult;

    // Apply deterministic safety check for destructive operations
    result = applyDestructiveSafetyCheck(userMessage, result);

    return result;
  } catch (error) {
    // Fallback: Try deterministic classification first
    console.warn('Intent detection failed, attempting fallback rules:', error);

    const fallbackResult = classifyWithFallbackRules(userMessage);
    if (fallbackResult) {
      console.log('Using fallback classification:', fallbackResult);
      return fallbackResult;
    }

    // Ultimate fallback: default to chat mode
    console.log('Falling back to chat mode');
    return {
      intent: 'chat',
      confidence: 0.5,
      response: '', // Will use streaming response instead
      offerBuild: false,
    };
  }
}
