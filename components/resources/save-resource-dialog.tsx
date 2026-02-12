'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { saveAsResource } from '@/app/(chat)/actions';
import { toast } from 'sonner';

interface SaveResourceDialogProps {
  conversationId: string;
  messageId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveResourceDialog(props: SaveResourceDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    setSaving(true);
    try {
      const result = await saveAsResource({
        conversationId: props.conversationId,
        messageId: props.messageId,
        name,
        description,
        resourceType: 'workflow',
      });

      if (result.success) {
        toast.success('Resource saved successfully');
        props.onOpenChange(false);
        setName('');
        setDescription('');
      }
    } catch (error) {
      console.error('Failed to save resource:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save resource');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Resource</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Workflow"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this workflow does..."
              rows={3}
              className="mt-1"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => props.onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || saving}>
              {saving ? 'Saving...' : 'Save Resource'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
