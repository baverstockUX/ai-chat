# Phase 5: Resources Management & Sharing - Research

**Researched:** 2026-02-12
**Domain:** Resource/template management, file upload, web search integration, sharing mechanisms, workflow versioning
**Confidence:** HIGH

## Summary

Phase 5 introduces a resource management system that allows users to save successful agent workflows as reusable templates, share them with colleagues, and fork shared workflows for customization. Additionally, it adds image upload and web search capabilities to enhance the chat experience with multimodal input and external knowledge retrieval.

The core challenges are: (1) designing a flexible schema to store diverse workflow types, (2) implementing shareable links with appropriate access control, (3) tracking lineage across forked resources, (4) handling file uploads securely in Next.js, and (5) integrating web search results into AI responses.

Next.js 16 provides native file upload handling through FormData API and Server Actions. For image storage, the simplest approach is storing files on the server filesystem with database metadata, deferring to object storage (S3/R2) only when needed. Shareable links use signed/tokenized URLs with row-level access control in PostgreSQL. Fork lineage is tracked via foreign key relationships creating a resource version tree.

Web search integration can use free APIs (DuckDuckGo, SerpAPI free tier) or paid services (Google Custom Search, Brave Search API). Results are formatted as structured data and injected into AI context for response generation.

**Primary recommendation:** Extend database schema with `resource` and `resource_share` tables, use Next.js Server Actions for file uploads with filesystem storage initially, implement signed shareable links with UUID tokens, track forks via parent_resource_id foreign key, integrate DuckDuckGo search API (free) or Brave Search API (paid, better results), and enhance message input to support multimodal content (text + images).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | Server Actions, FormData handling | Already in use, native file upload support via Server Actions |
| Drizzle ORM | 0.45.1 | Database schema and queries | Already in use, supports complex relationships and JSONB |
| PostgreSQL | 3.4.8 | Relational storage for resources | Already in use, excellent for structured data with relationships |
| sharp | (via Next.js) | Image optimization | Built into Next.js, automatic image resizing and format conversion |
| nanoid | 5.1.6 | Generate share tokens | Already in use, cryptographically secure IDs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @upstash/redis | Latest | Rate limiting for share links | Optional - if share abuse becomes an issue |
| fast-glob | 3.3.2 | File system operations | For scanning uploaded files |
| mime-types | 2.1.35 | File type detection | For validating uploaded file types |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Filesystem storage | S3/R2/Cloudflare R2 | Object storage better for scale/CDN, but adds complexity and cost - defer until >10GB files |
| DuckDuckGo API | Google Custom Search API | Google has better results but requires API key and costs money - DuckDuckGo is free |
| UUID share tokens | JWT tokens | JWT carries payload but requires secret management - UUID simpler for read-only shares |
| Parent resource FK | Full version tree table | Dedicated version table enables complex branching, but FK sufficient for linear forks |

**Installation:**
```bash
# Optional dependencies (add as needed)
npm install mime-types fast-glob
npm install @upstash/redis  # Only if rate limiting needed
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── db/
│   ├── schema.ts              # Extend with resource, resource_share tables
│   └── queries.ts             # Add resource CRUD operations
├── uploads/
│   └── images/                # Filesystem storage for uploaded images
│       └── [conversationId]/  # Organize by conversation
└── integrations/
    └── search/
        ├── duckduckgo.ts      # DuckDuckGo search integration
        └── types.ts           # Search result types
app/
├── (chat)/
│   └── actions.ts             # Add resource save/fork/delete actions
└── api/
    ├── resources/
    │   ├── [id]/
    │   │   └── route.ts       # GET resource by ID
    │   └── share/
    │       └── [token]/
    │           └── route.ts   # Public share link handler
    ├── upload/
    │   └── route.ts           # Image upload endpoint
    └── search/
        └── route.ts           # Web search endpoint
components/
├── chat/
│   ├── image-uploader.tsx     # Image upload UI component
│   └── message-input.tsx      # Update to support images
└── resources/
    ├── resource-browser.tsx   # Resource list and search
    ├── resource-card.tsx      # Resource preview card
    ├── resource-save-dialog.tsx  # Save workflow dialog
    └── fork-dialog.tsx        # Fork confirmation dialog
```

### Pattern 1: Database Schema for Resources

