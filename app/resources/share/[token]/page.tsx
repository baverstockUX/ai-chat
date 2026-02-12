import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';

export default async function SharedResourcePage({
  params,
}: {
  params: { token: string };
}) {
  // Fetch resource from share API
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/resources/share/${params.token}`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    const error = await response.json();
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Share Link Error</h1>
        <p className="text-muted-foreground">{error.error || 'Failed to load resource'}</p>
        <Link href="/login">
          <Button className="mt-4">Go to Login</Button>
        </Link>
      </div>
    );
  }

  const { resource } = await response.json();
  const workflowContent = resource.content as any;

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{resource.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {resource.resourceType} · {resource.forkCount} forks · {resource.executionCount} executions
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">
              {resource.description || 'No description provided'}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Workflow</h3>
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm font-mono">
                {workflowContent.request || 'Workflow details not available'}
              </p>
              {workflowContent.steps && (
                <p className="text-xs text-muted-foreground mt-2">
                  {workflowContent.steps.length} steps
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Link href={`/resources/fork/${resource.id}`}>
            <Button>Fork This Resource</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
