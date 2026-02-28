/**
 * AI服务 - 支持多模型切换
 */

import { AIRequest, ApiResponse } from '../types';

interface AIMessageResponse {
  content: string;
  tokens?: number;
  latency?: number;
}

class AIService {
  private apiKeys: Record<string, string> = {};
  
  setApiKey(provider: string, key: string) {
    this.apiKeys[provider] = key;
  }

  async sendMessage(request: AIRequest): Promise<AIMessageResponse> {
    const startTime = Date.now();
    
    try {
      // 根据模型选择不同的API
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
      } else {
        throw new Error(`Unsupported model: ${request.model}`);
      }
    } catch (error: any) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  private async callOpenAI(request: AIRequest, startTime: number): Promise<AIMessageResponse> {
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
    
    return {
      content: data.choices[0].message.content,
      tokens: data.usage?.total_tokens,
      latency: Date.now() - startTime,
    };
  }

  private async callAnthropic(request: AIRequest, startTime: number): Promise<AIMessageResponse> {
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
        messages: request.messages.map(m => ({
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

  private async callGoogle(request: AIRequest, startTime: number): Promise<AIMessageResponse> {
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
          contents: request.messages.map(m => ({
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

  // 流式响应（高级功能）
  async *streamMessage(request: AIRequest): AsyncGenerator<string> {
    // 实现流式响应
    // 这里简化处理，实际需要使用SSE或WebSocket
    const response = await this.sendMessage(request);
    yield response.content;
  }

  // 本地模型（未来扩展）
  async callLocalModel(request: AIRequest): Promise<AIMessageResponse> {
    // 调用本地部署的小模型
    // 可以使用llama.cpp、onnxruntime等
    throw new Error('Local model not implemented yet');
  }
}

export const aiService = new AIService();

  /**
   * 调用智谱AI (GLM-5)
   */
  private async callZhipu(request: AIRequest, startTime: number): Promise<AIMessageResponse> {
    const apiKey = this.apiKeys['zhipu'];
    if (!apiKey) {
      throw new Error('Zhipu AI API key not configured');
    }

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
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

  /**
   * 调用本地模型
   */
  private async callLocalModel(request: AIRequest, startTime: number): Promise<AIMessageResponse> {
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
}
