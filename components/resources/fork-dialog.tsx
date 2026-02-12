'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { forkResource } from '@/app/(chat)/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ForkDialogProps {
  resourceId: string;
  resourceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForkDialog(props: ForkDialogProps) {
  const [forking, setForking] = useState(false);
  const router = useRouter();

  const handleFork = async () => {
    setForking(true);
    try {
      const result = await forkResource(props.resourceId);

      if (result.success) {
        toast.success('Resource forked successfully');
        props.onOpenChange(false);
        router.push('/resources');
        router.refresh();
      }
    } catch (error) {
      console.error('Fork error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fork resource');
    } finally {
      setForking(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fork Resource</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm">
            Create your own copy of "{props.resourceName}" that you can modify and execute independently.
          </p>
          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="font-semibold mb-1">What happens when you fork:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>A new resource is created in your workspace</li>
              <li>The original resource remains unchanged</li>
              <li>Your fork shows "Forked from original"</li>
              <li>You can modify and execute your copy freely</li>
            </ul>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => props.onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleFork} disabled={forking}>
              {forking ? 'Forking...' : 'Fork Resource'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
