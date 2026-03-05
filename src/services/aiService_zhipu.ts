/**
 * Zhipu API helper.
 * Keep this file as a standalone utility so callers can reuse it
 * without coupling to the main AIService class.
 */

import { AIRequest } from '../types';

export interface ZhipuMessageResponse {
  content: string;
  tokens?: number;
  latency?: number;
}

export const sendZhipuMessage = async (
  request: AIRequest,
  apiKey: string
): Promise<ZhipuMessageResponse> => {
  if (!apiKey) {
    throw new Error('Zhipu AI API key not configured');
  }

  const startTime = Date.now();
  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
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
    content: data.choices?.[0]?.message?.content || '',
    tokens: data.usage?.total_tokens,
    latency: Date.now() - startTime,
  };
};
