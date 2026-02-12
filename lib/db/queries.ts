import { db } from './index';
import { user, conversation, message, conversationContext, resource, Conversation } from './schema';
import { eq, desc, and, or, ilike } from 'drizzle-orm';
import { hash } from 'bcrypt-ts';

/**
 * Fetch user by email with password hash for authentication
 * @param email - User's email address
 * @returns User object including password hash, or undefined if not found
 */
export async function getUserByEmail(email: string) {
  const users = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  return users[0];
}

/**
 * Fetch user by ID for session management
 * @param id - User's UUID
 * @returns User object without password, or undefined if not found
 */
export async function getUserById(id: string) {
  const users = await db
    .select({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);

  return users[0];
}

/**
 * Create new user with bcrypt-hashed password
 * @param email - User's email address
 * @param password - Plain text password (will be hashed)
 * @returns Created user object without password
 */
export async function createUser(email: string, password: string) {
  const hashedPassword = await hash(password, 10);

  const newUsers = await db
    .insert(user)
    .values({
      email,
      password: hashedPassword,
    })
    .returning({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    });

  return newUsers[0];
}

/**
 * Create a new conversation for a user
 * @param userId - User's UUID
 * @param title - Conversation title
 * @returns Created conversation object
 */
export async function createConversation(userId: string, title: string) {
  const newConversations = await db
    .insert(conversation)
    .values({
      userId,
      title,
    })
    .returning();

  return newConversations[0];
}

/**
 * Fetch conversation by ID with user ownership check
 * @param id - Conversation UUID
 * @param userId - User's UUID (for ownership verification)
 * @returns Conversation object or undefined if not found/not owned
 */
export async function getConversation(id: string, userId: string) {
  const conversations = await db
    .select()
    .from(conversation)
    .where(eq(conversation.id, id))
    .limit(1);

  const conv = conversations[0];

  // Verify ownership
  if (!conv || conv.userId !== userId) {
    return undefined;
  }

  return conv;
}

/**
 * Fetch all messages for a conversation
 * @param conversationId - Conversation UUID
 * @returns Array of messages ordered by creation time
 */
export async function getConversationMessages(conversationId: string) {
  return await db
    .select()
    .from(message)
    .where(eq(message.conversationId, conversationId))
    .orderBy(message.createdAt);
}

/**
 * Create a new message in a conversation
 * @param conversationId - Conversation UUID
 * @param role - Message role (user or assistant)
 * @param content - Message content
 * @param messageType - Optional message type (text, agent_request, agent_progress, agent_result)
 * @param metadata - Optional metadata (JSON object for agent requests)
 * @returns Created message object
 */
export async function createMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  messageType?: 'text' | 'agent_request' | 'agent_progress' | 'agent_result',
  metadata?: any
) {
  const newMessages = await db
    .insert(message)
    .values({
      conversationId,
      role,
      content,
      messageType: messageType || 'text',
      metadata: metadata || null,
    })
    .returning();

  return newMessages[0];
}

/**
 * Generate a conversation title from the first message
 * Truncates to 50 characters if longer
 * @param firstMessage - The first user message
 * @returns Generated title
 */
export function generateConversationTitle(firstMessage: string): string {
  const cleaned = firstMessage.trim();
  if (cleaned.length <= 50) {
    return cleaned;
  }
  return cleaned.substring(0, 47) + '...';
}

/**
 * Update conversation title
 * @param conversationId - Conversation UUID
 * @param title - New title
 * @returns Updated conversation object
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
) {
  const updated = await db
    .update(conversation)
    .set({ title })
    .where(eq(conversation.id, conversationId))
    .returning();

  return updated[0];
}

/**
 * Fetch all conversations for a user
 * Ordered by pinned status (pinned first), then by creation date (newest first)
 * @param userId - User's UUID
 * @returns Array of conversations ordered by pinned DESC, createdAt DESC
 */
export async function getUserConversations(userId: string) {
  return await db
    .select()
    .from(conversation)
    .where(eq(conversation.userId, userId))
    .orderBy(desc(conversation.pinned), desc(conversation.createdAt));
}

/**
 * Search conversations by title or message content
 * @param userId - User's UUID
 * @param query - Search query string
 * @returns Array of matching conversations with pinned first
 */