**What:** Extend schema to store resources with metadata, sharing tokens, and fork lineage
**When to use:** Foundation for all resource operations

**Example:**
```typescript
// Source: PostgreSQL best practices + fork tracking patterns
import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core';

/**
 * Resource table - stores saved agent workflows as reusable templates
 * Supports forking via parent_resource_id foreign key
 */
export const resource = pgTable('resource', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Resource metadata
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  resourceType: varchar('resource_type', {
    length: 50,
    enum: ['workflow', 'prompt', 'agent_config']
  }).default('workflow').notNull(),

  // Resource content - flexible JSONB for different types
  content: jsonb('content').notNull(), // Stores workflow steps, prompt text, config, etc.

  // Execution metadata
  executionCount: integer('execution_count').default(0).notNull(),
  lastExecutedAt: timestamp('last_executed_at'),

  // Fork tracking
  parentResourceId: uuid('parent_resource_id')
    .references(() => resource.id, { onDelete: 'set null' }),
  forkCount: integer('fork_count').default(0).notNull(),

  // Visibility
  isPublic: boolean('is_public').default(false).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Resource Share table - tracks shareable links with tokens
 * Enables sharing without making resource public
 */
export const resourceShare = pgTable('resource_share', {
  id: uuid('id').defaultRandom().primaryKey(),
  resourceId: uuid('resource_id')
    .notNull()
    .references(() => resource.id, { onDelete: 'cascade' }),

  // Share token for URL
  shareToken: varchar('share_token', { length: 32 }).notNull().unique(),

  // Access control
  expiresAt: timestamp('expires_at'), // Optional expiration
  accessCount: integer('access_count').default(0).notNull(),
  maxAccesses: integer('max_accesses'), // Optional access limit

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Message table extension - add support for images
 */
export const message = pgTable('message', {
  // ... existing fields ...

  // Image attachments - array of image metadata
  attachments: jsonb('attachments'), // [{ type: 'image', url: '/uploads/...', mimeType: 'image/png' }]
});

// Type exports
export type Resource = typeof resource.$inferSelect;
export type NewResource = typeof resource.$inferInsert;
export type ResourceShare = typeof resourceShare.$inferSelect;
export type NewResourceShare = typeof resourceShare.$inferInsert;
```

### Pattern 2: Save Workflow as Resource

**What:** Capture agent execution history and save as reusable resource
**When to use:** After successful agent execution, user clicks "Save as Resource"

**Example:**
```typescript
// Source: Next.js Server Actions + existing pattern from actions.ts
'use server';

import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { resource } from '@/lib/db/schema';
import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';

interface SaveResourceInput {
  conversationId: string;
  messageId: string; // Agent result message
  name: string;
  description?: string;
  resourceType: 'workflow' | 'prompt' | 'agent_config';
}

export async function saveAsResource(input: SaveResourceInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Validate name
  if (input.name.length < 1 || input.name.length > 255) {
    throw new Error('Name must be 1-255 characters');
  }

  // Fetch agent execution history from messages
  const messages = await db
    .select()
    .from(message)
    .where(
      and(
        eq(message.conversationId, input.conversationId),
        or(
          eq(message.messageType, 'agent_request'),
          eq(message.messageType, 'agent_progress'),
          eq(message.messageType, 'agent_result')
        )
      )
    )
    .orderBy(asc(message.createdAt));

  // Extract workflow content from messages
  const workflowContent = {
    request: messages.find(m => m.messageType === 'agent_request')?.content,
    steps: messages
      .filter(m => m.messageType === 'agent_progress')
      .map(m => ({
        timestamp: m.createdAt,
        content: m.content,
        metadata: m.metadata,
      })),
    result: messages.find(m => m.messageType === 'agent_result')?.content,
    metadata: {
      conversationId: input.conversationId,
      messageId: input.messageId,
      capturedAt: new Date().toISOString(),
    },
  };

  // Create resource
  const [newResource] = await db
    .insert(resource)
    .values({
      userId: session.user.id,
      name: input.name,
      description: input.description,
      resourceType: input.resourceType,
      content: workflowContent,
    })
    .returning();

  revalidatePath('/resources');
  return { success: true, resourceId: newResource.id };
}
```

### Pattern 3: Shareable Link Generation

