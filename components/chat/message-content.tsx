'use client';

import { AgentRequestCard, AgentRequestMetadata } from './agent-request-card';
import { StreamingResponse } from './streaming-response';
import { AgentExecutionView } from './agent-execution-view';
import type { AgentProgressUpdate } from '@/lib/types/agent';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  messageType?: 'text' | 'agent_request' | 'agent_progress' | 'agent_result';
  metadata?: unknown;
}

interface MessageContentProps {
  message: Message;
  conversationId?: string;
  onApprove?: (messageId: string) => Promise<void>;
  onCancel?: (messageId: string) => Promise<void>;
  onCancelExecution?: (messageId: string) => Promise<void>;
  isExecuting?: boolean;
  isCancelling?: boolean;
}

/**
 * Message content renderer that handles different message types
 * - text: Standard markdown/streaming display
 * - agent_request: Agent confirmation card with Proceed/Cancel actions
 * - agent_progress: Progress indicator (future)
 * - agent_result: Result display (future)
 */
export function MessageContent({
  message,
  conversationId,
  onApprove,
  onCancel,
  onCancelExecution,
  isExecuting,
  isCancelling,
}: MessageContentProps) {
  // Handle agent_request messages with confirmation UI
  if (message.messageType === 'agent_request') {
    if (!conversationId || !onApprove || !onCancel) {
      console.warn('Agent request message missing required handlers');
      return (
        <div className="text-sm text-muted-foreground">
          Agent request pending (missing handlers)
        </div>
      );
    }

    return (
      <AgentRequestCard
        messageId={message.id}
        conversationId={conversationId}
        metadata={message.metadata as AgentRequestMetadata}
        onApprove={onApprove}
        onCancel={onCancel}
        onCancelExecution={onCancelExecution}
        isExecuting={isExecuting}
        isCancelling={isCancelling}
      />
    );
  }

  // Handle agent_progress messages with execution view
  if (message.messageType === 'agent_progress') {
    const metadata = message.metadata as { updates?: AgentProgressUpdate[] } | undefined;
    const updates = metadata?.updates || [];

    return <AgentExecutionView updates={updates} isLive={true} />;
  }

  // Handle agent_result messages (future implementation)
  if (message.messageType === 'agent_result') {
    return (
      <div className="text-sm">
        {message.content}
      </div>
    );
  }

  // Default: text message with streaming support
  if (message.role === 'user') {
    return <div className="whitespace-pre-wrap">{message.content}</div>;
  }

  // Assistant text message with markdown/streaming
  return <StreamingResponse content={message.content} />;
}
