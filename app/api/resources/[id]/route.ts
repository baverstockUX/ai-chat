import { auth } from '@/app/(auth)/auth';
import { deleteResource, updateResource } from '@/lib/db/queries';
import { NextResponse } from 'next/server';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { name, description } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const updatedResource = await updateResource(params.id, session.user.id, {
      name: name.trim(),
      description: description?.trim() || null,
    });

    return NextResponse.json(updatedResource);
  } catch (error) {
    console.error('Update resource error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update resource' },
      { status: 500 }
    );
  }
}

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
