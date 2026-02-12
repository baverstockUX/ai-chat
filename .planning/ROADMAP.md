# Roadmap: AI Chat Interface POC

**Milestone:** v1.0 Full Orchestration
**Created:** 2025-02-10
**Total Requirements:** 48

## Overview

Six-phase roadmap building from foundation (chat + orchestration) → execution visibility → workflow persistence → deployment. Each phase delivers observable user value and builds toward the complete vision.

### Phase 1: Chat Foundation & Authentication

**Goal:** Users can have natural conversations with AI in a persistent, professional chat interface.

**Duration Estimate:** 2-3 weeks

**Requirements:** CHAT-01 through CHAT-10, AUTH-01 through AUTH-05 (15 requirements)

**Plans:** 13 plans in 1 wave

Plans:
- [x] 01-01-PLAN.md — Project setup, Next.js initialization, database schema
- [x] 01-02-PLAN.md — Authentication system with NextAuth and bcrypt
- [x] 01-03-PLAN.md — Streaming chat API with Google Gemini
- [x] 01-04-PLAN.md — Chat UI with message display and markdown rendering
- [x] 01-05-PLAN.md — Conversation management (CRUD operations)
- [x] 01-06-PLAN.md — Sidebar with conversation list and search
- [x] 01-07-PLAN.md — Keyboard shortcuts and mobile UI
- [x] 01-08-PLAN.md — Human verification checkpoint
- [x] 01-09-PLAN.md — Fix message grouping and mobile toggle (gap closure)
- [x] 01-10-PLAN.md — Fix redirect error toasts (gap closure)
- [x] 01-11-PLAN.md — Fix sidebar collapse button visibility (gap closure)
- [x] 01-12-PLAN.md — Fix keyboard shortcuts mounting and stability (gap closure)
- [x] 01-13-PLAN.md — Enable sample prompt auto-send flow (gap closure)

**Deliverables:**
- Working chat interface with streaming AI responses
- Markdown and code rendering with syntax highlighting
- Conversation management (create, rename, delete, search)
- User authentication and session management
- Cross-session persistence

**Success Criteria:**
1. User sends message and receives streaming AI response within 2 seconds
2. User creates multiple conversations, switches between them, and history persists across browser restarts
3. AI response with code block displays with syntax highlighting and functional copy button
4. User logs out and back in, sees their conversations intact
5. Two different users log in and see completely isolated conversation data

**Dependencies:** None (foundation phase)

**Risks:**
- Streaming response implementation complexity with Next.js App Router
- Session management security

**Mapped Requirements:**
- CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05
- CHAT-06, CHAT-07, CHAT-08, CHAT-09, CHAT-10
- AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05

---

### Phase 2: AI Orchestration & Intent Detection

**Goal:** AI intelligently decides when to respond conversationally vs. summon an agent, establishing the core "magic" of the interface.

**Status:** ✓ Complete (2026-02-11)

**Duration Estimate:** 2-3 weeks

**Requirements:** ORCH-01 through ORCH-07 (7 requirements)

**Plans:** 5 plans in 3 waves

Plans:
- [x] 02-01-PLAN.md — Database schema for orchestration (message types, context memory)
- [x] 02-02-PLAN.md — Intent classification system with structured output
- [x] 02-03-PLAN.md — Agent confirmation UI with Proceed/Cancel
- [x] 02-04-PLAN.md — Context memory system for cross-session adaptation
- [x] 02-05-PLAN.md — Agent execution with mock streaming (checkpoint)

**Deliverables:**
- Intent classification system (chat vs build detection)
- Agent summoning logic with context injection
- Confirmation flows for destructive operations
- Cross-session context memory
- Domain adaptation

**Success Criteria:**
1. User asks "How do I create a workflow?" → AI responds conversationally without summoning agent
2. User says "Create a workflow that sends me daily reports" → AI explains it will summon agent and asks to proceed
3. User requests "Delete all data" → AI asks for explicit confirmation before proceeding
4. User mentions "Kubernetes" in conversation, returns next day, says "check the cluster" → AI remembers Kubernetes context
5. AI correctly routes 9/10 requests (chat vs build) in test scenarios

**Dependencies:** Phase 1 (needs working chat interface)

**Risks:**
- Orchestration decision quality (false positives/negatives)
- Context memory storage and retrieval performance
- Prompt injection vulnerabilities

**Mapped Requirements:**
- ORCH-01, ORCH-02, ORCH-03, ORCH-04
- ORCH-05, ORCH-06, ORCH-07

---

### Phase 3: Agent Execution & Basic Visibility

**Goal:** System spawns opencode CLI agents and captures their output, surfacing execution status to users.

**Status:** ✓ Complete (2026-02-12)

**Duration Estimate:** 2-3 weeks

**Requirements:** EXEC-01, EXEC-02, EXEC-07, EXEC-08, EXEC-09, EXEC-10, EXEC-11 (7 requirements)

**Plans:** 2 plans in 2 waves

Plans:
- [x] 03-01-PLAN.md — Real opencode agent with process spawning and error handling
- [x] 03-02-PLAN.md — Cancellation support with clean process termination

**Deliverables:**
- CLI agent spawning and process management
- Output capture (stdout/stderr)
- Basic execution status display
- Error handling and recovery suggestions
- Cancellation with cleanup

**Success Criteria:**
1. AI summons agent → process spawns → output captured → returned to chat
2. Agent completes successfully → user sees success message with output summary
3. Agent fails with error → user sees clear error message and suggested recovery action
4. User cancels long-running agent → process terminates cleanly within 2 seconds
5. Agent execution survives and recovers from network interruption

**Dependencies:** Phase 2 (needs orchestration to summon agents)

