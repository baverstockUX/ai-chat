# Stack Research

**Domain:** AI chat interface with agent orchestration and workflow automation
**Researched:** 2026-02-10
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Next.js** | 16.1.6 | Full-stack React framework | Industry standard for production React apps. Built-in API routes, Server Components for streaming AI responses, excellent Vercel AI SDK integration, best-in-class developer experience. React 19 support with Server Components is critical for AI streaming patterns. |
| **React** | 19.2.4 | UI library | React 19 adds native async components and improved streaming support, essential for AI chat UIs. Largest ecosystem, best tooling, universal knowledge in enterprise teams. |
| **TypeScript** | 5.9.3 | Type safety | Non-negotiable for enterprise SaaS. Catches errors at compile time, enables better IDE support, documents API contracts. TS 5.9 has improved inference for async patterns critical to AI workflows. |
| **Vercel AI SDK** | 6.0.78 | LLM integration & streaming | Purpose-built for AI chat interfaces. Framework-agnostic but optimized for React/Next.js. Handles streaming, tool calling, structured outputs, multi-provider support (OpenAI, Anthropic, etc). Has built-in React hooks (`useChat`, `useCompletion`) that handle 90% of chat UI complexity. Active development (21.6k stars, updated daily). Keywords explicitly include 'agent', 'agentic', 'tool-calling', 'mcp'. |
| **LangGraph** | 1.1.4 | Agent orchestration | State-of-the-art for building multi-agent workflows. Built by LangChain team specifically for production agent systems. 24.5k stars. Models agents as directed graphs with state management, error recovery, human-in-the-loop patterns. Superior to vanilla LangChain for complex orchestration. |
| **Tailwind CSS** | 4.1.18 | Styling | De facto standard for modern web apps. Tailwind 4 has improved performance, native CSS layer support. Pairs perfectly with shadcn/ui component patterns. Utility-first approach is faster than CSS-in-JS for prototyping. |
| **PostgreSQL** | 17.x (via @vercel/postgres 0.10.0 or postgres.js 3.4.8) | Primary database | Enterprise-grade RDBMS. Native JSON support for storing conversation threads, pgvector extension for embeddings/RAG. Mature ecosystem, excellent hosting options (Vercel, Supabase, Neon). Use @vercel/postgres for edge runtime compatibility or postgres.js for full-featured Node.js environments. |

### AI & Agent Orchestration

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@langchain/core** | 1.1.20 | LLM abstractions | Use when you need provider-agnostic prompt templates, output parsers, memory abstractions. LangChain Core is lightweight - avoid full `langchain` package unless you need 100+ integrations. |
| **@modelcontextprotocol/sdk** | 1.26.0 | MCP server/client | For integrating with MCP servers (like opencode CLI agent). Allows dynamic tool discovery, standardized context sharing. Vercel AI SDK v6+ has native MCP support. Critical for "summoning" external agents pattern. |
| **OpenAI SDK** | 6.21.0 | OpenAI API client | Direct OpenAI integration when not using Vercel AI SDK abstractions. Supports streaming, function calling, structured outputs. |
| **@anthropic-ai/sdk** | 0.74.0 | Anthropic API client | Direct Claude integration. Excellent for long-context tasks (200k tokens). Strong at following complex instructions for orchestration. |
| **Zod** | 4.3.6 | Schema validation | Essential for structured outputs from LLMs, validating tool call parameters, type-safe environment variables. Integrates with Vercel AI SDK's `streamObject` and `generateObject` APIs. |

### State Management & Data Fetching

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Zustand** | 5.0.11 | Client state | Lightweight (1kb), simple API, no boilerplate. Perfect for chat UI state (messages, streaming status, agent execution state). Avoids Redux complexity. Use for client-only ephemeral state. |
| **TanStack Query** | 5.90.20 | Server state & caching | Cache conversation history, manage loading/error states, optimistic updates, automatic background refetching. Industry standard for server state. Better than SWR for complex invalidation patterns. |
| **Drizzle ORM** | 0.45.1 | Type-safe SQL | Modern TypeScript-first ORM. Lighter than Prisma, better type inference, no runtime overhead. Migration system is simpler. Excellent PostgreSQL support including pgvector for embeddings. Preferred over Prisma for greenfield projects in 2025. |

