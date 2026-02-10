# Architecture Research

**Domain:** AI Chat Interface with Agent Orchestration
**Researched:** 2026-02-10
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Chat UI     │  │  Dynamic     │  │  Resource    │              │
│  │  Component   │  │  View        │  │  Browser     │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                  │                      │
├─────────┴──────────────────┴──────────────────┴──────────────────────┤
│                    STATE MANAGEMENT LAYER                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐        │
│  │           Unified State Store (Pinia/Zustand)           │        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │        │
│  │  │ Messages │  │ Execution│  │ Resources│              │        │
│  │  │  Store   │  │   Store  │  │   Store  │              │        │
│  │  └──────────┘  └──────────┘  └──────────┘              │        │
│  └─────────────────────────────────────────────────────────┘        │
│         │                  │                  │                      │
├─────────┴──────────────────┴──────────────────┴──────────────────────┤
│                    ORCHESTRATION LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐           │
│  │             AI Orchestrator Service                   │           │
│  │  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐ │           │
│  │  │  Intent      │  │  Decision   │  │  Tool Call  │ │           │
│  │  │  Classifier  │  │  Router     │  │  Generator  │ │           │
│  │  └──────────────┘  └─────────────┘  └─────────────┘ │           │
│  └──────────────────────────────────────────────────────┘           │
│         │                                                            │
├─────────┴──────────────────────────────────────────────────────────┤
│                    AGENT EXECUTION LAYER                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐          │
│  │              Agent Executor Service                   │          │
│  │  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐ │          │
│  │  │  CLI Agent   │  │  Stream     │  │  Result     │ │          │
│  │  │  Spawner     │  │  Parser     │  │  Formatter  │ │          │
│  │  └──────────────┘  └─────────────┘  └─────────────┘ │          │
│  └──────────────────────────────────────────────────────┘          │
│         │                                                           │
├─────────┴───────────────────────────────────────────────────────────┤
│                    PERSISTENCE LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Conversation│  │  Resource    │  │  User        │             │
│  │  Repository  │  │  Repository  │  │  Repository  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
├─────────────────────────────────────────────────────────────────────┤
│                    DATA LAYER                                       │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐      │
│  │             Database (SQLite/PostgreSQL)                  │      │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │      │
│  │  │ messages │  │resources │  │  memory  │  │  users   │ │      │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │      │
│  └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Chat UI Component** | Render messages, handle user input, display typing indicators | Vue/React component with virtualized scrolling for large histories |
| **Dynamic View** | Real-time display of agent execution (commands, outputs, file changes) | WebSocket/SSE listener with syntax highlighting |
| **Resource Browser** | List, preview, share saved artifacts (files, code, diagrams) | Tree view component with search/filter/preview |
| **State Store** | Single source of truth for app state, optimistic updates | Pinia (Vue) or Zustand (React) with persistence plugin |
| **AI Orchestrator** | Analyze user intent, decide when to summon agent vs direct response | LLM API wrapper with function calling support |
| **Intent Classifier** | Determine if message requires agent execution | Pattern matching + LLM classification |
| **Decision Router** | Route to agent execution or direct chat response | Rule engine with override mechanisms |
| **Tool Call Generator** | Format agent instructions and context | Template system with context injection |
| **Agent Executor** | Spawn CLI agent process, capture streams, manage lifecycle | Node child_process or Deno subprocess |
| **Stream Parser** | Parse agent output (ANSI codes, tool calls, results) into structured events | Stream transformer with event emitter |
| **Result Formatter** | Convert agent output to UI-friendly format | Markdown renderer with syntax highlighting |
| **Repositories** | Abstract data access with caching and query optimization | Repository pattern with TypeORM/Drizzle/Prisma |
| **Database** | Persist conversations, resources, user context, memory | SQLite (dev/single-user) or PostgreSQL (prod) |

## Recommended Project Structure

