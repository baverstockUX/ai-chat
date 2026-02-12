import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { resource } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Fetch and execute resource
  const [resourceData] = await db
    .select()
    .from(resource)
    .where(
      and(
        eq(resource.id, params.id),
        eq(resource.userId, session.user.id)
      )
    )
    .limit(1);

  if (!resourceData) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
  }

  // Increment execution count
  await db
    .update(resource)
    .set({
      executionCount: sql`${resource.executionCount} + 1`,
      lastExecutedAt: new Date(),
    })
    .where(eq(resource.id, params.id));

  return NextResponse.json({
    success: true,
    agentRequest: (resourceData.content as any).request,
  });
}
