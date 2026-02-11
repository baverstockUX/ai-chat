# Project State

## Current Position

Phase: Phase 1 — Chat Foundation & Authentication (01)
Plan: 7/8 completed
Status: Executing
Last activity: 2026-02-11 — Completed 01-07-PLAN.md (Keyboard Shortcuts & Mobile UI)

Progress: [███████░] 7/8 plans (87.5%)

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
- Mobile-optimized UI with viewport detection (768px breakpoint)
- Mobile: Full-screen sidebar overlay, header with menu button, tap-friendly actions
- Touch targets meet 44x44px minimum for accessibility
- Mobile CSS: iOS zoom prevention, safe area insets, smooth scrolling
- Logout functionality via sidebar user menu and command palette (AUTH-05)

## Session Info

Last session: 2026-02-11T08:27:33Z
Stopped at: Completed 01-07-PLAN.md

---
*Last updated: 2026-02-11*
