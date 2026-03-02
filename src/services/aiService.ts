/**
 * AI服务 - 支持多模型切换
 */

import { AIRequest } from '../types';
import { agentConfig, agentKernel, agentObservability } from './agent';
import { AgentStage } from './agent/types';
import { DynamicExtractor } from './webContentService';

export interface AIMessageResponse {
  content: string;
  tokens?: number;
  latency?: number;
  agent?: {
    runId: string;
    mode: 'single' | 'planner' | 'multi-agent';
    stage: AgentStage;
    memoryHits: number;
    toolCalls: number;
    safetyBlocked: boolean;
    webExtractions?: Array<{
      url: string;
      ok: boolean;
      mode?: 'static' | 'dynamic';
      textLength: number;
      finalUrl?: string;
      errorCode?: string;
      message?: string;
    }>;
    toolLoopUsed?: boolean;
    toolCallRaw?: string;
  };
}

class AIService {
  apiKeys: Record<string, string> = {};
  dynamicExtractor?: DynamicExtractor;
  private static readonly E2E_MOCK_TOKEN = '[E2E_MOCK_AI]';

  setApiKey(provider: string, key: string) {
    this.apiKeys[provider] = key;
  }

  setAgentEnabled(enabled: boolean) {
    agentConfig.setEnabled(enabled);
  }

  setAgentStage(stage: AgentStage) {
    agentConfig.setStage(stage);
  }

  getAgentState() {
    const cfg = agentConfig.get();
    const metrics = agentObservability.getMetrics();
    const last = agentObservability.last();
    return {
      enabled: cfg.enabled,
      stage: cfg.stage,
      lastRunId: last?.runId,
      lastMode: last?.mode,
      ...metrics,
    };
  }

  setDynamicExtractor(extractor?: DynamicExtractor) {
    this.dynamicExtractor = extractor;
  }

  async sendMessage(request: AIRequest, options?: { conversationId?: string }): Promise<AIMessageResponse> {
    try {
      const result = await agentKernel.run({
        request,
        conversationId: options?.conversationId,
        dynamicExtractor: this.dynamicExtractor,
        executeModel: async (finalRequest) => this.dispatchToProvider(finalRequest),
      });

      return {
        ...result.response,
        agent: {
          runId: result.trace.runId,
          mode: result.trace.mode,
          stage: result.trace.stage,
          memoryHits: result.trace.memoryHits,
          toolCalls: result.trace.toolCalls,
          safetyBlocked: result.trace.safetyBlocked,
          webExtractions: result.trace.webExtractions,
          toolLoopUsed: result.trace.toolLoopUsed,
          toolCallRaw: result.trace.toolCallRaw,
        },
      };
    } catch (error: any) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  private async dispatchToProvider(request: AIRequest): Promise<AIMessageResponse> {
    const startTime = Date.now();
    if (this.shouldUseE2EMock(request)) {
      return this.buildE2EMockResponse(request, startTime);
    }
    if (request.model.startsWith('gpt') || request.model.startsWith('o3')) {
      return await this.callOpenAI(request, startTime);
    } else if (request.model.startsWith('claude')) {
      return await this.callAnthropic(request, startTime);
    } else if (request.model.startsWith('gemini')) {
      return await this.callGoogle(request, startTime);
    } else if (request.model.startsWith('glm')) {
      return await this.callZhipu(request, startTime);
    } else if (request.model.includes('local')) {
      return await this.callLocalModel(request, startTime);
    }
    throw new Error(`Unsupported model: ${request.model}`);
  }

  private shouldUseE2EMock(request: AIRequest): boolean {
    if (!(typeof __DEV__ !== 'undefined' && __DEV__)) {
      return false;
    }
    return request.messages.some((m) => (m.content || '').includes(AIService.E2E_MOCK_TOKEN));
  }

  private buildE2EMockResponse(request: AIRequest, startTime: number): AIMessageResponse {
    const userText = [...request.messages].reverse().find((m) => m.role === 'user')?.content || '';
    return {
      content: `E2E mock response: ${userText.replace(AIService.E2E_MOCK_TOKEN, '').trim() || 'ok'}`,
      tokens: 16,
      latency: Date.now() - startTime,
    };
  }

  async callOpenAI(request: AIRequest, startTime: number): Promise<AIMessageResponse> {
    const apiKey = this.apiKeys['openai'];
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message || {};
    const content = message.content || message.reasoning_content || '';

    return {
      content,
      tokens: data.usage?.total_tokens,
      latency: Date.now() - startTime,
    };
  }

  async callAnthropic(request: AIRequest, startTime: number): Promise<AIMessageResponse> {
    const apiKey = this.apiKeys['anthropic'];
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: request.maxTokens || 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API error');
    }

    const data = await response.json();

    return {
      content: data.content[0].text,
      tokens: data.usage?.input_tokens + data.usage?.output_tokens,
      latency: Date.now() - startTime,
    };
  }

  async callGoogle(request: AIRequest, startTime: number): Promise<AIMessageResponse> {
    const apiKey = this.apiKeys['google'];
    if (!apiKey) {
      throw new Error('Google API key not configured');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: request.messages.map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : m.role,
            parts: [{ text: m.content }],
          })),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Google API error');
    }

    const data = await response.json();

    return {
      content: data.candidates[0].content.parts[0].text,
      tokens: data.usageMetadata?.totalTokenCount,
      latency: Date.now() - startTime,
    };
  }

  async callZhipu(request: AIRequest, startTime: number): Promise<AIMessageResponse> {
    const apiKey = this.apiKeys['zhipu'];
    if (!apiKey) {
      throw new Error('Zhipu AI API key not configured');
    }

    const response = await fetch('https://open.bigmodel.cn/api/coding/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Zhipu AI API error');
    }

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      tokens: data.usage?.total_tokens,
      latency: Date.now() - startTime,
    };
  }

  async callLocalModel(request: AIRequest, startTime: number): Promise<AIMessageResponse> {
    const endpoint = this.apiKeys['local_endpoint'] || 'http://localhost:8000/v1/chat/completions';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 4096,
        }),
      });

      if (!response.ok) {
        throw new Error('Local model API error');
      }

      const data = await response.json();

      return {
        content: data.choices[0].message.content,
        tokens: data.usage?.total_tokens,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      throw new Error('Failed to connect to local model. Please ensure the model server is running.');
    }
  }

  // 流式响应（高级功能）
  async *streamMessage(request: AIRequest): AsyncGenerator<string> {
    // 实现流式响应
    // 这里简化处理，实际需要使用SSE或WebSocket
    const response = await this.sendMessage(request);
    yield response.content;
  }
}

export const aiService = new AIService();
