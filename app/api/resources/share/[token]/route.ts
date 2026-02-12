import { db } from '@/lib/db';
import { resource, resourceShare } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  const shareToken = params.token;

  try {
    // Fetch share record with resource (join query)
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
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      );
    }

    const { share, resource: resourceData } = shareRecord;

    // Check expiration
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Share link has expired' },
        { status: 410 } // Gone
      );
    }

    // Check access limit
    if (share.maxAccesses && share.accessCount >= share.maxAccesses) {
      return NextResponse.json(
        { error: 'Share link access limit reached' },
        { status: 429 } // Too Many Requests
      );
    }

    // Increment access count
    await db
      .update(resourceShare)
      .set({
        accessCount: sql`${resourceShare.accessCount} + 1`,
      })
      .where(eq(resourceShare.id, share.id));

    // Return resource (without exposing userId for privacy)
    return NextResponse.json({
      resource: {
        id: resourceData.id,
        name: resourceData.name,
        description: resourceData.description,
        resourceType: resourceData.resourceType,
        content: resourceData.content,
        createdAt: resourceData.createdAt,
        forkCount: resourceData.forkCount,
        executionCount: resourceData.executionCount,
        // Note: userId not exposed for privacy
      },
    });
  } catch (error) {
    console.error('Share access error:', error);
    return NextResponse.json(
      { error: 'Failed to access shared resource' },
      { status: 500 }
    );
  }
}
