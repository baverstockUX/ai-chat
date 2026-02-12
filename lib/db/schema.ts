import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core';

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
  attachments: jsonb('attachments'),
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

/**
 * Resource table - stores reusable agent workflows, prompts, and agent configurations
 * Enables users to save and share workflows with fork lineage tracking
 * Supports RES-01 through RES-05 (Resource Management and Sharing)
 */
export const resource = pgTable('resource', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  resourceType: varchar('resource_type', {
    length: 50,
    enum: ['workflow', 'prompt', 'agent_config']
  }).default('workflow').notNull(),
  content: jsonb('content').notNull(),
  executionCount: integer('execution_count').default(0).notNull(),
  lastExecutedAt: timestamp('last_executed_at'),
  parentResourceId: uuid('parent_resource_id').references(() => resource.id, { onDelete: 'set null' }),
  forkCount: integer('fork_count').default(0).notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Resource Share table - stores token-based sharing for resources
 * Enables secure sharing via unique tokens with optional expiration and access limits
 * Supports RES-04 (Token-based Sharing)
 */
export const resourceShare = pgTable('resource_share', {
  id: uuid('id').defaultRandom().primaryKey(),
  resourceId: uuid('resource_id')
    .notNull()
    .references(() => resource.id, { onDelete: 'cascade' }),
  shareToken: varchar('share_token', { length: 32 }).notNull().unique(),
  expiresAt: timestamp('expires_at'),
  accessCount: integer('access_count').default(0).notNull(),
  maxAccesses: integer('max_accesses'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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

export type Resource = typeof resource.$inferSelect;
export type NewResource = typeof resource.$inferInsert;

export type ResourceShare = typeof resourceShare.$inferSelect;
export type NewResourceShare = typeof resourceShare.$inferInsert;
