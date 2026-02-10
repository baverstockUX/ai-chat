# Project Research Summary

**Project:** AI Chat Interface with Agent Orchestration
**Domain:** AI-powered workflow automation for operations teams
**Researched:** 2026-02-10
**Confidence:** HIGH

## Executive Summary

This project is an AI chat interface that orchestrates CLI agents (specifically opencode) to automate operations workflows. The industry standard approach uses Next.js/Vue with Vercel AI SDK for streaming chat, LangGraph for agent orchestration, and event-driven architecture for real-time execution visibility. The core differentiator is workflow persistence (Resources) — saving successful agent executions as reusable templates that teams can fork and remix, GitHub-style.

The recommended approach: Start with proven chat patterns (Vercel AI SDK's useChat hook), build solid agent execution visibility early (event-driven with WebSocket/SSE), and establish orchestration decision boundaries from day 1 (when to chat vs. when to execute). Use a phased approach: chat foundation → agent orchestration → workflow persistence → personalization → collaboration. The stack is mature and well-documented — this is a well-trodden path with clear best practices.

Key risks center on orchestration ambiguity (when to summon agent vs. respond directly), silent agent failures eroding trust, and context window exhaustion in long workflows. Mitigation: explicit routing rules + AI classification, structured error handling with status tracking, and conversation summarization. Security boundary: treat all user input as potentially adversarial (prompt injection), implement confirmation flows for destructive operations, and isolate user contexts strictly.

## Key Findings

### Recommended Stack

Modern JavaScript ecosystem with AI-first tooling. Next.js 16 + React 19 or Vue 3 + Nuxt provide the foundation, with Vercel AI SDK (v6.0.78) handling streaming chat and LangGraph (v1.1.4) orchestrating multi-step agent workflows. TypeScript 5.9.3 is non-negotiable for type safety across the AI integration layer.

**Core technologies:**
- **Next.js 16 + React 19 (or Vue 3 + Nuxt 3)**: Full-stack framework with built-in API routes and Server Components for streaming AI responses
- **Vercel AI SDK 6.0.78**: Purpose-built for AI chat with streaming, tool calling, structured outputs, and native MCP support
- **LangGraph 1.1.4**: State-of-the-art agent orchestration with state management, error recovery, and human-in-the-loop patterns
- **PostgreSQL 17 + Drizzle ORM**: Enterprise-grade database with JSON support for conversations and pgvector extension for embeddings
- **Zustand/Pinia + TanStack Query**: Client state management (ephemeral) and server state caching (persistent data)
- **Socket.io 4.8.3**: Real-time bidirectional communication for agent execution updates and presence
- **Tailwind CSS 4 + shadcn/ui**: Utility-first styling with production-ready component library

**Critical version requirements:**
- Next.js 16 requires React 19 (not compatible with React 18)
- LangGraph 1.1.4 must match @langchain/core 1.1.x
- Radix UI (shadcn/ui foundation) works in Client Components only with React 19

**Confidence:** HIGH — All versions verified from npm registry (2026-02-10). Stack explicitly supports agent, agentic, tool-calling, and MCP patterns.

### Expected Features

Research identified three feature categories: table stakes (users expect), differentiators (competitive advantage), and anti-features (avoid).

**Must have (table stakes):**
- Chat interface with streaming responses and markdown/code rendering
- Message history and conversation management
- Basic tool calling with execution visibility
- Stop/cancel execution control
- File upload/attachments for logs and configs
- Authentication and error handling
- Export/share conversation capability

**Should have (competitive differentiators):**
- **Workflow Persistence (Resources)** — Save successful agent workflows as reusable templates (core value prop)
- **Fork/Remix Workflows** — GitHub-style collaboration model for teams
- **Dynamic Execution View** — Real-time visualization of agent steps and tool usage
- **Domain Context Memory** — AI learns team's infrastructure and tools over time
- **Human-in-the-Loop Approvals** — Safety gates for critical operations
- **Proactive Suggestions** — AI suggests automation opportunities based on patterns

**Defer (v2+):**
- Multi-agent orchestration (requires solid single-agent foundation first)
- Conditional execution paths (wait for user sophistication)
- Scheduled/triggered workflows (infrastructure overhead)
- Approval workflows and audit trails (enterprise features)

**Key insight:** No competitor (ChatGPT, Claude, Cursor, Replit) has reusable workflow templates for operations. This is the primary differentiator. All competitors are developer-focused; this targets operations teams.

**Confidence:** MEDIUM — Based on competitor analysis from training data (may be outdated) and industry patterns. Should validate with operations team user research.

### Architecture Approach

Layered architecture with clear separation of concerns: presentation (UI components) → state management (Pinia/Zustand) → orchestration (AI decision layer) → execution (agent spawning) → persistence (repositories) → data (database). This enables testing at each layer and parallel development.

**Major components:**
1. **AI Orchestrator** — Classifies intent (chat vs. agent), routes decisions, generates tool calls. Uses fallback chain: pattern matching → heuristics → LLM classification (cost-effective).
2. **Agent Executor** — Spawns opencode CLI subprocess, parses output streams, emits events. Event-driven architecture enables real-time UI updates via WebSocket.
3. **Repository Layer** — Abstracts data access with caching. Enables swapping SQLite (dev) to PostgreSQL (prod) without touching business logic.
4. **Memory Service** — Manages user context with token budget awareness. Semantic search via vector DB for relevant past interactions.

**Key patterns:**
- **Command-Query Separation with Optimistic Updates**: UI updates immediately, server confirms. Rollback on error.
- **Event-Driven Agent Execution**: Agent emits typed events (start, tool_call, file_change, complete, error) that UI subscribes to.
- **Repository Pattern with Caching**: LRU cache at repository level, invalidate on writes.
- **Intent Router with Fallback Chain**: Fast pattern matching first, expensive LLM classification last.
- **Memory Layer with Context Window Management**: Incremental context updates, cached embeddings, only recompute on changes.

**Build order (critical path):**
1. Phase 1: Chat Infrastructure (no dependencies)
2. Phase 2: AI Orchestrator (depends on chat)
3. Phase 3: Agent Execution (depends on orchestrator)
4. Phase 4+: Resources, Personalization, Collaboration (branch from Phase 3)

**Confidence:** HIGH — Based on established patterns from Anthropic's agentic systems documentation, Vercel AI SDK architecture, and LangChain orchestration framework.

### Critical Pitfalls

Research identified 10 critical pitfalls from official Anthropic documentation and domain expertise:

1. **Ambiguous Orchestration Decisions** — AI makes poor choices about when to summon agent vs. respond directly. Mitigation: Explicit routing rules, confidence thresholds, dry-run mode.

2. **Silent Agent Failures** — Agent failures don't surface properly, AI hallucinates success. Mitigation: Structured error responses, explicit failure states, status tracking in UI.

3. **Context Window Exhaustion** — Long workflows exceed token limits, AI forgets earlier steps. Mitigation: Conversation summarization, separate workflow state from context, windowing.

4. **Agent Output Interpretation Failures** — AI misinterprets structured agent data, extracts wrong values. Mitigation: Strict output schemas, structured outputs API, validation before AI sees data.

5. **Unsafe Parameter Inference** — AI infers destructive parameters user didn't provide. Mitigation: Never allow inference for delete/deploy operations, confirmation flows, dry-run first.

6. **Execution Feedback Desert** — User sees blank screen during long operations, doesn't know status. Mitigation: Stream progress via WebSocket, show stages, allow cancellation.

7. **Personalization Privacy Leakage** — User data exposed to other users or leaked in logs. Mitigation: User-scoped queries, PII scrubbing, data boundary layer between AI and user data.

8. **Collaborative Chaos** — Multiple users overwrite each other's work. Mitigation: Pessimistic locking, version numbers, conflict resolution UI.

9. **Mocked Data Uncanny Valley** — POC with perfect mocks breaks spectacularly with real data. Mitigation: Sample real data early, include edge cases, test realistic volumes.

10. **Prompt Injection Vulnerabilities** — User input manipulates AI behavior, triggers destructive actions. Mitigation: Structured message format, input validation, privilege separation, XML/JSON tags for untrusted content.

**Confidence:** HIGH — Pitfalls 1-6 verified from Anthropic's official Tool Use documentation. Pitfalls 7-10 based on established security and system design principles.

## Implications for Roadmap

Based on architecture dependencies, feature priorities, and pitfall prevention timing, suggest 6-phase roadmap structure:

### Phase 1: Foundation (Weeks 1-4)
**Rationale:** Must establish chat + orchestration decision logic before anything else. This is the critical path — all other phases depend on it. ARCHITECTURE.md identifies this as Phase 1 with no dependencies.

**Delivers:** Working chat interface with AI orchestration that can route to agent or respond directly. Basic agent execution (synchronous OK for now).

**Addresses from FEATURES.md:**
- Chat interface with streaming responses
- Message history and conversation management
- Basic tool calling (opencode CLI integration)
- Code block rendering
- Stop/cancel execution

**Avoids from PITFALLS.md:**
- Pitfall 1: Ambiguous Orchestration Decisions — establish routing rules from day 1
- Pitfall 2: Silent Agent Failures — build error handling architecture
- Pitfall 5: Unsafe Parameter Inference — implement confirmation flows for destructive ops
- Pitfall 9: Mocked Data Uncanny Valley — use realistic mocks from start
- Pitfall 10: Prompt Injection — security boundaries established early

**Research flag:** Standard patterns, skip deep research. Vercel AI SDK + LangGraph have excellent docs.

### Phase 2: Execution Visibility (Weeks 5-6)
**Rationale:** Users must see what agent is doing to build trust. PITFALLS.md identifies "Execution Feedback Desert" as critical. ARCHITECTURE.md designates this as Phase 3 but can be accelerated since it only depends on Phase 1 agent execution working.

**Delivers:** Real-time progress updates during agent execution. WebSocket/SSE infrastructure. Dynamic execution view showing commands, outputs, file changes.

**Addresses from FEATURES.md:**
- Dynamic Execution View (differentiator)
- Execution visibility (table stakes)
- Real-time feedback

**Avoids from PITFALLS.md:**
- Pitfall 6: Execution Feedback Desert — stream progress, show stages
- Pitfall 2: Silent Agent Failures — surface errors clearly with recovery actions

**Uses from STACK.md:**
- Socket.io 4.8.3 for bidirectional real-time communication
- Event-driven architecture pattern from ARCHITECTURE.md

**Research flag:** Standard WebSocket patterns, skip research.

### Phase 3: Workflow Persistence (Resources) (Weeks 7-10)
**Rationale:** Core differentiator per FEATURES.md. No competitor has this. Requires Phase 1 (agent working) and Phase 2 (execution visible) to be valuable — users need to see workflows execute before saving them as templates.

**Delivers:** Save successful agent workflows as Resources. Browse, preview, execute saved workflows. Basic sharing (link to resource).

**Addresses from FEATURES.md:**
- Workflow Persistence (Resources) — primary differentiator
- Resource browser and preview
- Export/share conversation

**Implements from ARCHITECTURE.md:**
- Resource Repository (data access layer)
- Resource Browser UI component
- Database schema for resources table

**Avoids from PITFALLS.md:**
- Pitfall 3: Context Window Exhaustion — store workflow state separately from conversation

**Research flag:** Standard CRUD patterns, skip research. Focus on UX testing with operations teams.

### Phase 4: Personalization & Context (Weeks 11-14)
**Rationale:** Requires usage data to be valuable. FEATURES.md suggests deferring until core validated. ARCHITECTURE.md places this as Phase 5. Makes AI smarter by learning team's tools and patterns.

**Delivers:** Domain context memory (AI remembers team's infrastructure). Proactive suggestions based on patterns. Team knowledge base integration (basic).

**Addresses from FEATURES.md:**
- Domain Context Memory (differentiator)
- Proactive Suggestions (differentiator)
- Contextual Tool Recommendations

**Implements from ARCHITECTURE.md:**
- Memory Service with vector search
- Context window management
- Conversation summarization

**Avoids from PITFALLS.md:**
- Pitfall 3: Context Window Exhaustion — implement summarization and windowing
- Pitfall 7: Personalization Privacy Leakage — user-scoped queries, PII scrubbing

**Uses from STACK.md:**
- PostgreSQL pgvector extension for semantic search
- Pinecone (optional) for dedicated vector DB

**Research flag:** NEEDS RESEARCH — Vector search patterns, embedding strategies, context management. Use `/gsd:research-phase` for "Vector-based personalization" before starting.

### Phase 5: Team Collaboration (Weeks 15-18)
**Rationale:** Requires multiple users and workflows. FEATURES.md identifies Fork/Remix as key differentiator. ARCHITECTURE.md places this as Phase 6 (last) because it depends on all prior systems working.

**Delivers:** Fork workflows (GitHub-style). Workflow versioning. Collaboration comments. Merge/diff UI for workflow changes.

**Addresses from FEATURES.md:**
- Fork/Remix Workflows (differentiator)
- Workflow versioning
- Collaboration comments

**Implements from ARCHITECTURE.md:**
- Fork/branch logic (collaboration service)
- Conflict detection and resolution
- Multi-user state sync

**Avoids from PITFALLS.md:**
- Pitfall 8: Collaborative Chaos — implement pessimistic locking, version numbers, conflict resolution

**Research flag:** Standard patterns (Git-like forking), skip deep research. May need UX research on merge/diff for non-developers.

### Phase 6: Advanced Features (Weeks 19+)
**Rationale:** Polish and enterprise features. FEATURES.md defers to v2+. Only implement if earlier phases validated with users.

**Delivers:** Workflow analytics (usage, success rates). Execution replay (debugging). Scheduled/triggered workflows. Approval workflows. Audit trail.

**Addresses from FEATURES.md:**
- Workflow Analytics (post-validation feature)
- Execution Replay (debugging tool)
- Scheduled Workflows (automation, deferred)
- Approval Workflows (enterprise, deferred)
- Audit Trail (compliance, deferred)

**Research flag:** Standard patterns (job scheduling, analytics, audit logs), skip research unless enterprise interest confirmed.

### Phase Ordering Rationale

**Why this order:**
1. **Foundation first** — Can't build anything without working chat + orchestration
2. **Visibility before persistence** — Users must trust execution before saving workflows
3. **Personalization after validation** — Requires usage data, expensive to build prematurely
4. **Collaboration last** — Most complex, requires all systems stable

**Critical path:** Phase 1 → Phase 2 → Phase 3. These must be sequential.

**Parallel opportunities:**
- Phase 4 (Personalization) can start once Phase 2 completes (doesn't need Phase 3)
- Phase 6 features can be developed in parallel if team capacity exists

**How this avoids pitfalls:**
- Orchestration decisions (Pitfall 1) established in Phase 1 before complexity grows
- Error handling (Pitfall 2) and security (Pitfall 10) architected early, not bolted on later
- Context management (Pitfall 3) addressed in Phase 4 when conversations get longer
- Privacy (Pitfall 7) designed into architecture from Phase 1, enforced in Phase 4
- Collaboration conflicts (Pitfall 8) isolated to Phase 5 when other systems stable

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 4 (Personalization):** Vector search patterns, embedding strategies, context window management at scale. Niche domain with evolving best practices. **Use `/gsd:research-phase`** before starting.
- **Phase 6 (Advanced):** Only if enterprise features required. Workflow scheduling, compliance audit patterns may need research for specific requirements.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** Vercel AI SDK and LangGraph have excellent documentation. Chat UI patterns well-established.
- **Phase 2 (Execution Visibility):** WebSocket/SSE patterns mature. Socket.io docs comprehensive.
- **Phase 3 (Resources):** Standard CRUD. Focus on UX testing, not technical research.
- **Phase 5 (Collaboration):** Git-like forking is established pattern. Optimistic/pessimistic locking well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | All versions verified from npm registry (2026-02-10). Vercel AI SDK, LangGraph, Next.js explicitly support agent orchestration patterns. |
| Features | **MEDIUM** | Competitor analysis based on training data (may be outdated). Table stakes assessment logical but not empirically validated with operations teams. |
| Architecture | **HIGH** | Based on Anthropic's official documentation, Vercel AI SDK patterns, and LangChain orchestration framework. Layered architecture is standard. |
| Pitfalls | **HIGH** | Top 6 pitfalls verified from Anthropic Tool Use documentation. Remaining 4 based on established security and system design principles. |

**Overall confidence:** **HIGH**

Research provides strong foundation for roadmap planning. Stack is mature and well-documented. Architecture patterns proven. Primary uncertainty is feature prioritization — should validate with operations team user research.

### Gaps to Address

**During planning:**
- **User research with operations teams:** Validate table stakes vs. differentiators. Confirm workflow persistence (Resources) solves real pain point.
- **OpenCode CLI agent specifics:** Research assumed standard CLI tool patterns. Verify opencode's actual output format, error codes, execution model during Phase 1 implementation.
- **Mocked data realism:** Source 50-100 real workflow examples from operations teams before Phase 1 completion. Update mocks to match reality.

**During implementation:**
- **Context window strategy:** Phase 4 requires deciding between in-database summarization vs. vector DB retrieval. Research during Phase 3 planning.
- **Collaboration UX for non-developers:** Fork/merge/diff familiar to developers but not operations teams. UX testing needed in Phase 5.
- **LLM cost modeling:** Monitor token usage per conversation. Research summarization strategies if costs exceed budget in Phase 4.

## Sources

### Primary (HIGH confidence)
- **npm Registry** (2026-02-10) — Version verification for Next.js 16.1.6, React 19.2.4, Vercel AI SDK 6.0.78, LangGraph 1.1.4, all supporting packages
- **GitHub Repositories** (2026-02-10) — Star counts, activity, feature descriptions for Vercel AI SDK (21.6k stars), LangGraph (24.5k stars)
- **Anthropic Tool Use Documentation** (https://platform.claude.com/docs/en/docs/build-with-claude/tool-use) — Verified pitfalls about tool use patterns, structured outputs, error handling
- **Vercel AI SDK Package Metadata** — Keywords confirm agent, agentic, tool-calling, MCP support

### Secondary (MEDIUM confidence)
- **Training Data** (January 2025 cutoff) — ChatGPT, Claude, Cursor, Replit features. Competitor analysis may be outdated. Should validate manually.
- **Training Data** (January 2025 cutoff) — Architecture patterns for AI chat interfaces, event-driven systems, agent orchestration. Patterns are established but implementation details may have evolved.
- **Training Data** (January 2025 cutoff) — Operations automation tools (Rundeck, StackStorm, Ansible), workflow platforms (Zapier, n8n), DevOps chat tools. General patterns valid but specific integrations may differ.

### Tertiary (LOW confidence)
- **Project Context Inference** — OpenCode CLI agent behavior assumed based on standard CLI tool patterns. Not independently verified. Validate during Phase 1.

---
*Research completed: 2026-02-10*
*Ready for roadmap: yes*
