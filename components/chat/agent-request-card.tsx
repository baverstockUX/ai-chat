'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Bot, AlertTriangle, Loader2 } from 'lucide-react';

export interface AgentRequestMetadata {
  summary: string;
  actions: string[];
  destructive?: boolean;
  capabilities?: string[];
  context?: Record<string, unknown>;
}

export interface AgentRequestCardProps {
  messageId: string;
  conversationId: string;
  metadata: AgentRequestMetadata;
  onApprove: (messageId: string) => Promise<void>;
  onCancel: (messageId: string) => Promise<void>;
  onCancelExecution?: (messageId: string) => Promise<void>;
  isExecuting?: boolean;
  isCancelling?: boolean;
}

export function AgentRequestCard({
  messageId,
  conversationId,
  metadata,
  onApprove,
  onCancel,
  onCancelExecution,
  isExecuting,
  isCancelling,
}: AgentRequestCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [destructiveConfirmed, setDestructiveConfirmed] = useState(false);

  const isDestructive = metadata.destructive === true;

  const handleProceed = async () => {
    if (isDestructive && !destructiveConfirmed) {
      return;
    }

    setIsProcessing(true);
    try {
      await onApprove(messageId);
      setIsApproved(true);
    } catch (error) {
      console.error('Error approving agent request:', error);
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await onCancel(messageId);
      setIsCancelled(true);
    } catch (error) {
      console.error('Error cancelling agent request:', error);
      setIsProcessing(false);
    }
  };

  const borderColor = isDestructive
    ? 'border-red-500 dark:border-red-500'
    : 'border-blue-500 dark:border-blue-500';

  const proceedButtonVariant = isDestructive ? 'destructive' : 'default';

  // Show status during execution
  if (isApproved || isExecuting) {
    return (
      <Card className={`${borderColor} border-2`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">
                {isCancelling ? 'Cancelling...' : 'Agent working...'}
              </span>
            </div>
            {isExecuting && !isCancelling && onCancelExecution && (
              <Button
                onClick={() => onCancelExecution(messageId)}
                variant="destructive"
                size="sm"
                disabled={isCancelling}
              >
                Cancel Execution
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isCancelled) {
    return (
      <Card className={`${borderColor} border-2`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <Bot className="w-5 h-5" />
            <span className="font-medium">Request cancelled</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${borderColor} border-2`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold">Agent Request</h3>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Natural language summary */}
        <p className="text-base text-gray-900 dark:text-gray-100">
          {metadata.summary}
        </p>

        {/* Expandable details */}
        {metadata.actions && metadata.actions.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
              View details
            </summary>
            <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {metadata.actions.map((action, i) => (
                <li key={i}>• {action}</li>
              ))}
            </ul>
          </details>
        )}

        {/* Destructive warning */}
        {isDestructive && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Warning: This action cannot be undone
                </p>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id={`confirm-${messageId}`}
                    checked={destructiveConfirmed}
                    onCheckedChange={(checked) =>
                      setDestructiveConfirmed(checked === true)
                    }
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={`confirm-${messageId}`}
                    className="text-sm text-red-800 dark:text-red-200 cursor-pointer"
                  >
                    I understand this cannot be undone
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-3">
        <Button
          onClick={handleProceed}
          disabled={
            isProcessing || (isDestructive && !destructiveConfirmed)
          }
          variant={proceedButtonVariant}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Proceed'
          )}
        </Button>
        <Button
          onClick={handleCancel}
          disabled={isProcessing}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}
