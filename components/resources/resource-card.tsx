'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShareDialog } from './share-dialog';
import { ForkDialog } from './fork-dialog';
import { executeResource } from '@/app/(chat)/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { Resource } from '@/lib/db/schema';
import { formatDistance } from 'date-fns';

interface ResourceCardProps {
  resource: Resource;
  onUpdate: () => void;
}

export function ResourceCard({ resource, onUpdate }: ResourceCardProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [forkDialogOpen, setForkDialogOpen] = useState(false);
  const router = useRouter();

  const handleExecute = async () => {
    try {
      const result = await executeResource(resource.id);

      if (result.success && result.agentRequest) {
        // Navigate to chat with execution context
        // Store in localStorage or create new conversation with agent request
        toast.success('Starting workflow execution...');
        router.push('/'); // Navigate to chat

        // TODO: Trigger agent execution with result.agentRequest
        // This will be integrated with existing agent execution infrastructure
      }
    } catch (error) {
      console.error('Failed to execute resource:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to execute resource');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${resource.name}"?`)) return;

    try {
      const response = await fetch(`/api/resources/${resource.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to delete resource:', error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{resource.name}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {resource.resourceType} · {formatDistance(new Date(resource.createdAt), new Date(), { addSuffix: true })}
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {resource.description || 'No description'}
          </p>
          {resource.parentResourceId && (
            <p className="text-xs text-muted-foreground mt-2">
              Forked from original
            </p>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={handleExecute} size="sm">
            Execute
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShareDialogOpen(true)}>
            Share
          </Button>
          {!resource.parentResourceId && (
            <Button variant="outline" size="sm" onClick={() => setForkDialogOpen(true)}>
              Fork
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </CardFooter>
      </Card>

      <ShareDialog
        resourceId={resource.id}
        resourceName={resource.name}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />

      <ForkDialog
        resourceId={resource.id}
        resourceName={resource.name}
        open={forkDialogOpen}
        onOpenChange={setForkDialogOpen}
      />
    </>
  );
}