### UI Components & Styling

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **shadcn/ui CLI** | 0.9.5 | Component system | Not a package - copies components into your codebase. Built on Radix UI primitives + Tailwind. Industry standard for modern React apps. Components are customizable since you own the code. Essential for chat UI (Dialog, Popover, ScrollArea, etc). |
| **@radix-ui/react-*** | 1.1.15 | Headless UI primitives | Unstyled, accessible components. Foundation for shadcn/ui. Use directly when you need components not in shadcn collection. |
| **Lucide React** | 0.563.0 | Icons | Modern icon library, tree-shakeable, actively maintained. Superior to react-icons (bundle size) and FontAwesome (licensing). |
| **Framer Motion** | 12.34.0 | Animations | Declarative animations for chat messages appearing, agent state transitions. Smooth UX for streaming responses. Better performance than CSS animations for complex sequences. |
| **react-markdown** | 10.1.0 | Markdown rendering | Render LLM responses with formatting. Supports code blocks (critical for agent outputs), tables, links. Pair with syntax highlighter for code. |

### Real-time & Streaming

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Vercel AI SDK (built-in)** | 6.0.78 | SSE streaming | Primary streaming solution. `useChat` hook handles SSE streams from `/api/chat` routes. No additional libraries needed for LLM streaming. |
| **Socket.io** | 4.8.3 | Bidirectional real-time | For agent execution updates, presence (who's viewing), collaborative features. Use when you need server-to-client push beyond LLM streaming. Fallback mechanisms for corporate firewalls. |
| **PartyKit** | 0.0.115 | Serverless WebSockets | Alternative to Socket.io. Built on Cloudflare Durable Objects. Better for collaborative features (multiplayer cursors, presence). Consider for resource forking/branching features. Still relatively new (0.0.x). |

### Development Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| **pnpm** | 10.29.2 | Package manager | Faster than npm, better disk efficiency, strict by default. Industry standard for monorepos. Next.js supports pnpm out of box. |
| **Vitest** | 4.0.18 | Unit testing | Vite-native test runner. Same config as Vite, faster than Jest, compatible with Jest API. Use for business logic, utility functions, agent orchestration logic. |
| **Playwright** | 1.58.2 | E2E testing | Cross-browser testing. Better than Cypress for modern web apps. Test chat flows, agent execution, real-time updates. |
| **ESLint** | 10.0.0 | Linting | Code quality. ESLint 10 is rewritten in TypeScript, improved performance. Use `@typescript-eslint` for TypeScript rules. |
| **Prettier** | 3.8.1 | Formatting | Code formatting. Zero config. End debates about style. |
| **@t3-oss/env-nextjs** | 0.13.10 | Environment variables | Type-safe env vars with Zod validation. Catches missing vars at build time. Prevents runtime errors from env misconfiguration. |

### Supporting Infrastructure

| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| **Redis** (via @upstash/redis) | 1.36.2 | Caching & sessions | Session storage, rate limiting, caching LLM responses. @upstash/redis is serverless-native, works in edge runtime. Use ioredis 5.9.2 if you need advanced features in Node.js runtime. |
| **Pinecone** | 7.0.0 | Vector database | For RAG (Retrieval Augmented Generation) when chat needs to reference documentation, past conversations, knowledge bases. Managed service, no ops overhead. Alternative: pgvector in Postgres for smaller datasets. |

## Installation

```bash
# Initialize Next.js with TypeScript
pnpm create next-app@latest ai-chat --typescript --tailwind --app --use-pnpm

# Core AI & Agent
pnpm add ai @langchain/core @langchain/langgraph @modelcontextprotocol/sdk zod

# LLM Providers (install as needed)
pnpm add openai @anthropic-ai/sdk

# Database & ORM
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit

# State Management
pnpm add zustand @tanstack/react-query

# UI Components (follow shadcn/ui setup)
pnpm dlx shadcn-ui@latest init
# Then add components as needed:
pnpm dlx shadcn-ui@latest add button dialog scroll-area textarea

# UI Utilities
pnpm add framer-motion lucide-react react-markdown

# Real-time (optional)
pnpm add socket.io socket.io-client
# OR for serverless:
pnpm add partykit partysocket

# Caching
pnpm add @upstash/redis

# Dev dependencies
pnpm add -D @t3-oss/env-nextjs vitest @playwright/test prettier eslint-config-prettier
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Next.js 16** | Remix 2.x | Use Remix if you prefer Vite-based architecture or web standards APIs. Next.js has better AI SDK integration and more enterprise adoption. |
| **Next.js 16** | Astro 5.x | Use Astro for content-heavy sites with islands architecture. Not suitable for real-time chat - lacks streaming SSR patterns. |
| **LangGraph** | LangChain Expression Language (LCEL) | LCEL is simpler for linear chains. Use LangGraph when you need cycles, branching, state persistence, human-in-the-loop. For complex orchestration (your use case), LangGraph is superior. |
| **Vercel AI SDK** | Direct OpenAI SDK + manual streaming | Direct SDK gives more control but requires building streaming infrastructure, UI hooks, error handling. AI SDK handles 90% of boilerplate. Only go direct for very custom requirements. |
| **Drizzle ORM** | Prisma 7.3.0 | Prisma has better docs, larger community. Use if team prefers declarative schema. Drizzle has better TypeScript inference, no generate step, faster. For greenfield in 2025, Drizzle is recommended. |
| **PostgreSQL** | Supabase (Postgres + extras) | Supabase bundles Postgres + Auth + Realtime + Storage. Great all-in-one. Use if you want managed auth and storage. For just chat/DB, raw Postgres is simpler. |
| **Socket.io** | Native WebSockets | Raw WebSockets are lighter but lack reconnection, rooms, namespaces. Socket.io handles edge cases. Use native WebSockets only for simple use cases. |
| **Zustand** | Jotai or Valtio | Jotai (atomic) or Valtio (proxy) are modern alternatives. Zustand has largest adoption, simplest API. Use Jotai if you prefer atomic state, Valtio if you like mutation-based API. |
| **shadcn/ui** | Radix UI Themes | Radix Themes is an opinionated design system from Radix. Faster to start but less customizable. shadcn/ui is preferred because you own the code. |
| **shadcn/ui** | MUI, Chakra UI, Mantine | Avoid component libraries that ship with runtime CSS-in-JS (performance cost). If you need complete design system, Chakra v3 or Mantine are acceptable. shadcn/ui is lighter and more modern. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Create React App** | Unmaintained since 2022. No SSR, no streaming, outdated tooling. | Next.js, Vite + React Router |
| **LangChain full package** | 100+ dependencies, bloated. You only need @langchain/core + LangGraph. | @langchain/core + @langchain/langgraph |
| **Redux** | Too much boilerplate for modern apps. Only needed for extremely large apps with complex state sharing. | Zustand for client state, TanStack Query for server state |
| **Prisma < 5.x** | Older versions had slow generate times, query performance issues. | Prisma 7.3.0+ or Drizzle ORM |
| **Socket.io < 4.x** | v3 had CORS and reconnection issues. | Socket.io 4.8.3+ |
| **react-query < 5.x** | Renamed to TanStack Query, v5 has better TypeScript, smaller bundle. | @tanstack/react-query 5.x |
| **Tailwind CSS < 4.x** | Tailwind 4 has significant performance improvements, native CSS. | Tailwind CSS 4.1.18+ |
| **Styled Components / Emotion** | Runtime CSS-in-JS has performance cost. Tailwind + CSS modules are faster. | Tailwind CSS for utilities, CSS modules for custom styles |
| **Axios** | Unnecessary abstraction over fetch. Fetch is native, well-supported. | Native fetch (built into browsers and Node.js) |
| **Moment.js** | Deprecated, massive bundle size. | date-fns or native Temporal API (stage 3 proposal) |
| **Webpack directly** | Complex configuration. Let Next.js/Vite handle it. | Next.js (webpack under the hood) or Vite |
| **Express < 5.x** | v4 has security issues, missing modern async support. | Express 5.2.1+ or Fastify for APIs |
| **OpenAI API < v4** | Breaking changes, old SDK lacks function calling, streaming improvements. | openai 6.21.0+ |

## Stack Patterns by Variant

**If building MVP/prototype (your use case):**
- Use Next.js App Router + Vercel AI SDK `useChat` hook + mocked data
- Defer PostgreSQL until you validate need for persistence
- Use Zustand for all state (avoid TanStack Query complexity initially)
- Use shadcn/ui components directly without customization
- Deploy to Vercel for zero config

**If building production with scale:**
- Add PostgreSQL + Drizzle ORM from start
- Use TanStack Query for all server state
- Add Redis for rate limiting, session storage
- Implement proper error boundaries, loading states
- Add monitoring (Sentry, Vercel Analytics)
- Use Socket.io for real-time beyond LLM streaming

**If team prefers Vue over React:**
- Vue 3.5.28 + Nuxt 3.x instead of React + Next.js
- Vercel AI SDK supports Vue with `useChat` composable
- Pinia instead of Zustand
- TanStack Query has Vue adapter
- Everything else remains the same

**If building collaborative/multiplayer features:**
- Replace Socket.io with PartyKit (better for presence, CRDT)
- Add Yjs + y-websocket for true collaborative editing
- Consider Liveblocks as all-in-one (presence + storage + sync)

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 16.1.6 | React 19.x | Next.js 16 requires React 19. Do not use React 18. |
| Vercel AI SDK 6.x | Next.js 14+ | Works with 13.4+ but best with 14+ (stable streaming). |
| Drizzle ORM 0.45.1 | PostgreSQL 12+ | Requires Postgres 12+ for JSONB improvements. |
| LangGraph 1.1.4 | @langchain/core 1.1.x | Must use matching major.minor versions. |
| @radix-ui/react-* | React 18+ | Not yet compatible with React 19 Server Components. Use in Client Components only. |
| Tailwind CSS 4.x | PostCSS 8+ | Auto-configured by Next.js. |
| TypeScript 5.9.3 | All modern packages | Required minimum is 5.0+ for most packages. |

## Confidence Assessment

| Category | Confidence | Source |
|----------|------------|--------|
| **Next.js + React** | HIGH | Verified versions from npm registry (2026-02-10). Next.js 16 is latest stable, React 19 is production-ready. |
| **Vercel AI SDK** | HIGH | Verified v6.0.78 from npm (2026-02-10). Actively maintained (21.6k stars, daily updates). Package keywords explicitly include 'agent', 'agentic', 'tool-calling', 'mcp'. |
| **LangGraph for orchestration** | HIGH | Verified v1.1.4 from npm (2026-02-10). Purpose-built for agent workflows (24.5k stars). Recommended by LangChain for production agents. |
| **MCP SDK** | HIGH | Verified v1.26.0 from npm (2026-02-10). Anthropic's official protocol for tool integration. Required for opencode CLI agent pattern. |
| **Drizzle over Prisma** | MEDIUM | Drizzle v0.45.1 verified. Community adoption is strong in 2025 but Prisma still has larger ecosystem. Both are valid choices. |
| **PartyKit maturity** | LOW | Version 0.0.115 indicates pre-1.0. Use Socket.io for production unless you need specific PartyKit features (Cloudflare Durable Objects). |
| **shadcn/ui standard** | HIGH | De facto standard in 2025 React ecosystem. CLI verified at 0.9.5. Used by Vercel, Shadcn examples, AI SDK docs. |

## Sources

- **npm Registry** (2026-02-10) — Direct version verification for all packages
- **GitHub Repositories** (2026-02-10) — Star counts, activity, descriptions for Vercel AI SDK (21.6k stars), LangGraph (24.5k stars), LangChain JS (16.9k stars)
- **Vercel AI SDK Package** — Keywords confirm agent, agentic, tool-calling, MCP support
- **Training Data** — Architecture patterns, best practices for AI chat interfaces (validated against current ecosystem)

---
*Stack research for: AI chat interface with agent orchestration and workflow automation*
*Researched: 2026-02-10*
*Confidence: HIGH for core stack, MEDIUM for some alternatives*
