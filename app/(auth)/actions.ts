'use server';

import { createUser } from '@/lib/db/queries';

export async function registerUser(email: string, password: string) {
  try {
    const user = await createUser(email, password);
    return { success: true, user };
  } catch (error: any) {
    // Check for duplicate email error (PostgreSQL unique constraint violation)
    if (error?.message?.includes('unique') || error?.code === '23505') {
      return { success: false, error: 'Email already exists' };
    }
    console.error('Registration error:', error);
    return { success: false, error: 'An error occurred during registration' };
  }
}
