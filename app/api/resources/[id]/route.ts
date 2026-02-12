import { auth } from '@/app/(auth)/auth';
import { deleteResource } from '@/lib/db/queries';
import { NextResponse } from 'next/server';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await deleteResource(params.id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete resource error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete resource' },
      { status: 500 }
    );
  }
}
