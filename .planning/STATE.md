# Project State

## Current Position

Phase: Phase 2 — AI Orchestration & Intent Detection (02)
Plan: 4/5 completed
Status: In Progress
Last activity: 2026-02-11 — Completed 02-04 (Cross-Session Context Memory)

Progress: [████████░░░░░] 4/5 plans (80%)

## Performance Metrics

| Plan  | Duration | Tasks | Files |
|-------|----------|-------|-------|
| 01-01 | 4m 20s   | 2     | 13    |
| 01-02 | 4m 59s   | 3     | 17    |
| 01-03 | 2m 8s    | 2     | 4     |
| 01-04 | 3m 42s   | 3     | 10    |
| 01-05 | 2m 49s   | 3     | 7     |
| 01-06 | 2m 45s   | 3     | 11    |
| 01-07 | 4m 37s   | 3     | 11    |
| 01-08 | 48m 15s  | 7     | 7     |
| 01-09 | 3m 20s   | 2     | 2     |
| 01-11 | 17m 31s  | 1     | 4     |
| 01-13 | 5m 7s    | 4     | 5     |
| 02-01 | 3m 33s   | 3     | 3     |
| 02-02 | 2m 52s   | 3     | 5     |
| 02-04 | 1m 58s   | 3     | 4     |
| Phase 02 P03 | 193 | 3 tasks | 7 files |

## Decisions Made

1. **Use Google AI SDK instead of Anthropic** (01-01)
   - Rationale: Per user specification for Google Gemini

2. **UUID primary keys for all tables** (01-01)
   - Rationale: Better for distributed systems and prevents ID enumeration

3. **Cascade delete on foreign keys** (01-01)
   - Rationale: Ensures data integrity when users/conversations deleted

4. **Use JWT sessions instead of database sessions** (01-02)
   - Rationale: Reduces database load and better for edge deployments

5. **Use bcrypt-ts for Edge Runtime compatibility** (01-02)
   - Rationale: Native bcrypt doesn't work in edge environments

6. **Protect routes via middleware matcher** (01-02)
   - Rationale: Prevents auth bypass via URL manipulation

7. **Use Gemini 3 Flash Preview model** (01-03)
   - Rationale: Latest available Gemini 3 model in @ai-sdk/google v3.0.23

8. **Save messages in onFinish callback** (01-03)
   - Rationale: Ensures streaming completes successfully before persistence

9. **Edge Runtime for chat API** (01-03)
   - Rationale: Better streaming performance and lower latency

10. **Use 5-minute threshold for message grouping** (01-04)
    - Rationale: Industry standard (matches Slack), good balance between grouping and clarity

11. **User messages right-aligned blue, AI left-aligned gray** (01-04)
    - Rationale: Clear visual distinction per user requirements, follows WhatsApp/iMessage patterns

12. **Use Shiki with github-dark theme for syntax highlighting** (01-04)
    - Rationale: VS Code quality highlighting, familiar to developers, best language support

13. **Use Server Actions for conversation mutations** (01-05)
    - Rationale: Better integration with Next.js App Router, automatic revalidation

14. **X-Conversation-Id header for redirect** (01-05)
    - Rationale: Allows client to redirect to conversation URL after first message

15. **Client-side search for Phase 1** (01-06)
    - Rationale: Simpler implementation for title search. Server-side searchConversations function available for future message content search

16. **Zustand with localStorage persistence for sidebar** (01-06)
    - Rationale: Lightweight state management with automatic persistence, better than React Context

17. **Hover-activated actions in conversation list** (01-06)
    - Rationale: Cleaner UI per user decision (minimal display). Actions appear on hover to reduce visual clutter

18. **Use cmdk for command palette** (01-07)
    - Rationale: Already installed, handles keyboard navigation and fuzzy search automatically

19. **768px (Tailwind md) as mobile breakpoint** (01-07)
    - Rationale: Industry standard, matches Tailwind conventions, good for tablets

20. **Full-screen sidebar overlay on mobile** (01-07)
    - Rationale: More screen space for conversation list, standard mobile pattern

21. **Tap-to-show message actions on mobile** (01-07)
    - Rationale: Hover doesn't work on touch devices, tap is intuitive

22. **Remove root app/page.tsx for auth enforcement** (01-08)
    - Rationale: Prevents authentication bypass by ensuring all routes go through protected (chat) layout

23. **Use Node.js runtime for chat API (not Edge)** (01-08)
    - Rationale: postgres library requires Node.js APIs, streaming works equally well in Node.js runtime

24. **Use sendMessage({ role, content }) for AI SDK v3** (01-08)
    - Rationale: Correct API for useChat hook - append() is deprecated in v3.0.80

25. **Access message.content not message.parts** (01-08)
    - Rationale: AI SDK useChat returns messages with content string, not parts array

