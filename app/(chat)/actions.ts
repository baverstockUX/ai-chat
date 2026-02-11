'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import * as db from '@/lib/db/queries';

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
