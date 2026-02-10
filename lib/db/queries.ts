import { db } from './index';
import { user } from './schema';
import { eq } from 'drizzle-orm';
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