export async function searchConversations(userId: string, query: string) {
  // If query is empty, return all conversations
  if (!query.trim()) {
    return getUserConversations(userId);
  }

  // Search in conversation titles
  const conversationsWithMessages = await db
    .select({
      conversation: conversation,
    })
    .from(conversation)
    .where(
      and(
        eq(conversation.userId, userId),
        ilike(conversation.title, `%${query}%`)
      )
    )
    .orderBy(desc(conversation.pinned), desc(conversation.createdAt));

  // Also search in message content
  const conversationsFromMessages = await db
    .selectDistinct({
      conversation: conversation,
    })
    .from(message)
    .innerJoin(conversation, eq(message.conversationId, conversation.id))
    .where(
      and(
        eq(conversation.userId, userId),
        ilike(message.content, `%${query}%`)
      )
    )
    .orderBy(desc(conversation.pinned), desc(conversation.createdAt));

  // Combine and deduplicate results
  const allResults = [
    ...conversationsWithMessages.map((r) => r.conversation),
    ...conversationsFromMessages.map((r) => r.conversation),
  ];

  // Deduplicate by conversation ID
  const uniqueResults = Array.from(
    new Map(allResults.map((conv) => [conv.id, conv])).values()
  );

  // Re-sort by pinned and createdAt
  return uniqueResults.sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Update conversation properties with user ownership check
 * @param id - Conversation UUID
 * @param userId - User's UUID (for ownership verification)
 * @param data - Partial conversation data to update
 * @returns Updated conversation object or undefined if not found/not owned
 */
export async function updateConversation(
  id: string,
  userId: string,
  data: Partial<Conversation>
) {
  const updated = await db
    .update(conversation)
    .set(data)
    .where(and(eq(conversation.id, id), eq(conversation.userId, userId)))
    .returning();

  return updated[0];
}

/**
 * Delete conversation by ID with user ownership check
 * Messages cascade delete automatically via foreign key constraint
 * @param id - Conversation UUID
 * @param userId - User's UUID (for ownership verification)
 * @returns Deleted conversation object or undefined if not found/not owned
 */
export async function deleteConversationById(id: string, userId: string) {
  const deleted = await db
    .delete(conversation)
    .where(and(eq(conversation.id, id), eq(conversation.userId, userId)))
    .returning();

  return deleted[0];
}

/**
 * Toggle conversation pinned status with user ownership check
 * @param id - Conversation UUID
 * @param userId - User's UUID (for ownership verification)
 * @param pinned - New pinned status
 * @returns Updated conversation object or undefined if not found/not owned
 */
export async function pinConversation(
  id: string,
  userId: string,
  pinned: boolean
) {
  const updated = await db
    .update(conversation)
    .set({ pinned })
    .where(and(eq(conversation.id, id), eq(conversation.userId, userId)))
    .returning();

  return updated[0];
}

/**
 * Store or update conversation context for cross-session memory
 * Uses upsert pattern to update existing context or insert new
 * @param conversationId - Conversation UUID
 * @param contextType - Type of context: 'domain', 'preference', 'project', 'technology'
 * @param contextKey - Unique key for this context (e.g., 'uses_kubernetes', 'prefers_typescript')
 * @param contextValue - Flexible JSONB value for context data
 * @returns Stored context object
 */
export async function storeContext(
  conversationId: string,
  contextType: string,
  contextKey: string,
  contextValue: any
) {
  const stored = await db
    .insert(conversationContext)
    .values({
      conversationId,
      contextType,
      contextKey,
      contextValue,
    })
    .onConflictDoUpdate({
      target: [conversationContext.conversationId, conversationContext.contextKey],
      set: {
        contextValue,
        updatedAt: new Date(),
      },
    })
    .returning();

  return stored[0];
}

/**
 * Retrieve all context for a conversation
 * Ordered by most recently updated first for relevance
 * @param conversationId - Conversation UUID
 * @returns Array of context objects ordered by updatedAt DESC
 */
export async function retrieveContext(conversationId: string) {
  return await db
    .select()
    .from(conversationContext)
    .where(eq(conversationContext.conversationId, conversationId))
    .orderBy(desc(conversationContext.updatedAt));
}

/**
 * Retrieve context filtered by type
 * Useful for loading only specific context types (e.g., domain vs preferences)
 * @param conversationId - Conversation UUID
 * @param contextType - Filter by context type
 * @returns Array of context objects of specified type, ordered by updatedAt DESC
 */
export async function retrieveContextByType(
  conversationId: string,
  contextType: string
) {
  return await db
    .select()
    .from(conversationContext)
    .where(
      and(
        eq(conversationContext.conversationId, conversationId),
        eq(conversationContext.contextType, contextType)
      )
    )
    .orderBy(desc(conversationContext.updatedAt));
}

/**
 * Format conversation context for system prompt injection
 * Converts context entries into readable text format for AI awareness
 * @param conversationId - Conversation UUID
 * @returns Formatted context string ready for prompt injection
 */
export async function formatContextForPrompt(conversationId: string): Promise<string> {
  const contexts = await retrieveContext(conversationId);

  if (contexts.length === 0) {
    return '';
  }

  const grouped = contexts.reduce((acc, ctx) => {
    if (!acc[ctx.contextType]) acc[ctx.contextType] = [];
    acc[ctx.contextType].push(`${ctx.contextKey}: ${JSON.stringify(ctx.contextValue)}`);
    return acc;
  }, {} as Record<string, string[]>);

  const sections = Object.entries(grouped).map(
    ([type, items]) => `${type.toUpperCase()}:\n${items.join('\n')}`
  );

  return `\n\nUSER CONTEXT:\n${sections.join('\n\n')}`;
}

/**
 * Create a new resource (workflow, prompt, or agent config)
 * @param input - Resource data including userId, name, description, resourceType, content
 * @returns Created resource object
 */
export async function createResource(input: {
  userId: string;
  name: string;
  description?: string;
  resourceType: 'workflow' | 'prompt' | 'agent_config';
  content: any;
}) {
  // Validate name length
  if (input.name.length < 1 || input.name.length > 255) {
    throw new Error('Resource name must be between 1 and 255 characters');
  }

  const newResources = await db
    .insert(resource)
    .values({
      userId: input.userId,
      name: input.name,
      description: input.description || null,
      resourceType: input.resourceType,
      content: input.content,
    })
    .returning();

  return newResources[0];
}

/**
 * Get all resources for a user with optional filters
 * @param userId - User's UUID
 * @param filters - Optional search and resourceType filters
 * @returns Array of resources ordered by updatedAt DESC
 */
export async function getUserResources(
  userId: string,
  filters?: { search?: string; resourceType?: 'workflow' | 'prompt' | 'agent_config' }
) {
  let query = db
    .select()
    .from(resource)
    .where(eq(resource.userId, userId));

  // Apply search filter if provided
  if (filters?.search) {
    const searchPattern = `%${filters.search}%`;
    query = query.where(
      and(
        eq(resource.userId, userId),
        or(
          ilike(resource.name, searchPattern),
          ilike(resource.description, searchPattern)
        )
      )
    ) as any;
  }

  // Apply resourceType filter if provided
  if (filters?.resourceType) {
    query = query.where(
      and(
        eq(resource.userId, userId),
        eq(resource.resourceType, filters.resourceType)
      )
    ) as any;
  }

  return await query.orderBy(desc(resource.updatedAt));
}

/**
 * Get a single resource by ID with user ownership check
 * @param resourceId - Resource UUID
 * @param userId - User's UUID (for ownership verification)
 * @returns Resource object or undefined if not found/not owned
 */
export async function getResourceById(resourceId: string, userId: string) {
  const resources = await db
    .select()
    .from(resource)
    .where(and(eq(resource.id, resourceId), eq(resource.userId, userId)))
    .limit(1);

  return resources[0];
}

/**
 * Update a resource with user ownership check
 * @param resourceId - Resource UUID
 * @param userId - User's UUID (for ownership verification)
 * @param updates - Partial resource data to update
 * @returns Updated resource object or undefined if not found/not owned
 */
export async function updateResource(
  resourceId: string,
  userId: string,
  updates: { name?: string; description?: string; content?: any }
) {
  // Validate name length if provided
  if (updates.name && (updates.name.length < 1 || updates.name.length > 255)) {
    throw new Error('Resource name must be between 1 and 255 characters');
  }

  const updated = await db
    .update(resource)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(eq(resource.id, resourceId), eq(resource.userId, userId)))
    .returning();

  return updated[0];
}

/**
 * Delete a resource with user ownership check
 * @param resourceId - Resource UUID
 * @param userId - User's UUID (for ownership verification)
 * @returns Object with success status
 */
export async function deleteResource(resourceId: string, userId: string) {
  const deleted = await db
    .delete(resource)
    .where(and(eq(resource.id, resourceId), eq(resource.userId, userId)))
    .returning();

  return { success: deleted.length > 0 };
}
