import { AIRequest } from '../../types';
import { DynamicExtractor } from '../webContentService';

export type AgentStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type AgentMode = 'single' | 'planner' | 'multi-agent';

export interface AgentConfig {
  enabled: boolean;
  stage: AgentStage;
  maxPlanSteps: number;
  safetyMode: 'normal' | 'strict';
}

export interface AgentRunTrace {
  runId: string;
  startedAt: number;
  endedAt?: number;
  stage: AgentStage;
  mode: AgentMode;
  perception: {
    intent: string;
    complexity: 'low' | 'medium' | 'high';
    entities: string[];
  };
  memoryHits: number;
  planSteps: number;
  toolCalls: number;
  safetyBlocked: boolean;
  webExtractions: Array<{
    url: string;
    ok: boolean;
    mode?: 'static' | 'dynamic';
    textLength: number;
    finalUrl?: string;
    errorCode?: string;
    message?: string;
  }>;
  toolLoopUsed: boolean;
  toolCallRaw?: string;
}

export interface AgentRunResult {
  response: {
    content: string;
    tokens?: number;
    latency?: number;
  };
  trace: AgentRunTrace;
}

export interface AgentExecutionInput {
  request: AIRequest;
  conversationId?: string;
  dynamicExtractor?: DynamicExtractor;
  executeModel: (request: AIRequest) => Promise<{
    content: string;
    tokens?: number;
    latency?: number;
  }>;
}
