import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { ResourceBrowser } from '@/components/resources/resource-browser';

export default async function ResourcesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Resources</h1>
        <p className="text-muted-foreground mt-2">
          Saved workflows and templates you can reuse
        </p>
      </div>

      <ResourceBrowser userId={session.user.id} />
    </div>
  );
}
