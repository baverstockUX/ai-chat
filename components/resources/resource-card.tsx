'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShareDialog } from './share-dialog';
import type { Resource } from '@/lib/db/schema';
import { formatDistance } from 'date-fns';

interface ResourceCardProps {
  resource: Resource;
  onUpdate: () => void;
}

export function ResourceCard({ resource, onUpdate }: ResourceCardProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const handleExecute = async () => {
    // Execute workflow (implement in Phase 5 Plan 5)
    console.log('Execute resource:', resource.id);
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
    </>
  );
}