26. **Verified Gemini 3 Flash Preview model name** (01-08)
    - Rationale: Confirmed "gemini-3-flash-preview" is correct for Gemini 3 via official docs

27. **Use type guard for message timestamp safety** (01-09)
    - Rationale: Handle both UIMessage and SimpleMessage types safely when accessing createdAt property

28. **URL query parameter for prompt passing** (01-13)
    - Rationale: Next.js preserves query params through server action redirects, enables prompt to flow from sample click to chat interface without complex state management

29. **Auto-send prompt on mount instead of pre-populating input** (01-13)
    - Rationale: Sample prompts suggest immediate action - user expects AI to start working immediately, not require extra click

30. **Use window.addEventListener for keyboard shortcuts** (01-12)
    - Rationale: More consistent event capture across browser environments compared to document.addEventListener

31. **Add console telemetry for keyboard shortcut debugging** (01-12)
    - Rationale: Helps diagnose component mounting and event listener registration issues that may occur in production

32. **useEffect with messages.length === 0 guard** (01-13)
    - Rationale: Ensures prompt only sends once on mount, prevents duplicate sends if component re-renders

33. **Use absolute positioning for toggle button** (01-11)
    - Rationale: Simplest solution that works across both open and collapsed states without maintaining collapsed strip width

34. **Use JSONB for message metadata instead of separate columns** (02-01)
    - Rationale: Different message types need different metadata structures. JSONB provides flexibility without schema changes.

35. **Store context with upsert pattern (conversationId + contextKey as conflict target)** (02-01)
    - Rationale: Enables updating context as it evolves. Prevents duplicate context entries per conversation.

36. **Include contextType field for efficient filtering** (02-01)
    - Rationale: Allows loading only specific context types without scanning all context entries.

34. **Use AI SDK Output.object() for structured responses** (02-02)
    - Rationale: Leverages Gemini's native structured output with Zod validation for type-safe intent detection

35. **Return JSON (not stream) for agent_summon intent** (02-02)
    - Rationale: Agent requests require synchronous confirmation UI, not streaming text

36. **Save user message before intent detection response** (02-02)
    - Rationale: Ensures message persistence even if user cancels agent request

37. **Use AI-powered extraction instead of regex patterns for domain knowledge** (02-04)
    - Rationale: Handles natural language variations, identifies implicit context, extracts structured data, more maintainable than extensive regex rule sets

38. **Set confidence threshold at 0.7 to prevent false positives** (02-04)
    - Rationale: Ensures stored context is meaningful and actionable, prevents clutter from ambiguous mentions

39. **Process last 10 messages to respect token limits** (02-04)
    - Rationale: Recent messages more relevant for current context, reduces extraction latency, user-specified requirement

40. **Inject context directly into system prompt rather than separate message** (02-04)
    - Rationale: Simpler than managing separate context message, ensures context always visible to model, standard pattern for prompt augmentation

