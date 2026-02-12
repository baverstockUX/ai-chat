# Phase 2: AI Orchestration & Intent Detection - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Building the intelligent routing layer that decides when to chat vs. when to summon an agent. Agents take tangible actions (Claude Cowork-style) including file operations, API calls, terminal commands, and database operations. The system establishes trust through transparent confirmation flows while giving agents real execution capability.

</domain>

<decisions>
## Implementation Decisions

### Intent Classification Approach
- **Trigger mechanism:** Explicit action verbs ("Create", "Build", "Deploy", "Delete") trigger agent summoning. Questions and discussions remain conversational.
- **Confidence threshold:** Always confirm before summoning agent - explain what will happen, user clicks Proceed
- **Ambiguous intent handling:** Default to chat mode, but offer build option ("Actually, would you like me to build this?")
- **User override:** Reactive correction - users can cancel agent summon and rephrase if AI misclassified

### Agent Summoning Mechanics
- **Explanation format:** Both natural language summary + expandable details section (clarity + precision)
- **Context injection:** Pass recent messages only (last ~10 messages) to agent for task context
- **Handoff visualization:** Distinct message type - bordered card with icon, summary, and Proceed/Cancel buttons
- **Post-proceed behavior:** Same card updates to show "Working..." status - user stays in context

### Confirmation and Consent Flows
- **Destructive operations:** Deletes AND modify/update operations require extra confirmation
- **Warning presentation:** Red/warning color + checkbox "I understand this cannot be undone"
- **Auto-approve settings:** No auto-approve - always ask for confirmation (builds good habits, prevents mistakes)
- **Cancel behavior:** AI offers alternatives - "Would you like me to: • Explain how to do this manually • Suggest a different approach • Continue chatting"

### Tangible Actions (Claude Cowork Experience)
- **Agent capabilities:** Full action-taking ability:
  - File system operations (create, read, modify, delete files/directories)
  - API and web requests (HTTP calls, webhooks, data fetching)
  - Terminal/command execution (shell commands, scripts, build tools)
  - Database operations (query, insert, update, delete records)
- **Safety boundaries:** Confirmation for risky operations only - agents have broad agency with guardrails for destructive actions
- **Progress communication:** Real-time activity stream - show each action as it happens ("Created file.txt", "Running npm install", "Queried database")
- **Mid-execution control:** Pause + Resume capability - user can pause, review progress, optionally give new instructions, then resume or stop

### Claude's Discretion
- Context memory storage and retrieval mechanism
- Domain adaptation implementation details
- Exact message count for "recent messages" context
- Specific visual styling of confirmation cards
- Error handling and retry logic for failed agent actions

</decisions>

<specifics>
## Specific Ideas

- "I want this to have a 'Claude Cowork' experience whereby the subagent can do tangible actions on behalf of the user"
- The orchestration should feel collaborative and action-oriented, not just explanatory
- Transparency builds trust - users see what agents are doing in real-time

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 02-ai-orchestration-intent-detection*
*Context gathered: 2026-02-11*