**Risks:**
- Process cleanup on failures or cancellations
- Capturing stderr without blocking
- Security of CLI agent execution environment

**Mapped Requirements:**
- EXEC-01, EXEC-02, EXEC-07, EXEC-08
- EXEC-09, EXEC-10, EXEC-11

---

### Phase 4: Dynamic Execution View

**Goal:** Users see real-time visualization of agent execution (commands, file changes, tool calls) building trust through transparency.

**Status:** ✓ Complete (2026-02-12)

**Duration Estimate:** 2 weeks

**Requirements:** EXEC-03, EXEC-04, EXEC-05, EXEC-06 (4 requirements)

**Plans:** 2 gap closure plans in 1 wave

Plans:
- [x] 04-02-PLAN.md — Fix SSE metadata sync for real-time execution visualization
- [x] 04-03-PLAN.md — Add agent_progress message routing to MessageList

**Deliverables:**
- Real-time WebSocket/SSE streaming
- Dynamic view component showing execution progress
- Command display, file change tracking, tool call visualization
- Step-by-step execution timeline

**Success Criteria:**
1. Agent starts executing → dynamic view opens and displays "Starting..." status
2. Agent runs command → command appears in dynamic view with timestamp
3. Agent modifies file → file path and change type display in real-time
4. Agent calls tool → tool name and parameters display in dynamic view
5. User watches 5-step workflow execute and sees all 5 steps appear as they happen

**Dependencies:** Phase 3 (needs agent execution working)

**Risks:**
- WebSocket connection stability
- Parsing agent output into structured events
- Performance with high-frequency updates

**Mapped Requirements:**
- EXEC-03, EXEC-04, EXEC-05, EXEC-06

---

### Phase 5: Resources Management & Sharing

**Goal:** Users save successful agent workflows as Resources, browse them, share with colleagues, and fork shared workflows.

**Duration Estimate:** 3-4 weeks

**Requirements:** RES-01 through RES-12, INPUT-01 through INPUT-06 (18 requirements)

**Plans:** 6 plans in 3 waves

Plans:
- [ ] 05-01-PLAN.md — Database schema for resources (tables, queries, migration)
- [ ] 05-02-PLAN.md — Image upload infrastructure (Server Action, filesystem storage)
- [ ] 05-03-PLAN.md — Resource save and browser (save dialog, resource list, search/filter)
- [ ] 05-04-PLAN.md — Resource sharing (shareable links, token-based access)
- [ ] 05-05-PLAN.md — Fork and execute resources (lineage tracking, workflow execution)
- [ ] 05-06-PLAN.md — Web search and image upload UI (DuckDuckGo, chat integration)

**Deliverables:**
- Resource save functionality
- Resources browser with search/filter
- Resource preview and execution
- Sharing mechanism (shareable links)
- Fork/branch workflow with lineage tracking
- Image upload and web search integration

**Success Criteria:**
1. User completes agent workflow → clicks "Save as Resource" → provides name/description → Resource appears in their workspace
2. User searches Resources for "deployment" → finds 3 matching Resources → previews one → sees full workflow details
3. User shares Resource via link → colleague opens link → sees Resource → clicks "Fork" → has independent copy
4. User modifies forked Resource → original unchanged → forked version shows "forked from X by Y"
5. User uploads image → image displays inline → AI analyzes and describes image content
6. User triggers web search → results display → AI incorporates findings into response

**Dependencies:** Phase 4 (needs execution visibility for users to trust saving workflows)

**Risks:**
- Resource versioning and lineage tracking complexity
- Shareable link security (access control)
- Storage scaling for images and workflow data

**Mapped Requirements:**
- RES-01, RES-02, RES-03, RES-04, RES-05, RES-06
- RES-07, RES-08, RES-09, RES-10, RES-11, RES-12
- INPUT-01, INPUT-02, INPUT-03, INPUT-04, INPUT-05, INPUT-06

---

### Phase 6: Polish & Deployment

**Goal:** Production-ready POC deployed for stakeholder demo and user testing.

**Duration Estimate:** 1-2 weeks

**Requirements:** None (refinement phase)

**Deliverables:**
- Performance optimization (load times, streaming latency)
- Error boundary improvements
- Loading states and transitions
- Mobile responsive polish
- Demo environment deployment
- User testing preparation

**Success Criteria:**
1. Chat message response starts streaming within 500ms
2. All pages load within 1 second on 3G connection
3. Zero unhandled exceptions in production error logs
4. Interface works on mobile browsers (iOS Safari, Android Chrome)
5. Demo deployment stable for 48 hours of continuous use

**Dependencies:** Phase 5 (needs all features working)

**Risks:**
- Performance bottlenecks discovered late
- Deployment environment issues
- Last-minute feature creep

**Mapped Requirements:** None (polish phase)

---

## Phase Summary

| Phase | Name | Requirements | Estimated Duration |
|-------|------|--------------|-------------------|
| 1 | Chat Foundation & Authentication | 15 | 2-3 weeks |
| 2 | AI Orchestration & Intent Detection | 7 | 2-3 weeks |
| 3 | Agent Execution & Basic Visibility | 7 | 2-3 weeks |
| 4 | Dynamic Execution View | 4 | 2 weeks |
| 5 | Resources Management & Sharing | 18 | 3-4 weeks |
| 6 | Polish & Deployment | 0 | 1-2 weeks |
| **Total** | | **48 + polish** | **12-17 weeks** |

## Coverage Validation

✓ All 48 v1.0 requirements mapped to phases
✓ No requirements unmapped
✓ Each phase has clear success criteria
✓ Dependencies respected (foundation → orchestration → execution → resources)
✓ Progressive value delivery (each phase ships working features)

---
*Roadmap created: 2025-02-10*
*Ready for execution: yes*
