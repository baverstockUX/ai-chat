/**
 * Intent detection result returned by AI
 * Determines whether message should trigger agent summoning or remain conversational
 */
export interface IntentResult {
  intent: 'chat' | 'agent_summon';
  confidence: number;
  // For chat intent
  response?: string;
  offerBuild?: boolean;
  // For agent_summon intent
  summary?: string;
  actions?: string[];
  destructive?: boolean;
  requiresExtraConfirm?: boolean;
}

/**
 * Metadata stored with agent_request messages
 * Provides context for agent execution and UI display
 */
export interface AgentRequestMetadata {
  summary: string;
  actions: string[];
  destructive: boolean;
  requiresExtraConfirm: boolean;
  requestedAt: string;
}

/**
 * Progress update emitted during agent execution
 * Used for real-time visualization in execution timeline
 */
export interface AgentProgressUpdate {
  type: 'text' | 'tool_call' | 'tool_result' | 'complete';
  timestamp: string;
  content: string;
  toolName?: string;
  success?: boolean;
  recovery?: string;
}
