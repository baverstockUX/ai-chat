'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createShareLink } from '@/app/(chat)/actions';
import { toast } from 'sonner';
import { Check, Copy } from 'lucide-react';

interface ShareDialogProps {
  resourceId: string;
  resourceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog(props: ShareDialogProps) {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [expiresInDays, setExpiresInDays] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await createShareLink({
        resourceId: props.resourceId,
        expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
      });

      if (result.success && result.shareUrl) {
        setShareUrl(result.shareUrl);
        toast.success('Share link created');
      } else {
        toast.error(result.error || 'Failed to create share link');
      }
    } catch (error) {
      console.error('Share link generation error:', error);
      toast.error('Failed to create share link');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Resource</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create a shareable link for "{props.resourceName}"
          </p>

          {!shareUrl ? (
            <>
              <div>
                <label className="text-sm font-medium">Expires in (days, optional)</label>
                <Input
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  placeholder="Leave empty for no expiration"
                  className="mt-1"
                />
              </div>

              <Button onClick={handleGenerate} disabled={generating} className="w-full">
                {generating ? 'Generating...' : 'Generate Share Link'}
              </Button>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="flex-1" />
                <Button onClick={handleCopy} variant="outline" size="icon">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can view and fork this resource
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
