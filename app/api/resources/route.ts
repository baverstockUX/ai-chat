import { auth } from '@/app/(auth)/auth';
import { getUserResources } from '@/lib/db/queries';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const resourceType = searchParams.get('type') || undefined;

    const resources = await getUserResources(session.user.id, {
      search,
      resourceType: resourceType as 'workflow' | 'prompt' | 'agent_config' | undefined,
    });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error('Get resources error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}
