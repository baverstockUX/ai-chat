import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

/**
 * User table - stores user authentication and profile information
 */
export const user = pgTable('user', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 64 }).notNull().unique(),
  password: varchar('password', { length: 64 }), // Nullable for OAuth users
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Conversation table - stores chat conversations belonging to users
 * Each conversation is owned by a single user (user isolation via foreign key)
 */
export const conversation = pgTable('conversation', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  pinned: boolean('pinned').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Message table - stores individual messages within conversations
 * Messages cascade delete when parent conversation is deleted
 * Supports agent orchestration with messageType and metadata fields
 */
export const message = pgTable('message', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversation.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20, enum: ['user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  messageType: varchar('message_type', {
    length: 30,
    enum: ['text', 'agent_request', 'agent_progress', 'agent_result']
  }).default('text').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Conversation Context table - stores cross-session memory for intelligent AI behavior
 * Enables domain adaptation, preference learning, and project context persistence
 * Supports ORCH-06 (Cross-session Context Memory) and ORCH-07 (Domain Adaptation)
 */
export const conversationContext = pgTable('conversation_context', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversation.id, { onDelete: 'cascade' }),
  contextType: varchar('context_type', { length: 50 }).notNull(),
  contextKey: varchar('context_key', { length: 255 }).notNull(),
  contextValue: jsonb('context_value').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports for use in application code
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Conversation = typeof conversation.$inferSelect;
export type NewConversation = typeof conversation.$inferInsert;

export type Message = typeof message.$inferSelect;
export type NewMessage = typeof message.$inferInsert;

export type ConversationContext = typeof conversationContext.$inferSelect;
export type NewConversationContext = typeof conversationContext.$inferInsert;
