import { db } from './index';
import { user, conversation, message, Conversation } from './schema';
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
 * @returns Created message object
 */
export async function createMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
) {
  const newMessages = await db
    .insert(message)
    .values({
      conversationId,
      role,
      content,
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