**What:** Create time-limited shareable link with access token
**When to use:** User clicks "Share" on a resource

**Example:**
```typescript
// Source: Secure token generation patterns
'use server';

import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { resource, resourceShare } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

interface CreateShareLinkInput {
  resourceId: string;
  expiresInDays?: number; // Optional expiration
  maxAccesses?: number;   // Optional access limit
}

export async function createShareLink(input: CreateShareLinkInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Verify user owns resource
  const [resourceRecord] = await db
    .select()
    .from(resource)
    .where(
      and(
        eq(resource.id, input.resourceId),
        eq(resource.userId, session.user.id)
      )
    )
    .limit(1);

  if (!resourceRecord) {
    throw new Error('Resource not found or unauthorized');
  }

  // Generate secure token (21 chars = 128 bits of entropy)
  const shareToken = nanoid(21);

  // Calculate expiration
  const expiresAt = input.expiresInDays
    ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  // Create share record
  const [share] = await db
    .insert(resourceShare)
    .values({
      resourceId: input.resourceId,
      shareToken,
      expiresAt,
      maxAccesses: input.maxAccesses,
    })
    .returning();

  // Return shareable URL
  const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/resources/share/${shareToken}`;

  return {
    success: true,
    shareToken,
    shareUrl,
    expiresAt: share.expiresAt,
  };
}
```

### Pattern 4: Fork Resource with Lineage Tracking

**What:** Create independent copy of resource with parent reference
**When to use:** Colleague views shared resource and clicks "Fork"

**Example:**
```typescript
// Source: Version control fork patterns
'use server';

import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { resource } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function forkResource(resourceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Fetch original resource
  const [originalResource] = await db
    .select()
    .from(resource)
    .where(eq(resource.id, resourceId))
    .limit(1);

  if (!originalResource) {
    throw new Error('Resource not found');
  }

  // Create forked resource
  const [forkedResource] = await db
    .insert(resource)
    .values({
      userId: session.user.id,
      name: `${originalResource.name} (Fork)`,
      description: originalResource.description,
      resourceType: originalResource.resourceType,
      content: originalResource.content, // Deep copy
      parentResourceId: originalResource.id, // Track lineage
      isPublic: false, // Forked resources are private by default
    })
    .returning();

  // Increment fork count on original
  await db
    .update(resource)
    .set({
      forkCount: sql`${resource.forkCount} + 1`,
    })
    .where(eq(resource.id, resourceId));

  revalidatePath('/resources');
  return { success: true, resourceId: forkedResource.id };
}
```

### Pattern 5: Image Upload with Server Actions

**What:** Handle image uploads using Next.js FormData and Server Actions
**When to use:** User uploads image in chat interface

**Example:**
```typescript
// Source: Next.js 16 Server Actions FormData handling
'use server';

import { auth } from '@/app/(auth)/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';

interface UploadImageResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export async function uploadImage(formData: FormData): Promise<UploadImageResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const file = formData.get('image') as File;
  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' };
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { success: false, error: 'File too large. Maximum size: 10MB' };
  }

  try {
    // Generate unique filename
    const extension = file.name.split('.').pop();
    const filename = `${nanoid()}.${extension}`;

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'images');
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Return public URL
    const imageUrl = `/uploads/images/${filename}`;

    return { success: true, imageUrl };
  } catch (error) {
    console.error('Image upload error:', error);
    return { success: false, error: 'Failed to upload image' };
  }
}
```

### Pattern 6: Web Search Integration

**What:** Fetch web search results and format for AI consumption
**When to use:** User triggers web search via command or AI detects need for external knowledge

**Example:**
```typescript
// Source: DuckDuckGo Instant Answer API + web scraping patterns
// lib/integrations/search/duckduckgo.ts

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  try {
    // DuckDuckGo Instant Answer API (free, no API key required)
    // Alternative: Use html-to-text scraping of DDG HTML results
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1`
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Parse DuckDuckGo response
    const results: SearchResult[] = [];

    // RelatedTopics contain search results
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics) {
        if (topic.FirstURL && topic.Text) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text,
            url: topic.FirstURL,
            snippet: topic.Text,
            source: 'DuckDuckGo',
          });
        }
      }
    }

    // Abstract contains featured snippet
    if (data.Abstract) {
      results.unshift({
        title: data.Heading || 'Featured Result',
        url: data.AbstractURL || '',
        snippet: data.Abstract,
        source: 'DuckDuckGo',
      });
    }

    return results.slice(0, 5); // Return top 5 results
  } catch (error) {
    console.error('Web search error:', error);
    return [];
  }
}

// Usage in API route
// app/api/search/route.ts
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { query } = await req.json();

  const results = await searchWeb(query);

  // Format results for AI context injection
  const formattedResults = results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.url}`)
    .join('\n\n');

  return Response.json({
    results,
    formatted: formattedResults,
  });
}
```

### Pattern 7: Resource Browser with Search

**What:** UI component for browsing, searching, and filtering resources
**When to use:** User navigates to resources page or opens resource browser dialog

**Example:**
```typescript
// Source: Next.js patterns + existing UI components
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ResourceBrowserProps {
  userId: string;
}