```
src/
├── frontend/                    # Presentation layer
│   ├── components/
│   │   ├── chat/               # Chat interface components
│   │   │   ├── MessageList.vue
│   │   │   ├── MessageInput.vue
│   │   │   ├── MessageBubble.vue
│   │   │   └── TypingIndicator.vue
│   │   ├── execution/          # Agent execution views
│   │   │   ├── DynamicView.vue
│   │   │   ├── CommandLog.vue
│   │   │   ├── FileChanges.vue
│   │   │   └── ProgressTracker.vue
│   │   ├── resources/          # Resource management
│   │   │   ├── ResourceBrowser.vue
│   │   │   ├── ResourcePreview.vue
│   │   │   └── ShareDialog.vue
│   │   └── personalization/    # Memory/suggestions
│   │       ├── ContextPanel.vue
│   │       └── SuggestionChips.vue
│   ├── stores/                 # State management
│   │   ├── messages.ts         # Message/conversation state
│   │   ├── execution.ts        # Agent execution state
│   │   ├── resources.ts        # Resource state
│   │   └── user.ts             # User preferences/memory
│   ├── composables/            # Reusable logic (Vue)
│   │   ├── useChat.ts
│   │   ├── useAgentExecution.ts
│   │   └── useWebSocket.ts
│   └── App.vue
│
├── backend/                     # Orchestration + Execution + Persistence
│   ├── orchestrator/           # AI orchestration layer
│   │   ├── intent-classifier.ts
│   │   ├── decision-router.ts
│   │   ├── tool-call-generator.ts
│   │   └── orchestrator.service.ts
│   ├── agent/                  # Agent execution layer
│   │   ├── agent-executor.ts   # Spawn/manage CLI agent
│   │   ├── stream-parser.ts    # Parse output streams
│   │   ├── result-formatter.ts
│   │   └── agent.service.ts
│   ├── repositories/           # Data access layer
│   │   ├── conversation.repository.ts
│   │   ├── resource.repository.ts
│   │   ├── memory.repository.ts
│   │   └── user.repository.ts
│   ├── database/               # Database layer
│   │   ├── schema.ts           # Table definitions
│   │   ├── migrations/
│   │   └── connection.ts
│   ├── api/                    # HTTP/WebSocket endpoints
│   │   ├── routes/
│   │   │   ├── chat.routes.ts
│   │   │   ├── resources.routes.ts
│   │   │   └── ws.routes.ts
│   │   └── server.ts
│   └── services/               # Cross-cutting services
│       ├── llm.service.ts      # LLM API client
│       ├── memory.service.ts   # Context/personalization
│       └── collaboration.service.ts  # Fork/branch logic
│
├── shared/                      # Shared types/utilities
│   ├── types/
│   │   ├── message.types.ts
│   │   ├── agent.types.ts
│   │   └── resource.types.ts
│   └── utils/
│       ├── markdown.ts
│       └── stream.ts
│
└── mocks/                       # Mock data layer
    ├── conversations.mock.ts
    ├── resources.mock.ts
    └── execution-logs.mock.ts
```

### Structure Rationale

