---
phase: 02-ai-orchestration-intent-detection
plan: 02
subsystem: ai-orchestration
tags:
  - intent-detection
  - structured-output
  - agent-summoning
  - gemini-ai
dependencies:
  requires:
    - phase-01-chat-foundation
    - ai-sdk-v6
    - gemini-integration
  provides:
    - intent-classification
    - agent-request-routing
    - orchestration-prompt
  affects:
    - chat-api
    - message-schema
tech-stack:
  added:
    - zod: "Structured output validation"
    - ai-sdk-output-object: "Gemini structured responses"
  patterns:
    - intent-detection
    - structured-ai-output
    - agent-orchestration
key-files:
  created:
    - lib/ai/intent-classifier.ts: "detectIntent function with structured output"
    - lib/types/agent.ts: "IntentResult and AgentRequestMetadata types"
  modified:
    - lib/ai/prompts.ts: "Added orchestrationPrompt with intent rules"
    - app/api/chat/route.ts: "Integrated intent detection before streaming"
    - lib/db/queries.ts: "Extended createMessage for messageType and metadata"
decisions:
  - title: "Use AI SDK Output.object() for structured responses"
    rationale: "Leverages Gemini's native structured output with Zod validation for type-safe intent detection"
  - title: "Return JSON (not stream) for agent_summon intent"
    rationale: "Agent requests require synchronous confirmation UI, not streaming text"
  - title: "Save user message before intent detection response"
    rationale: "Ensures message persistence even if user cancels agent request"
metrics:
  duration: "2m 52s"
  tasks: 3
  files_created: 2
  files_modified: 3
  commits: 3
  completed: 2026-02-11T15:02:22Z
---

# Phase 02 Plan 02: Prompt-Based Intent Classification Summary

**Implemented prompt-based intent classification using Gemini structured output with Zod validation - distinguishes conversational queries from action requests requiring agent execution**

## Overview

Phase 02 Plan 02 implements intelligent intent detection that routes user requests based on action verbs vs. questions. The system uses AI SDK structured output to classify messages as either conversational chat or agent summoning, enforcing user-specified intent rules with confidence scoring and destructive operation flagging.

## Implementation

### Task 1: Create Orchestration System Prompt
**Status:** ✅ Complete
**Commit:** `2863954`
**Files:** `lib/ai/prompts.ts`

Added `orchestrationPrompt` implementing user-specified intent detection rules:
- **ACTION VERBS** (Create, Build, Deploy, Delete, Modify, Update) trigger agent summoning
- **QUESTIONS** (How, What, Why, Explain) remain conversational
- **AMBIGUOUS** cases default to chat with optional build offer
- **DESTRUCTIVE** operations flagged for extra confirmation (Delete, Modify existing data, Deploy to production)

Example classification patterns:
- "Create a workflow that sends daily reports" → `agent_summon` (explicit action verb)
- "How do I create a workflow?" → `chat` (question seeking explanation)
- "Delete all my data" → `agent_summon` with `destructive: true`

### Task 2: Implement Intent Classifier with Structured Output
**Status:** ✅ Complete
**Commit:** `497aa56`
**Files:** `lib/ai/intent-classifier.ts`, `lib/types/agent.ts`

Created intent detection system using AI SDK v6.0.79 structured output:

**TypeScript Types:**
```typescript
interface IntentResult {
  intent: 'chat' | 'agent_summon';
  confidence: number;
  // Chat fields
  response?: string;
  offerBuild?: boolean;
  // Agent summon fields
  summary?: string;
  actions?: string[];
  destructive?: boolean;
  requiresExtraConfirm?: boolean;
}

interface AgentRequestMetadata {
  summary: string;
  actions: string[];
  destructive: boolean;
  requiresExtraConfirm: boolean;
  requestedAt: string;
}
```

**Implementation:**
- Uses `generateText()` with `Output.object()` for structured responses
- Zod schema validation ensures type-safe AI output
- Returns `IntentResult` with classification and confidence score
- Follows AI SDK research patterns for structured output

### Task 3: Integrate Intent Detection into Chat API
**Status:** ✅ Complete
**Commit:** `74937f9`
**Files:** `app/api/chat/route.ts`, `lib/db/queries.ts`

Integrated intent detection into chat API flow:

**Database Updates:**
- Extended `createMessage()` signature to accept optional `messageType` and `metadata` parameters
- Schema already supported `agent_request`, `agent_progress`, `agent_result` message types (committed in 02-01)

**Chat API Flow:**
1. After authentication and conversation setup, call `detectIntent(messages)`
2. If `intent === 'agent_summon'`:
   - Save user message with `messageType: 'text'`
   - Save agent request with `messageType: 'agent_request'` and metadata
   - Return JSON response (not streaming) with agent request details
   - Include `X-Conversation-Id` header for new conversations
3. If `intent === 'chat'`:
   - Proceed with existing `streamText()` flow
   - Future enhancement: append build offer if `offerBuild === true`

**Result:** User-specified intent rules now enforced in production - action verbs trigger agent confirmation, questions remain conversational.

## Verification

All success criteria met:
- ✅ `orchestrationPrompt` implements user's intent detection rules (action verbs, questions, ambiguous handling)
- ✅ `detectIntent()` function returns structured output with confidence score
- ✅ Agent summon intent includes summary, actions, destructive flag per user requirements
- ✅ Chat API integrates intent detection before streaming
- ✅ Action verbs (Create, Build, Deploy, Delete) trigger `agent_request` type
- ✅ Questions remain conversational with `streamText` flow
- ✅ TypeScript types define `IntentResult` and `AgentRequestMetadata`

**TypeScript Compilation:** ✅ No errors
**Build Status:** ✅ Successful production build
**Integration:** ✅ Intent detection called for every chat message

## Deviations from Plan

**None** - Plan executed exactly as written.

Note: Database schema extensions (`messageType`, `metadata` fields) were completed in plan 02-01 (commit `e70ee6e`). This plan consumed those schema changes as expected.

## Next Steps

Plan 02-03 will implement the agent confirmation UI to display the agent request card with summary, actions, and Proceed/Cancel buttons. The intent detection system is now ready to route requests to the confirmation flow.

## Technical Notes

**Structured Output Pattern:**
- AI SDK v6.0.79 `Output.object()` provides native Gemini structured output
- Zod validation ensures runtime type safety beyond TypeScript compile-time checks
- More reliable than regex parsing or JSON extraction from text responses

**Message Flow:**
- Agent requests create two messages: user message (text) + assistant message (agent_request)
- Metadata contains all confirmation details (summary, actions, destructive flags)
- UI can reconstruct confirmation card from saved metadata for conversation history

**Confidence Scoring:**
- Intent detection returns confidence score (0.0-1.0)
- Future enhancement: use confidence for ambiguity handling
- Current implementation: trust AI classification, always confirm before agent execution

## Self-Check: PASSED

Verification results:

**Created Files:**
- ✅ FOUND: lib/ai/intent-classifier.ts
- ✅ FOUND: lib/types/agent.ts

**Commits:**
- ✅ FOUND: 2863954 (orchestration prompt)
- ✅ FOUND: 497aa56 (intent classifier)
- ✅ FOUND: 74937f9 (chat API integration)

All implementation claims verified.