export function ResourceBrowser({ userId }: ResourceBrowserProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

  useEffect(() => {
    fetchResources();
  }, [searchQuery, filterType]);

  const fetchResources = async () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (filterType) params.set('type', filterType);

    const response = await fetch(`/api/resources?${params}`);
    const data = await response.json();
    setResources(data.resources);
  };

  const handleExecute = async (resourceId: string) => {
    // Execute saved workflow
    await fetch(`/api/resources/${resourceId}/execute`, {
      method: 'POST',
    });
  };

  const handleFork = async (resourceId: string) => {
    // Fork resource
    const response = await fetch('/api/resources/fork', {
      method: 'POST',
      body: JSON.stringify({ resourceId }),
    });

    if (response.ok) {
      fetchResources(); // Refresh list
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 border rounded"
        />
        <select
          value={filterType || ''}
          onChange={(e) => setFilterType(e.target.value || null)}
          className="px-3 py-2 border rounded"
        >
          <option value="">All Types</option>
          <option value="workflow">Workflows</option>
          <option value="prompt">Prompts</option>
          <option value="agent_config">Agent Configs</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((resource) => (
          <Card key={resource.id}>
            <CardHeader>
              <CardTitle>{resource.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {resource.description}
              </p>
              <div className="flex gap-2">
                <Button onClick={() => handleExecute(resource.id)}>
                  Execute
                </Button>
                <Button variant="outline" onClick={() => handleFork(resource.id)}>
                  Fork
                </Button>
              </div>
              {resource.parentResourceId && (
                <p className="text-xs text-muted-foreground mt-2">
                  Forked from original
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Storing images in database as base64:** Causes database bloat and poor performance - use filesystem or object storage
- **Exposing internal resource IDs in share URLs:** Security risk - use random share tokens instead
- **Not validating file uploads:** Enables malicious file uploads - always validate type, size, and content
- **Storing full web search results in database:** Waste of storage - cache temporarily in memory or Redis
- **Public resources without rate limiting:** Enables DoS via expensive resource executions - add rate limits
- **Deep forking without cycle detection:** Can create circular references - validate parent chain depth
- **Synchronous file operations:** Blocks event loop - use async fs/promises methods
- **Not cleaning up orphaned files:** Deleted resources leave orphaned images - implement cleanup job

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image optimization | Custom resizing logic | Next.js Image component + sharp | Automatic format conversion, lazy loading, responsive sizes |
| File upload progress | Custom progress tracking | FormData with fetch + ReadableStream | Browser-native progress events, standardized API |
| Share token generation | Custom random strings | nanoid | Cryptographically secure, URL-safe, collision-resistant |
| Search result parsing | Custom HTML scraping | DuckDuckGo API or Brave Search API | Structured JSON response, maintained by provider, legal compliance |
| Access control | Custom permission logic | PostgreSQL row-level security | Database-enforced security, prevents SQL injection bypasses |
| Fork lineage queries | Manual recursive queries | PostgreSQL WITH RECURSIVE | Efficient tree traversal, avoids N+1 queries |

**Key insight:** Resources are essentially versioned templates with metadata. The pattern mirrors Git's commit graph: resources have parents (forks), metadata (name, description), content (workflow steps), and can be shared (like Git remotes). Use database relationships for structure, filesystem for binary data, and tokens for secure sharing. Don't overcomplicate with heavyweight version control systems.

## Common Pitfalls

### Pitfall 1: Resource Name Collisions

**What goes wrong:** User forks resource with same name, causes confusion in resource browser
**Why it happens:** Not automatically appending "(Fork)" or allowing duplicate names
**How to avoid:**
- Append "(Fork)" to forked resource names automatically
- Show parent resource information in UI
- Allow users to rename immediately after forking
**Warning signs:** Users report "can't find my resources", duplicate names in list

### Pitfall 2: Orphaned Share Links

**What goes wrong:** Resource deleted but share link still accessible, returns 404 or exposes deleted data
**Why it happens:** Not cascading deletes to resource_share table
**How to avoid:**
- Use `onDelete: 'cascade'` in foreign key definition
- Return user-friendly message for deleted resources: "This resource is no longer available"
- Log share access attempts for deleted resources (potential abuse detection)
**Warning signs:** 404 errors on previously valid share links, database referential integrity errors

### Pitfall 3: Large Image Files Breaking UI

**What goes wrong:** User uploads 10MB image, chat interface becomes slow or unresponsive
**Why it happens:** Not optimizing images before display, loading full resolution inline
**How to avoid:**
- Validate file size on upload (reject >10MB)
- Use Next.js Image component for automatic optimization
- Generate thumbnails for chat display, link to full resolution
- Lazy load images below the fold
**Warning signs:** Slow page loads, high bandwidth usage, user complaints about sluggish UI

### Pitfall 4: Web Search Results Stale or Blocked

**What goes wrong:** DuckDuckGo returns no results or blocks requests due to rate limiting
**Why it happens:** DuckDuckGo API has usage limits, or user-agent blocking
**How to avoid:**
- Implement exponential backoff retry on rate limit errors
- Cache search results temporarily (5-10 minutes) in memory or Redis
- Add fallback to alternative search provider (Brave Search API)
- Include proper User-Agent header in requests
**Warning signs:** Frequent empty search results, 429 Too Many Requests errors

### Pitfall 5: Fork Explosion Without Limits

**What goes wrong:** User creates hundreds of forks, database fills with duplicate resources
**Why it happens:** No limits on fork depth or count per user
**How to avoid:**
- Limit fork depth to prevent circular references (e.g., max 10 levels)
- Consider soft limit on forks per user (e.g., 100 resources total)
- Implement resource archival for unused forks
**Warning signs:** Database growth, slow queries on resource lineage, user has hundreds of similar resources

### Pitfall 6: Share Link Abuse

**What goes wrong:** Public share link shared on social media, thousands of executions overwhelm system
**Why it happens:** No rate limiting or access tracking on share endpoints
**How to avoid:**
- Implement rate limiting per share token (e.g., 100 requests/hour)
- Track access count in resource_share table
- Add optional max_accesses limit when creating share link
- Disable share link after expiration or max accesses reached
**Warning signs:** Sudden traffic spikes, high API costs, database write saturation

### Pitfall 7: Resource Content Schema Drift

**What goes wrong:** Older resources fail to execute because content structure changed
**Why it happens:** No versioning of resource content schema
**How to avoid:**
- Include schema version in resource content: `{ version: 1, ...data }`
- Write migration logic to upgrade old resource formats
- Validate content structure before execution
- Store original creation timestamp for compatibility decisions
**Warning signs:** Errors executing old resources, "Invalid resource content" errors

## Code Examples

### Complete Resource Save Flow

```typescript
// components/chat/save-resource-dialog.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { saveAsResource } from '@/app/(chat)/actions';

interface SaveResourceDialogProps {
  conversationId: string;
  messageId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveResourceDialog(props: SaveResourceDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveAsResource({
        conversationId: props.conversationId,
        messageId: props.messageId,
        name,
        description,
        resourceType: 'workflow',
      });

      if (result.success) {
        props.onOpenChange(false);
        // Show success toast
      }
    } catch (error) {
      console.error('Failed to save resource:', error);
      // Show error toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Resource</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Workflow"
              className="w-full px-3 py-2 border rounded mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this workflow does..."
              rows={3}
              className="w-full px-3 py-2 border rounded mt-1"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => props.onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name || saving}>
              {saving ? 'Saving...' : 'Save Resource'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Image Upload Component

```typescript
// components/chat/image-uploader.tsx
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { uploadImage } from '@/app/(chat)/actions';

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
}

export function ImageUploader({ onImageUploaded }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const result = await uploadImage(formData);

      if (result.success && result.imageUrl) {
        onImageUploaded(result.imageUrl);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        alert(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose Image
        </Button>
      </div>

      {preview && (
        <div className="space-y-2">
          <img
            src={preview}
            alt="Preview"
            className="max-w-full h-auto max-h-64 rounded border"
          />
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Image'}
          </Button>
        </div>
      )}
    </div>
  );
}
```

### Resource API Route with Access Control

```typescript
// app/api/resources/share/[token]/route.ts
import { db } from '@/lib/db';
import { resource, resourceShare } from '@/lib/db/schema';
import { eq, and, or, gt, isNull } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  const shareToken = params.token;

  try {
    // Fetch share record with resource
    const [shareRecord] = await db
      .select({
        share: resourceShare,
        resource: resource,
      })
      .from(resourceShare)
      .innerJoin(resource, eq(resourceShare.resourceId, resource.id))
      .where(eq(resourceShare.shareToken, shareToken))
      .limit(1);

    if (!shareRecord) {
      return Response.json(
        { error: 'Share link not found' },
        { status: 404 }
      );
    }

    const { share, resource: resourceData } = shareRecord;

    // Check expiration
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return Response.json(
        { error: 'Share link has expired' },
        { status: 410 }
      );
    }

    // Check access limit
    if (share.maxAccesses && share.accessCount >= share.maxAccesses) {
      return Response.json(
        { error: 'Share link access limit reached' },
        { status: 429 }
      );
    }

    // Increment access count
    await db
      .update(resourceShare)
      .set({
        accessCount: sql`${resourceShare.accessCount} + 1`,
      })
      .where(eq(resourceShare.id, share.id));

    // Return resource (without exposing sensitive info)
    return Response.json({
      resource: {
        id: resourceData.id,
        name: resourceData.name,
        description: resourceData.description,
        resourceType: resourceData.resourceType,
        content: resourceData.content,
        createdAt: resourceData.createdAt,
        // Note: userId not exposed for privacy
      },
    });
  } catch (error) {
    console.error('Share access error:', error);
    return Response.json(
      { error: 'Failed to access shared resource' },
      { status: 500 }
    );
  }
}
```

### Web Search Integration in Chat

```typescript
// app/api/search/route.ts
import { auth } from '@/app/(auth)/auth';
import { searchWeb } from '@/lib/integrations/search/duckduckgo';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { query } = await req.json();

  if (!query || query.length < 3) {
    return Response.json(
      { error: 'Query must be at least 3 characters' },
      { status: 400 }
    );
  }

  try {
    const results = await searchWeb(query);

    // Format results for AI context injection
    const contextPrompt = `Web search results for "${query}":\n\n${results
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`)
      .join('\n\n')}`;

    return Response.json({
      results,
      contextPrompt,
    });
  } catch (error) {
    console.error('Search error:', error);
    return Response.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

// Usage in chat API route
// When AI detects search intent or user explicitly requests search:
const searchResponse = await fetch('/api/search', {
  method: 'POST',
  body: JSON.stringify({ query: 'latest Next.js features' }),
});
const { contextPrompt } = await searchResponse.json();

// Inject into AI system prompt
const enhancedMessages = [
  {
    role: 'system',
    content: `${baseSystemPrompt}\n\n${contextPrompt}`,
  },
  ...userMessages,
];
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Base64 in database | Filesystem + CDN URLs | 2010-2015 | Reduced database size, faster queries, better caching |
| JWT for share links | UUID tokens in database | 2020+ | Simpler validation, revocable access, easier auditing |
| Custom file upload | FormData + Server Actions | 2023-2024 (Next.js 13+) | Simplified code, progressive enhancement, better DX |
| Google Search API | DuckDuckGo/Brave alternatives | 2020-2024 | Lower cost, privacy-focused, no API key friction |
| Separate version control system | Database foreign keys for lineage | Ongoing | Simpler for linear forks, adequate for resource use case |
| Redis for all caching | PostgreSQL JSONB first | 2020+ | Fewer dependencies, transactional consistency, good for small-medium scale |

**Deprecated/outdated:**
- **Storing files in database as BLOB/bytea:** Causes database bloat, slow backups - use filesystem or object storage
- **Synchronous fs methods (fs.writeFileSync):** Blocks event loop - use fs/promises
- **Express multer for file uploads:** Next.js Server Actions are simpler and type-safe
- **Custom OAuth for sharing:** Overengineered for read-only resource shares - use simple tokens
- **Manual recursive queries for lineage:** PostgreSQL WITH RECURSIVE is standard and efficient

## Open Questions

1. **Object Storage vs Filesystem**
   - What we know: Filesystem simpler for development, object storage better for production scale
   - What's unclear: At what file count or total size should we migrate to S3/R2?
   - Recommendation: Start with filesystem (< 10GB, < 10k files), defer object storage until proven need. Document migration path.

2. **Search API Choice**
   - What we know: DuckDuckGo is free but limited, Google/Brave have better results but cost money
   - What's unclear: Will free tier be sufficient for expected search volume?
   - Recommendation: Start with DuckDuckGo (zero cost), monitor usage. If results poor or rate limits hit, upgrade to Brave Search API ($5/month for 2000 queries).

3. **Resource Execution Permissions**
   - What we know: Forked resources should run with user's permissions, not original author's
   - What's unclear: Should resources explicitly declare required permissions (filesystem, API access)?
   - Recommendation: Run all resources with same agent permissions. Add explicit permission declaration in Phase 6 if needed.

4. **Image Analysis Depth**
   - What we know: Gemini can analyze images, but not yet using AI SDK vision APIs
   - What's unclear: Should image analysis be automatic or user-triggered?
   - Recommendation: Automatic analysis on upload (user expects AI to "see" images). Include image description in message content.

5. **Resource Visibility Controls**
   - What we know: Resources are private by default, shareable via links
   - What's unclear: Should there be organization-level or team-level resource libraries?
   - Recommendation: Phase 5 is individual user resources only. Team/org libraries are Phase 6+ feature requiring multi-tenancy.

6. **Fork Notification**
   - What we know: Original author might want to know their resource was forked
   - What's unclear: Implement fork notifications or activity feed?
   - Recommendation: No notifications in Phase 5 (adds complexity). Track fork count for analytics, defer notifications to later phase.

## Sources

### Primary (HIGH confidence)
- Next.js 16.1.6 documentation - Server Actions, FormData handling, Image optimization
- PostgreSQL 16 documentation - Foreign keys, CASCADE, JSONB, WITH RECURSIVE queries
- Drizzle ORM 0.45.1 documentation - Schema definition, relationships, queries
- nanoid v5.1.6 documentation - Secure ID generation
- Current codebase - Existing patterns from phases 1-4

### Secondary (MEDIUM confidence)
- DuckDuckGo Instant Answer API documentation - Free search API endpoints
- Brave Search API documentation - Paid alternative with better results
- Sharp documentation (via Next.js) - Image optimization capabilities
- Industry patterns for fork/branch tracking - Git-inspired lineage models

### Tertiary (LOW confidence)
- General resource management patterns - Template libraries, workflow versioning
- File upload security best practices - MIME type validation, size limits
- Web scraping ethics and legality - Terms of service compliance

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Next.js 16, Drizzle, PostgreSQL, nanoid all documented and in use
- Database schema: HIGH - Resource/share/fork pattern is straightforward relational design
- File upload: HIGH - Next.js Server Actions + FormData is official pattern
- Web search: MEDIUM - DuckDuckGo API free but rate limits unclear, may need alternative
- Image analysis: MEDIUM - Gemini has vision but integration with AI SDK needs verification

**Research date:** 2026-02-12
**Valid until:** ~90 days (2026-05-12) - Next.js and database patterns stable, search APIs may change

**Key assumptions:**
1. Filesystem storage adequate for MVP (< 10GB images) - needs monitoring
2. DuckDuckGo API sufficient for initial web search - may need upgrade to Brave
3. Linear fork lineage (parent_resource_id FK) adequate - no complex branching needed yet
4. Share tokens via nanoid sufficiently secure - no JWT overhead required
5. PostgreSQL JSONB flexible enough for different resource content types
6. Image uploads limited to 10MB - reasonable for chat use case, prevents abuse
7. No rate limiting initially - can add later if abuse detected