41. **Non-blocking context extraction (errors don't fail chat response)** (02-04)
    - Rationale: Chat functionality more critical than context storage, user receives response even if extraction fails
- [Phase 02-03]: Use shadcn Card component for agent request display
- [Phase 02-03]: Conditional border colors based on destructive flag (blue for safe, red for destructive)
- [Phase 02-03]: Destructive operations require checkbox confirmation before Proceed enabled
- [Phase 02-03]: Cancel action sends follow-up message asking for alternatives
- [Phase 02-03]: MessageContent component routes by messageType for extensibility
- [Phase 02-03]: Agent execute API endpoint stubbed (full implementation in Plan 02-05)

## Accumulated Context

**Foundation Established:**
- Next.js 16 with App Router and TypeScript
- Database schema: user, conversation, message tables
- User isolation enforced via foreign key constraints
- All core dependencies installed (AI SDK, Drizzle ORM, NextAuth v5, Tailwind CSS, Radix UI)

**Authentication System:**
- NextAuth v5 with credentials provider and JWT sessions
- Bcrypt password hashing (10 rounds) via bcrypt-ts
- User registration and login flows with server actions
- Route protection via middleware (matcher pattern)
- Comprehensive form validation (client + server side)
- Toast notifications with sonner for user feedback
- Database ready for migration (pending DATABASE_URL configuration)

**Streaming Chat API:**
- Google Gemini 3 Flash integration via @ai-sdk/google
- Streaming AI responses with Vercel AI SDK streamText
- Edge Runtime for optimal streaming performance
- Authentication-protected /api/chat endpoint
- Automatic conversation creation and title generation
- Message persistence after streaming completes
- User data isolation via conversation ownership checks

**Chat UI with Message Display:**
- Complete message display system with user/AI visual distinction
- Avatars for both user and AI messages (Radix UI)
- Message grouping by role and time (5-minute threshold)
- Markdown rendering with Streamdown for streaming support
- Syntax highlighting with Shiki (20+ languages)
- Code blocks with copy buttons and language labels
- Hover-activated message actions (copy, edit, delete placeholders)
- Auto-scrolling message list with custom styled scrollbars
- Professional, clean aesthetic with proper spacing and colors

**Conversation Management:**
- Server Actions for conversation CRUD (create, rename, delete, pin)
- Dynamic routing with [conversationId] for URL persistence
- User-isolated database queries with ownership checks
- Confirmation dialog system using Radix UI
- Conversation history persists across browser sessions
- Automatic redirect to conversation URL after first message
- Delete cascades to messages automatically via foreign key

**Conversation Sidebar:**
- Collapsible sidebar with Zustand state management (localStorage persistence)
- Conversation list with pinned + recent organization
- Individual conversation items with hover actions (pin, rename, delete)
- Search functionality with debouncing (300ms) and keyboard shortcuts (Cmd+K)
- Empty state with welcome message and sample prompts
- Rename conversation dialog with validation
- Client-side title search (server-side message content search prepared)
- Mobile: Full-screen overlay with backdrop
- Desktop: Fixed sidebar with collapse
- User menu with logout at bottom

**Keyboard Shortcuts & Mobile UI:**
- Comprehensive keyboard shortcuts with platform detection (Cmd/Ctrl)
- Command palette (Cmd+K) with fuzzy search and categorized actions
- Shortcuts: Cmd+N (new), Cmd+F (search), Cmd+B (toggle sidebar), Cmd+R (rename), Cmd+Shift+D (delete)
- Stable event listener registration via window.addEventListener
- Console telemetry for debugging component lifecycle and shortcut execution
- Handler functions stabilized with useCallback for minimal re-renders
- Mobile-optimized UI with viewport detection (768px breakpoint)
- Mobile: Full-screen sidebar overlay, header with menu button, tap-friendly actions
- Touch targets meet 44x44px minimum for accessibility
- Mobile CSS: iOS zoom prevention, safe area insets, smooth scrolling
- Logout functionality via sidebar user menu and command palette (AUTH-05)

**Human Verification (01-08):**
- Comprehensive Playwright-based testing completed
- All 15 Phase 1 requirements verified functional
- Environment configuration validated (PostgreSQL, NextAuth, Google Gemini)
- End-to-end flow tested: registration → login → send message → receive AI response → database persistence
- Response time: ~2.4s for Gemini 3 Flash Preview responses
- 7 critical issues identified and resolved during verification
- Application ready for production use

**Sample Prompt Auto-Send (01-13):**
- Complete click-to-send flow for sample prompts in empty state
- URL parameter passing for prompt text through navigation
- Auto-send on mount with useEffect and guard conditions
- Enables zero-friction start for new users
- Sample prompts: "Help me automate a workflow", "Analyze this data", "Explain a complex concept", "Review my code"

**Agent Orchestration Database Schema (02-01):**
- Message table extended with messageType (text, agent_request, agent_progress, agent_result) and metadata (JSONB)
- conversationContext table for cross-session memory with contextType, contextKey, contextValue fields
- Context storage functions: storeContext (with upsert), retrieveContext, retrieveContextByType
- JSONB storage pattern enables flexible metadata structures for different agent message types
- Foreign key cascade delete ensures context cleanup when conversations deleted
- Database ready for agent orchestration implementation

**Agent Confirmation UI (02-03):**
- AgentRequestCard component with conditional border colors (blue for safe, red for destructive)
- Natural language summary with expandable details section
- Destructive operation warnings with checkbox confirmation requirement
- Proceed/Cancel buttons with loading states and post-action status display
- MessageContent component routes messages by messageType (text, agent_request, agent_progress, agent_result)
- Chat interface handles both streaming (text) and JSON (agent_request) responses
- Agent execute API endpoint stub at /api/agent/execute (full implementation in 02-05)
- Cancel action sends follow-up message asking for alternatives
- User consent and transparency requirements (ORCH-02, ORCH-04) implemented

**Cross-Session Context Memory (02-04):**
- AI-powered context extraction using Gemini structured output with Zod validation
- Context types: domain, preference, project, technology
- Confidence threshold (>0.7) prevents false positives
- Last 10 messages processed to respect token limits
- formatContextForPrompt() converts stored context to prompt-ready format
- Context loaded at conversation start and injected into system prompt
- Non-blocking extraction after AI responses (errors don't fail chat)
- Cross-session memory (ORCH-06) and domain adaptation (ORCH-07) implemented
- AI remembers user's tech stack, terminology, and project details across sessions

## Session Info

Last session: 2026-02-11T15:08:48Z
Stopped at: Completed 02-03-PLAN.md (Agent Confirmation UI)

---
*Last updated: 2026-02-11*

