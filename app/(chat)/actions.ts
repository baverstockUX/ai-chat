'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import * as db from '@/lib/db/queries';
import { db as database } from '@/lib/db';
import { resource, resourceShare, message } from '@/lib/db/schema';
import { eq, and, or, asc } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';

/**
 * Create a new conversation and redirect to it
 * @param prompt - Optional initial prompt to auto-send
 * @returns Redirects to new conversation page
 */
export async function createConversation(prompt?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Create conversation with placeholder title
  // Title will be auto-generated from first message in API route
  const conversation = await db.createConversation(
    session.user.id,
    'New Conversation'
  );

  revalidatePath('/');

  if (prompt) {
    // URL encode prompt to handle special characters
    const encodedPrompt = encodeURIComponent(prompt);
    redirect(`/${conversation.id}?prompt=${encodedPrompt}`);
  } else {
    redirect(`/${conversation.id}`);
  }
}

/**
 * Rename an existing conversation
 * @param id - Conversation UUID
 * @param title - New title (1-100 characters)
 * @returns Success indicator
 */
export async function renameConversation(id: string, title: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Validate title length
  if (title.length < 1 || title.length > 100) {
    throw new Error('Title must be 1-100 characters');
  }

  const result = await db.updateConversation(id, session.user.id, { title });

  if (!result) {
    throw new Error('Conversation not found or unauthorized');
  }

  revalidatePath('/');
  return { success: true };
}

/**
 * Delete a conversation and all its messages
 * @param id - Conversation UUID
 * @returns Redirects to home page
 */
export async function deleteConversation(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const result = await db.deleteConversationById(id, session.user.id);

  if (!result) {
    throw new Error('Conversation not found or unauthorized');
  }

  revalidatePath('/');
  redirect('/');
}

/**
 * Toggle conversation pinned status
 * @param id - Conversation UUID
 * @param pinned - New pinned status
 * @returns Success indicator
 */
export async function pinConversation(id: string, pinned: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const result = await db.pinConversation(id, session.user.id, pinned);

  if (!result) {
    throw new Error('Conversation not found or unauthorized');
  }

  revalidatePath('/');
  return { success: true };
}

interface UploadImageResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Upload an image file to the filesystem
 * @param formData - FormData containing image file
 * @returns Upload result with imageUrl or error
 */
export async function uploadImage(formData: FormData): Promise<UploadImageResult> {
  // 1. Auth guard
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Extract file from FormData
  const file = formData.get('image') as File;
  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  // 3. Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' };
  }

  // 4. Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { success: false, error: 'File too large. Maximum size: 10MB' };
  }

  try {
    // 5. Generate unique filename with nanoid
    const extension = file.name.split('.').pop();
    const filename = `${nanoid()}.${extension}`;

    // 6. Create upload directory if doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'images');
    await mkdir(uploadDir, { recursive: true });

    // 7. Convert file to buffer and write to filesystem
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // 8. Return public URL
    const imageUrl = `/uploads/images/${filename}`;
    return { success: true, imageUrl };
  } catch (error) {
    console.error('Image upload error:', error);
    return { success: false, error: 'Failed to upload image' };
  }
}

interface SaveResourceInput {
  conversationId: string;
  messageId: string; // Agent result message
  name: string;
  description?: string;
  resourceType: 'workflow' | 'prompt' | 'agent_config';
}

/**
 * Save agent workflow as a reusable Resource
 * Extracts agent execution history from messages and stores in JSONB content field
 * @param input - Resource metadata and message references
 * @returns Success indicator with resource ID
 */
export async function saveAsResource(input: SaveResourceInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Validate name
  if (input.name.length < 1 || input.name.length > 255) {
    throw new Error('Name must be 1-255 characters');
  }

  // Fetch agent execution history from messages
  const messages = await database
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

  if (messages.length === 0) {
    throw new Error('No agent messages found for this conversation');
  }

  // Extract workflow content from messages
  const workflowContent = {
    version: 1, // Schema version for future migrations
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

  // Create resource using query function
  const newResource = await db.createResource({
    userId: session.user.id,
    name: input.name,
    description: input.description,
    resourceType: input.resourceType,
    content: workflowContent,
  });

  revalidatePath('/resources');
  return { success: true, resourceId: newResource.id };
}

interface CreateShareLinkInput {
  resourceId: string;
  expiresInDays?: number; // Optional expiration (e.g., 7, 30)
  maxAccesses?: number;   // Optional access limit (e.g., 100)
}

interface CreateShareLinkResult {
  success: boolean;
  shareToken?: string;
  shareUrl?: string;
  expiresAt?: Date | null;
  error?: string;
}

/**
 * Create a shareable link for a resource with optional expiration and access limits
 * @param input - Resource ID and optional constraints
 * @returns Share link result with URL or error
 */
export async function createShareLink(input: CreateShareLinkInput): Promise<CreateShareLinkResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify user owns resource
    const [resourceRecord] = await database
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
      return { success: false, error: 'Resource not found or unauthorized' };
    }

    // Generate secure token (21 chars = 128 bits entropy)
    const shareToken = nanoid(21);

    // Calculate expiration
    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Create share record
    const [share] = await database
      .insert(resourceShare)
      .values({
        resourceId: input.resourceId,
        shareToken,
        expiresAt,
        maxAccesses: input.maxAccesses,
      })
      .returning();

    // Return shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/resources/share/${shareToken}`;

    return {
      success: true,
      shareToken,
      shareUrl,
      expiresAt: share.expiresAt,
    };
  } catch (error) {
    console.error('Share link creation error:', error);
    return { success: false, error: 'Failed to create share link' };
  }
}
