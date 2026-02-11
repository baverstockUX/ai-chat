import { generateText, Output } from 'ai';
import { gemini } from '@/lib/ai/client';
import { z } from 'zod';
import { storeContext } from '@/lib/db/queries';

/**
 * Schema for context extraction structured output
 * Defines the shape of contexts extracted from conversations
 */
const contextExtractionSchema = z.object({
  contexts: z.array(
    z.object({
      key: z.string().describe('Context identifier (e.g., uses_kubernetes, prefers_typescript)'),
      value: z.any().describe('Context value (string, object, array)'),
      type: z.enum(['domain', 'preference', 'project', 'technology']),
      confidence: z.number().min(0).max(1),
    })
  ),
});

/**
 * Extract domain knowledge and preferences from conversation messages
 * Uses AI to identify technologies, tools, projects, and user preferences
 * Only stores high-confidence contexts (>0.7) to prevent false positives
 *
 * @param conversationId - Conversation UUID for context storage
 * @param messages - Array of conversation messages
 * @returns Promise that resolves when context extraction completes
 */
export async function extractContext(
  conversationId: string,
  messages: any[]
): Promise<void> {
  // Only extract from recent messages to avoid token limits
  // User decided ~10 messages context window
  const recentMessages = messages.slice(-10);

  const { output } = await generateText({
    model: gemini,
    messages: recentMessages,
    system: `Extract domain knowledge from this conversation:
- Technologies mentioned (Kubernetes, TypeScript, React, etc.)
- Tools being used (VS Code, Docker, AWS, etc.)
- Project details (names, domains, architectures)
- User preferences (coding style, deployment preferences)

Return structured context as key-value pairs.

Examples:
- "uses_kubernetes": { mentioned: true, version: "1.28", clusters: ["prod", "dev"] }
- "prefers_typescript": { strict: true, reason: "type safety" }
- "project_name": "acme-workflows"
- "tech_stack": ["Next.js", "PostgreSQL", "Vercel"]`,
    output: Output.object({
      schema: contextExtractionSchema,
    }),
  });

  // Store each extracted context
  for (const ctx of output.contexts) {
    // Only store high-confidence contexts (>0.7)
    if (ctx.confidence > 0.7) {
      await storeContext(conversationId, ctx.type, ctx.key, ctx.value);
    }
  }
}
