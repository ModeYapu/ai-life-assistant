/**
 * AI模型配置 - 2026最新版本
 */

export interface AIModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'zhipu' | 'local';
  version: string;
  contextWindow: number;
  capabilities: string[];
  pricing?: {
    input: number;  // per 1K tokens
    output: number; // per 1K tokens
  };
  codePlan?: boolean; // 是否支持代码规划
}

export const AI_MODELS: AIModelConfig[] = [
  // ============ OpenAI Models ============
  {
    id: 'gpt-5.2-turbo',
    name: 'GPT-5.2 Turbo',
    provider: 'openai',
    version: '2026-02',
    contextWindow: 128000,
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'function_calling'],
    pricing: {
      input: 0.01,
      output: 0.03,
    },
    codePlan: true,
  },
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    provider: 'openai',
    version: '2026-01',
    contextWindow: 200000,
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'function_calling'],
    pricing: {
      input: 0.03,
      output: 0.06,
    },
    codePlan: true,
  },
  {
    id: 'o3-mini',
    name: 'O3 Mini',
    provider: 'openai',
    version: '2026-02',
    contextWindow: 200000,
    capabilities: ['chat', 'code', 'reasoning', 'function_calling'],
    pricing: {
      input: 0.001,
      output: 0.002,
    },
    codePlan: true,
  },

  // ============ Anthropic Models ============
  {
    id: 'claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    version: '2026-02',
    contextWindow: 200000,
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'artifacts'],
    pricing: {
      input: 0.003,
      output: 0.015,
    },
    codePlan: true,
  },
  {
    id: 'claude-3.7-opus',
    name: 'Claude 3.7 Opus',
    provider: 'anthropic',
    version: '2026-01',
    contextWindow: 200000,
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'artifacts'],
    pricing: {
      input: 0.015,
      output: 0.075,
    },
    codePlan: true,
  },

  // ============ Google Models ============
  {
    id: 'gemini-3.0-pro',
    name: 'Gemini 3.0 Pro',
    provider: 'google',
    version: '2026-02',
    contextWindow: 1000000,
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'multimodal'],
    pricing: {
      input: 0.00125,
      output: 0.005,
    },
    codePlan: true,
  },
  {
    id: 'gemini-3.0-ultra',
    name: 'Gemini 3.0 Ultra',
    provider: 'google',
    version: '2026-01',
    contextWindow: 1000000,
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'multimodal'],
    pricing: {
      input: 0.0025,
      output: 0.01,
    },
    codePlan: true,
  },

  // ============ Zhipu AI Models ============
  {
    id: 'glm-5-plus',
    name: 'GLM-5 Plus',
    provider: 'zhipu',
    version: '2026-02',
    contextWindow: 128000,
    capabilities: ['chat', 'code', 'reasoning', 'function_calling'],
    pricing: {
      input: 0.001,
      output: 0.001,
    },
    codePlan: true,
  },
  {
    id: 'glm-5',
    name: 'GLM-5',
    provider: 'zhipu',
    version: '2026-01',
    contextWindow: 128000,
    capabilities: ['chat', 'code', 'reasoning'],
    pricing: {
      input: 0.0005,
      output: 0.0005,
    },
    codePlan: false,
  },

  // ============ Local Models ============
  {
    id: 'qwen-2.5-72b',
    name: 'Qwen 2.5 72B (Local)',
    provider: 'local',
    version: '2026-01',
    contextWindow: 32000,
    capabilities: ['chat', 'code', 'reasoning'],
    codePlan: false,
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3 (Local)',
    provider: 'local',
    version: '2026-01',
    contextWindow: 64000,
    capabilities: ['chat', 'code', 'reasoning'],
    codePlan: true,
  },
];

// 获取支持Code Plan的模型
export const getCodePlanModels = (): AIModelConfig[] => {
  return AI_MODELS.filter(model => model.codePlan);
};

// 根据provider获取模型
export const getModelsByProvider = (provider: string): AIModelConfig[] => {
  return AI_MODELS.filter(model => model.provider === provider);
};

// 获取默认模型
export const getDefaultModel = (): AIModelConfig => {
  return AI_MODELS[0]; // GPT-5.2 Turbo
};

// 获取推荐模型（性价比最高）
export const getRecommendedModel = (): AIModelConfig => {
  return AI_MODELS.find(m => m.id === 'claude-3.7-sonnet') || AI_MODELS[0];
};