- **frontend/**: Single responsibility - presentation only. No business logic. Makes UI swappable.
- **backend/orchestrator/**: Isolated decision-making layer. Can be tested without agent execution.
- **backend/agent/**: Agent-specific logic separate from orchestration. Enables testing with mock agents.
- **repositories/**: Abstract data access. Swap SQLite for PostgreSQL without touching business logic.
- **shared/**: Type safety across frontend/backend. Single source of truth for data contracts.
- **mocks/**: Development without real LLM/agent. Fast iteration on UI/UX.

## Architectural Patterns

### Pattern 1: Command-Query Separation with Optimistic Updates

**What:** Separate read operations (queries) from write operations (commands). Update UI optimistically before server confirmation.

**When to use:** Real-time chat interfaces where latency feels jarring. Users expect instant feedback.

**Trade-offs:**
- **Pro:** Feels instant, great UX
- **Con:** Requires rollback logic if server rejects
- **Con:** Potential for UI/server state divergence

**Example:**
```typescript
// Store with optimistic updates
export const useMessageStore = defineStore('messages', () => {
  const messages = ref<Message[]>([])

  async function sendMessage(content: string) {
    // Optimistic update - add immediately
    const tempId = `temp-${Date.now()}`
    const optimisticMessage = {
      id: tempId,
      content,
      role: 'user',
      timestamp: new Date(),
      status: 'pending'
    }
    messages.value.push(optimisticMessage)

    try {
      // Send to server
      const serverMessage = await api.sendMessage(content)

      // Replace optimistic with server version
      const index = messages.value.findIndex(m => m.id === tempId)
      messages.value[index] = { ...serverMessage, status: 'sent' }
    } catch (error) {
      // Rollback on error
      const index = messages.value.findIndex(m => m.id === tempId)
      messages.value[index].status = 'failed'
    }
  }

  return { messages, sendMessage }
})
```

### Pattern 2: Event-Driven Agent Execution

**What:** Agent execution emits events as work progresses. UI subscribes to event stream and updates in real-time.

**When to use:** Long-running agent tasks where users need progress visibility. Critical for agent orchestration systems.

**Trade-offs:**
- **Pro:** Fine-grained progress updates, users stay informed
- **Pro:** Easy to implement partial results (streaming)
- **Con:** More complex than request/response
- **Con:** Requires event reconciliation if out of order

**Example:**
```typescript
// Agent executor emits typed events
type AgentEvent =
  | { type: 'start', taskId: string }
  | { type: 'tool_call', tool: string, args: any }
  | { type: 'tool_result', result: any }
  | { type: 'file_change', path: string, diff: string }
  | { type: 'complete', result: any }
  | { type: 'error', error: Error }

class AgentExecutor extends EventEmitter<AgentEvent> {
  async execute(task: AgentTask) {
    this.emit({ type: 'start', taskId: task.id })

    const process = spawn('opencode-cli', ['--task', task.description])

    process.stdout.on('data', (data) => {
      const parsed = this.parseAgentOutput(data)
      if (parsed.type === 'tool_call') {
        this.emit({ type: 'tool_call', tool: parsed.tool, args: parsed.args })
      }
    })

    process.on('close', (code) => {
      if (code === 0) {
        this.emit({ type: 'complete', result: this.collectResults() })
      } else {
        this.emit({ type: 'error', error: new Error(`Exit code ${code}`) })
      }
    })
  }
}

// UI component subscribes to events
const executionStore = useExecutionStore()

agentExecutor.on('tool_call', (event) => {
  executionStore.addToolCall(event.tool, event.args)
})

agentExecutor.on('file_change', (event) => {
  executionStore.addFileChange(event.path, event.diff)
})
```

### Pattern 3: Repository Pattern with Caching

**What:** Abstract data access behind repository interfaces. Implement caching at repository level.

**When to use:** When data access patterns are complex or performance-critical. Essential for chat history (can be huge).

**Trade-offs:**
- **Pro:** Swap databases without changing business logic
- **Pro:** Centralized caching logic
- **Con:** Extra abstraction layer
- **Con:** Can become bloated if over-engineered

**Example:**
```typescript
interface ConversationRepository {
  findById(id: string): Promise<Conversation>
  findRecent(userId: string, limit: number): Promise<Conversation[]>
  save(conversation: Conversation): Promise<void>
  addMessage(conversationId: string, message: Message): Promise<void>
}

class CachedConversationRepository implements ConversationRepository {
  private cache = new LRUCache<string, Conversation>({ max: 100 })

  constructor(private db: Database) {}

  async findById(id: string): Promise<Conversation> {
    // Check cache first
    const cached = this.cache.get(id)
    if (cached) return cached

    // Fetch from database
    const conversation = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .get()

    // Cache for next time
    this.cache.set(id, conversation)
    return conversation
  }

  async addMessage(conversationId: string, message: Message) {
    // Invalidate cache
    this.cache.delete(conversationId)

    // Write to database
    await this.db.insert(messages).values({
      conversationId,
      ...message
    })
  }
}
```

### Pattern 4: Intent Router with Fallback Chain

**What:** Multi-stage decision logic for determining if/how to summon agent. Pattern matching → heuristics → LLM classification.

**When to use:** When agent invocation is expensive (time/cost). Want to avoid unnecessary agent calls.

**Trade-offs:**
- **Pro:** Cost-effective, fast for obvious cases
- **Pro:** Graceful degradation if LLM unavailable
- **Con:** Requires maintenance of patterns
- **Con:** Can miss edge cases in early stages

**Example:**
```typescript
class IntentRouter {
  async route(message: string, context: Context): Promise<RoutingDecision> {
    // Stage 1: Pattern matching (instant, free)
    const patternMatch = this.checkPatterns(message)
    if (patternMatch.confidence > 0.9) {
      return patternMatch.decision
    }

    // Stage 2: Heuristics (fast, free)
    const heuristic = this.applyHeuristics(message, context)
    if (heuristic.confidence > 0.85) {
      return heuristic.decision
    }

    // Stage 3: LLM classification (slower, costs)
    const llmDecision = await this.classifyWithLLM(message, context)
    return llmDecision
  }

  private checkPatterns(message: string): { confidence: number, decision: RoutingDecision } {
    // Explicit trigger phrases
    if (message.startsWith('/agent') || message.includes('run a task')) {
      return { confidence: 1.0, decision: { type: 'agent', priority: 'high' } }
    }

    // Simple questions
    if (message.match(/^(what|how|why|when|where) is/i) && message.length < 50) {
      return { confidence: 0.95, decision: { type: 'direct_response' } }
    }

    return { confidence: 0, decision: { type: 'unknown' } }
  }

  private applyHeuristics(message: string, context: Context): { confidence: number, decision: RoutingDecision } {
    let score = 0

    // Code-related keywords suggest agent
    if (/\b(implement|create|build|debug|fix|refactor|test)\b/i.test(message)) {
      score += 0.4
    }

    // File paths suggest agent
    if (/\.(ts|js|vue|py|go)\b/.test(message)) {
      score += 0.3
    }

    // Multi-step language suggests agent
    if (/\b(first|then|next|after|finally)\b/i.test(message)) {
      score += 0.2
    }

    if (score > 0.7) {
      return { confidence: 0.85, decision: { type: 'agent', priority: 'normal' } }
    }

    return { confidence: score, decision: { type: 'unknown' } }
  }
}
```

### Pattern 5: Memory Layer with Context Window Management

**What:** Maintain user context (past conversations, preferences, project state) and inject relevant context into LLM calls. Manage token limits.

**When to use:** Personalization is required. Users expect AI to "remember" previous conversations.

**Trade-offs:**
- **Pro:** Better, more personalized responses
- **Pro:** Users can reference past work
- **Con:** Privacy concerns (what to remember?)
- **Con:** Token management complexity

**Example:**
```typescript
interface MemoryService {
  getRelevantContext(userId: string, currentMessage: string): Promise<Context>
  saveInteraction(userId: string, interaction: Interaction): Promise<void>
}

class VectorMemoryService implements MemoryService {
  constructor(
    private vectorDb: VectorDatabase,
    private conversationRepo: ConversationRepository
  ) {}

  async getRelevantContext(userId: string, currentMessage: string): Promise<Context> {
    // Embed current message
    const embedding = await this.embed(currentMessage)

    // Find similar past interactions (semantic search)
    const similar = await this.vectorDb.search(embedding, {
      userId,
      limit: 5
    })

    // Get recent conversations
    const recent = await this.conversationRepo.findRecent(userId, 3)

    // Build context within token budget
    const context = this.buildContext({
      similar,
      recent,
      maxTokens: 4000  // Leave room for response
    })

    return context
  }

  private buildContext(opts: ContextOptions): Context {
    const context: Context = { entries: [] }
    let tokenCount = 0

    // Prioritize recent over similar
    for (const conv of opts.recent) {
      const tokens = this.estimateTokens(conv)
      if (tokenCount + tokens < opts.maxTokens) {
        context.entries.push({ type: 'recent', data: conv })
        tokenCount += tokens
      }
    }

    // Add similar if space remains
    for (const match of opts.similar) {
      const tokens = this.estimateTokens(match)
      if (tokenCount + tokens < opts.maxTokens) {
        context.entries.push({ type: 'similar', data: match, score: match.score })
        tokenCount += tokens
      } else {
        break  // Out of space
      }
    }

    return context
  }
}
```

## Data Flow

### Request Flow: User Message → Response

```
[User types message]
        ↓
[Frontend: MessageInput component]
        ↓
[Frontend: useMessageStore.sendMessage()]
        ↓ (optimistic update)
[Frontend: Add message to local state]
        ↓ (HTTP POST)
[Backend: POST /api/chat/messages]
        ↓
[Backend: Orchestrator.processMessage()]
        ↓
[Backend: IntentRouter.route(message)]
        ↓
    ┌───┴───┐
    │       │
[Direct] [Agent]
    │       │
    │       └──→ [AgentExecutor.execute()]
    │                   ↓
    │           [Spawn CLI process]
    │                   ↓
    │           [Stream events via WebSocket]
    │                   ↓
    │           [Frontend: ExecutionStore updates]
    │                   ↓
    │           [DynamicView renders progress]
    │                   ↓
    │           [Agent completes]
    │                   ↓
    └───────────────────┤
                        ↓
            [Format response]
                        ↓
            [Save to database]
                        ↓
            [Return to frontend]
                        ↓
        [Frontend: Update message with result]
                        ↓
            [Chat UI renders response]
```

### State Management: Reactive Updates

```
[User action / Server event]
            ↓
    [Pinia/Zustand Action]
            ↓
    [Mutate state tree]
            ↓
    ┌───────┴───────┐
    │               │
[Persist]    [Notify subscribers]
    │               │
    ↓               ↓
[Database]   [UI Components]
    │               │
    │               ↓
    │        [Vue reactivity/React re-render]
    │               ↓
    │        [DOM updates]
    │
    └─→ [Background sync to server]
```

### Agent Execution Flow

```
[Orchestrator decides: summon agent]
            ↓
[Build agent task descriptor]
    {
      type: 'code_task',
      description: 'User request',
      context: 'Relevant memory',
      constraints: 'Rules/permissions'
    }
            ↓
[AgentExecutor.execute(task)]
            ↓
[Spawn opencode-cli subprocess]
            ↓
    ┌───────┴───────┐
    │               │
[stdout]        [stderr]
    │               │
    ↓               ↓
[StreamParser]  [ErrorHandler]
    │               │
    ↓               ↓
[Parse events]  [Log errors]
    │               │
    ├─→ tool_call   │
    ├─→ file_change │
    ├─→ progress    │
    └─→ result      │
            ↓       ↓
    [Emit via WebSocket]
            ↓
[Frontend: ExecutionStore.handleEvent()]
            ↓
    ┌───────┴───────┐
    │               │
[Update UI]    [Update resources]
    │               │
    ↓               ↓
[DynamicView]  [ResourceBrowser]
```

### Key Data Flows

1. **Chat Message Flow:** User input → optimistic UI update → server validation → database persist → WebSocket broadcast (for collaboration) → UI confirmation
2. **Agent Execution Flow:** Orchestrator decision → task construction → subprocess spawn → stream parsing → event emission → UI updates → resource creation
3. **Resource Management Flow:** Agent creates file → ResourceRepository.save() → Database insert → ResourceStore update → ResourceBrowser refresh → Share capability enabled
4. **Memory/Context Flow:** User interaction → MemoryService.saveInteraction() → Vector embedding → Store in vector DB → Future requests → Semantic search → Context injection → Better responses
5. **Collaboration Flow:** User forks conversation → Clone conversation + resources → Create branch reference → Independent state trees → Merge request → Diff visualization → Selective merge

## Build Order & Dependencies

### Phase 1: Core Chat Infrastructure (No Dependencies)
**Why first:** Foundation everything else builds on. Can develop/test UI without backend complexity.

**Components:**
- Frontend chat UI (MessageList, MessageInput, MessageBubble)
- Basic state management (messages store)
- Mock data layer (static responses)
- Database schema + migrations

**Exit criteria:** Can send messages, see history, persist conversations (mocked responses OK)

### Phase 2: AI Orchestrator (Depends: Phase 1)
**Why second:** Decision-making layer. Enables testing routing logic without real agent.

**Components:**
- LLM service integration (Anthropic/OpenAI API)
- Intent classifier (pattern matching + LLM)
- Decision router (route to direct response vs agent)
- Basic memory service (context injection)

**Exit criteria:** Chat responds intelligently, can classify intent, routes correctly (even if agent path is mocked)

### Phase 3: Agent Execution Layer (Depends: Phase 1, 2)
**Why third:** Most complex component. Requires orchestrator to feed it tasks.

**Components:**
- Agent executor (spawn opencode-cli)
- Stream parser (parse agent output)
- WebSocket setup (real-time events)
- Dynamic view UI (execution progress)

**Exit criteria:** Orchestrator can summon agent, agent executes, progress visible in UI, results captured

### Phase 4: Resource Management (Depends: Phase 3)
**Why fourth:** Agents produce resources. Need execution layer working first.

**Components:**
- Resource repository
- Resource browser UI
- Preview components
- Save/load logic

**Exit criteria:** Agent-generated files saved, browsable, previewable, shareable

### Phase 5: Personalization Layer (Depends: Phase 2, 4)
**Why fifth:** Enhancement layer. Requires conversations + resources to personalize.

**Components:**
- Advanced memory service (vector search)
- User preferences
- Context suggestions
- Conversation history search

**Exit criteria:** AI remembers context, offers relevant suggestions, personalizes responses

### Phase 6: Collaboration Features (Depends: All)
**Why last:** Most complex, depends on all other systems working.

**Components:**
- Fork/branch logic
- Merge/diff UI
- Multi-user state sync
- Permissions system

**Exit criteria:** Can fork conversations, work independently, merge changes

### Dependency Graph

```
Phase 1 (Chat Infrastructure)
    ↓
Phase 2 (AI Orchestrator)
    ↓                    ↘
Phase 3 (Agent Execution) → Phase 4 (Resources)
    ↓                           ↓
Phase 5 (Personalization) ←─────┘
    ↓
Phase 6 (Collaboration)
```

**Critical path:** 1 → 2 → 3 (everything else branches from these)

**Parallel opportunities:**
- Phase 4 can start once Phase 3 produces first resource
- Phase 5 can start once Phase 2 has basic memory
- UI components within each phase can be developed in parallel

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-100 users (POC)** | Monolith fine. SQLite sufficient. Single server. WebSocket on same process. Mock collaboration features. |
| **100-1K users** | Separate frontend/backend. Move to PostgreSQL. Add connection pooling. Implement proper WebSocket server (Socket.io). Real auth. |
| **1K-10K users** | Extract agent executor to worker pool (prevent main thread blocking). Add Redis for session storage. Implement rate limiting. CDN for static assets. |
| **10K-100K users** | Microservices: separate orchestrator, executor, persistence. Message queue (RabbitMQ/Redis) between services. Dedicated vector DB (Pinecone/Weaviate) for memory. Scale executors horizontally. Load balancer. |
| **100K+ users** | Full distributed system. Agent execution in isolated containers (Docker/K8s). Separate read/write databases. Caching layer (Redis/Memcached). Horizontal scaling of all services. Multi-region deployment. |

### Scaling Priorities

1. **First bottleneck: Agent execution blocking main thread**
   - Symptom: UI becomes unresponsive during agent tasks
   - Fix: Move agent execution to worker threads/processes
   - When: >100 concurrent users

2. **Second bottleneck: Database connection saturation**
   - Symptom: Queries slow down, connection errors
   - Fix: Connection pooling, read replicas for queries
   - When: >1K active conversations

3. **Third bottleneck: WebSocket connection limits**
   - Symptom: New users can't connect, disconnections
   - Fix: Dedicated WebSocket server, sticky sessions, Redis adapter
   - When: >5K concurrent connections

4. **Fourth bottleneck: Memory/context retrieval latency**
   - Symptom: Slow response times, timeouts
   - Fix: Vector DB, caching layer, pre-compute embeddings
   - When: Large memory stores (>100K interactions per user)

## Anti-Patterns

### Anti-Pattern 1: Orchestrator Directly Manipulating UI State

**What people do:** Orchestrator service directly updates frontend stores or emits UI events

**Why it's wrong:** Tight coupling between backend logic and UI. Makes testing impossible. Violates separation of concerns.

**Do this instead:** Orchestrator returns data/events. API layer translates to HTTP/WebSocket. Frontend stores subscribe and update themselves.

```typescript
// BAD: Orchestrator knows about frontend stores
class Orchestrator {
  async processMessage(message: string) {
    // WRONG: Directly manipulating UI state from backend
    frontendStore.setLoading(true)
    const result = await this.classify(message)
    frontendStore.addMessage(result)
  }
}

// GOOD: Orchestrator returns data, frontend decides what to do
class Orchestrator {
  async processMessage(message: string): Promise<OrchestratorResult> {
    const intent = await this.classify(message)
    const decision = this.route(intent)
    return { intent, decision, timestamp: Date.now() }
  }
}

// Frontend handles its own state
messageStore.sendMessage = async (content: string) => {
  messageStore.setLoading(true)
  try {
    const result = await api.sendMessage(content)
    messageStore.addMessage(result)
  } finally {
    messageStore.setLoading(false)
  }
}
```

### Anti-Pattern 2: Storing Everything in Messages Table

**What people do:** Cram all data (messages, agent execution logs, resources, memory) into one giant `messages` table with JSON blobs

**Why it's wrong:** Query performance degrades. Can't index properly. Hard to implement features like "show all resources" or "search execution logs". Schema becomes unmaintainable.

**Do this instead:** Separate tables for separate concerns. Messages, agent_executions, resources, memory each get their own table. Link with foreign keys.

```typescript
// BAD: Everything in one table
interface Message {
  id: string
  content: string
  metadata: {  // JSON blob = query nightmare
    agent_execution?: {
      logs: string[]
      files_changed: string[]
      resources_created: Resource[]
    }
    memory?: {
      similar_conversations: string[]
    }
  }
}

// GOOD: Normalized schema
interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: Date
}

interface AgentExecution {
  id: string
  message_id: string  // FK to message
  status: 'running' | 'complete' | 'failed'
  started_at: Date
  completed_at?: Date
}

interface ExecutionLog {
  id: string
  execution_id: string  // FK to agent_execution
  timestamp: Date
  level: 'info' | 'error'
  content: string
}

interface Resource {
  id: string
  execution_id: string  // FK to agent_execution
  type: 'file' | 'code' | 'diagram'
  path: string
  content: string
}
```

### Anti-Pattern 3: Polling for Agent Progress

**What people do:** Frontend polls backend every second to check if agent is done: `GET /api/agent/status/:id`

**Why it's wrong:** Wastes resources. Poor UX (updates are jerky, not smooth). Scalability nightmare (100 users = 100 requests/sec).

**Do this instead:** WebSocket/SSE for real-time updates. Agent emits events, frontend receives instantly.

```typescript
// BAD: Polling
async function waitForAgent(taskId: string) {
  while (true) {
    const status = await fetch(`/api/agent/status/${taskId}`)
    if (status.complete) break
    await sleep(1000)  // Poll every second
  }
}

// GOOD: Event-driven
const ws = new WebSocket('/api/agent/stream')

ws.on('message', (event) => {
  if (event.type === 'agent_progress') {
    updateProgressBar(event.progress)
  }
  if (event.type === 'agent_complete') {
    showResult(event.result)
  }
})

// Start agent
await fetch('/api/agent/execute', {
  method: 'POST',
  body: JSON.stringify({ taskId, description })
})

// Progress updates arrive automatically via WebSocket
```

### Anti-Pattern 4: Synchronous Agent Execution

**What people do:** HTTP endpoint that spawns agent and blocks until complete: `POST /api/agent/execute` (waits 30+ seconds for response)

**Why it's wrong:** Ties up server resources. Browser timeout issues. No way to show progress. Can't cancel.

**Do this instead:** Async task pattern. Immediate response with task ID. Stream progress via WebSocket. Query status/results separately.

```typescript
// BAD: Blocking
app.post('/api/agent/execute', async (req, res) => {
  const result = await agentExecutor.execute(req.body)  // Blocks 30+ seconds
  res.json(result)
})

// GOOD: Async with streaming
app.post('/api/agent/execute', async (req, res) => {
  const taskId = generateId()

  // Immediate response
  res.json({ taskId, status: 'started' })

  // Execute in background
  executeAgentTask(taskId, req.body)
})

// Separate endpoint for results
app.get('/api/agent/result/:taskId', async (req, res) => {
  const result = await getTaskResult(req.params.taskId)
  res.json(result)
})

// Real-time progress via WebSocket
io.on('connection', (socket) => {
  socket.on('subscribe_task', (taskId) => {
    agentExecutor.on(`progress:${taskId}`, (event) => {
      socket.emit('agent_progress', event)
    })
  })
})
```

### Anti-Pattern 5: Recreating Context on Every Request

**What people do:** Every message triggers full context rebuild: fetch all conversations, re-embed, re-rank, inject into prompt

**Why it's wrong:** Slow. Expensive (embedding API costs). Doesn't scale. Most context is unchanged between messages.

**Do this instead:** Incremental context updates. Cache embeddings. Only recompute when relevant data changes. Session-based context.

```typescript
// BAD: Full rebuild every time
async function processMessage(userId: string, message: string) {
  // Expensive: fetches + embeds all conversations
  const allConversations = await db.getConversations(userId)
  const embeddings = await Promise.all(
    allConversations.map(c => embedService.embed(c.content))
  )
  const context = buildContext(embeddings)
  return llm.chat(message, context)
}

// GOOD: Cached + incremental
class ContextManager {
  private cache = new Map<string, Context>()

  async getContext(userId: string, message: string): Promise<Context> {
    // Check if we have cached context
    let context = this.cache.get(userId)

    if (!context) {
      // Build initial context (only on first message in session)
      context = await this.buildInitialContext(userId)
      this.cache.set(userId, context)
    }

    // Incremental update: only embed new message
    const messageEmbedding = await this.embedService.embed(message)

    // Find similar from cache (no re-embedding needed)
    const similar = this.findSimilar(context, messageEmbedding)

    // Update context with current message context
    context.current = { message, similar }

    return context
  }

  invalidate(userId: string) {
    // Clear cache when conversation ends or significant change
    this.cache.delete(userId)
  }
}
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **LLM API (Anthropic/OpenAI)** | HTTP client with retry + rate limiting | Use official SDK. Implement exponential backoff. Stream responses for better UX. Budget ~$0.01-0.05/conversation. |
| **Vector Database (Pinecone/Weaviate)** | REST API or native client | Needed for semantic search in memory layer. Can defer until Phase 5. SQLite full-text search OK for POC. |
| **CLI Agent (opencode)** | Subprocess spawn with stream capture | Use `child_process.spawn()` (Node) or `Deno.Command()`. Capture stdout/stderr. Handle SIGTERM for cancellation. |
| **Authentication (if needed)** | OAuth2 or JWT | NextAuth.js (Next.js) or Lucia (agnostic). Can mock for POC. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Frontend ↔ Backend (HTTP)** | REST API, JSON payloads | Use tRPC or GraphQL for type safety. OpenAPI spec for documentation. |
| **Frontend ↔ Backend (Real-time)** | WebSocket or SSE | WebSocket for bi-directional (cancellation, user typing). SSE if one-way (just agent progress). |
| **Orchestrator ↔ Agent Executor** | In-process function calls (monolith) or message queue (distributed) | Start with direct calls. Move to RabbitMQ/Redis when scaling. |
| **Services ↔ Database** | Repository pattern | Abstract with interface. Drizzle ORM recommended (type-safe, lightweight). |
| **Backend ↔ Vector DB** | HTTP/gRPC | Batch operations. Async indexing. Don't block request path. |

## Technology Recommendations

Based on project requirements (Vue frontend, TypeScript, agent orchestration):

### Core Stack
- **Frontend:** Vue 3 + TypeScript + Vite
- **State:** Pinia (official Vue state management)
- **Backend:** Node.js (Fastify or Hono) or Bun
- **Database:** SQLite (POC) → PostgreSQL (production)
- **ORM:** Drizzle (type-safe, lightweight)
- **Real-time:** Socket.io or native WebSocket
- **LLM:** Anthropic Claude API (Sonnet for orchestration, Haiku for classification)

### Why These Choices

**Vue 3:** Specified in requirements. Composition API ideal for complex state.

**Pinia:** Official Vue state management. Better TypeScript support than Vuex. Simpler API.

**Fastify/Hono:** Fast, TypeScript-native. Lower overhead than Express. Hono is even lighter.

**Drizzle:** Best TypeScript ORM experience. Type-safe queries. No runtime overhead. Easier than Prisma for small projects.

**Socket.io:** Battle-tested WebSocket library. Automatic fallback to polling. Room/namespace support for scaling.

**SQLite → PostgreSQL:** SQLite perfect for POC (zero config). PostgreSQL for production (better concurrency, JSON support, full-text search).

**Anthropic Claude:** Best for agentic workflows. Function calling. Long context. Sonnet for complex reasoning, Haiku for fast classification.

## Sources

**Confidence: HIGH** - Based on established patterns from:
- Anthropic documentation on agentic systems (official source)
- Vercel AI SDK architecture patterns (official source)
- LangChain orchestration patterns (widely adopted framework)
- Real-world chat application architectures (ChatGPT, Claude, Cursor)
- Modern web application best practices (2024-2026 state of art)

**Verification:**
- Component boundaries: Standard layered architecture (HIGH confidence)
- Data flow patterns: Event-driven + CQRS are proven patterns (HIGH confidence)
- Scaling considerations: Based on established system design principles (HIGH confidence)
- Build order: Logical dependency analysis (HIGH confidence)
- Anti-patterns: Common mistakes observed in production systems (MEDIUM-HIGH confidence)

---
*Architecture research for: AI Chat Interface with Agent Orchestration*
*Researched: 2026-02-10*
