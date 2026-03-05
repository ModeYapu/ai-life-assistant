/**
 * AI状态管理
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AIState, AIMessage, AIConversation } from '../../types';
import { aiService } from '../../services/aiService';
import { AgentStage } from '../../services/agent/types';

// 简单的 UUID 生成器（兼容 React Native）
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const initialState: AIState = {
  conversations: [],
  currentConversation: null,
  models: [
    // OpenAI 模型
    {
      id: 'gpt-5.2-turbo',
      name: 'GPT-5.2 Turbo',
      provider: 'openai',
      type: 'chat',
      contextWindow: 200000,
      pricing: { input: 0.015, output: 0.06 },
      capabilities: ['text', 'code', 'analysis', 'vision'],
    },
    {
      id: 'gpt-5.2',
      name: 'GPT-5.2',
      provider: 'openai',
      type: 'chat',
      contextWindow: 200000,
      pricing: { input: 0.03, output: 0.12 },
      capabilities: ['text', 'code', 'analysis', 'vision'],
    },
    {
      id: 'o3-mini',
      name: 'O3 Mini',
      provider: 'openai',
      type: 'chat',
      contextWindow: 200000,
      pricing: { input: 0.001, output: 0.004 },
      capabilities: ['text', 'code', 'reasoning'],
    },
    // Anthropic 模型
    {
      id: 'claude-3.7-sonnet',
      name: 'Claude 3.7 Sonnet',
      provider: 'anthropic',
      type: 'chat',
      contextWindow: 200000,
      pricing: { input: 0.003, output: 0.015 },
      capabilities: ['text', 'code', 'analysis', 'vision'],
    },
    {
      id: 'claude-3.7-opus',
      name: 'Claude 3.7 Opus',
      provider: 'anthropic',
      type: 'chat',
      contextWindow: 200000,
      pricing: { input: 0.015, output: 0.075 },
      capabilities: ['text', 'code', 'analysis', 'vision'],
    },
    // Google 模型
    {
      id: 'gemini-3.0-pro',
      name: 'Gemini 3.0 Pro',
      provider: 'google',
      type: 'chat',
      contextWindow: 1000000,
      pricing: { input: 0.001, output: 0.002 },
      capabilities: ['text', 'code', 'vision'],
    },
    {
      id: 'gemini-3.0-ultra',
      name: 'Gemini 3.0 Ultra',
      provider: 'google',
      type: 'chat',
      contextWindow: 1000000,
      pricing: { input: 0.01, output: 0.03 },
      capabilities: ['text', 'code', 'vision', 'reasoning'],
    },
    // 智谱AI 模型
    {
      id: 'glm-5',
      name: 'GLM-5 (Opus级)',
      provider: 'zhipu',
      type: 'chat',
      contextWindow: 128000,
      pricing: { input: 0.05, output: 0.05 },
      capabilities: ['text', 'code', 'analysis'],
    },
    {
      id: 'glm-4.7',
      name: 'GLM-4.7 (Sonnet级)',
      provider: 'zhipu',
      type: 'chat',
      contextWindow: 128000,
      pricing: { input: 0.001, output: 0.001 },
      capabilities: ['text', 'code'],
    },
    // 本地模型
    {
      id: 'qwen-2.5-72b',
      name: 'Qwen 2.5 72B (本地)',
      provider: 'local',
      type: 'chat',
      contextWindow: 128000,
      pricing: { input: 0, output: 0 },
      capabilities: ['text', 'code'],
    },
    {
      id: 'deepseek-v3',
      name: 'DeepSeek V3 (本地)',
      provider: 'local',
      type: 'chat',
      contextWindow: 64000,
      pricing: { input: 0, output: 0 },
      capabilities: ['text', 'code', 'reasoning'],
    },
  ],
  selectedModel: 'glm-5',
  agent: {
    enabled: true,
    stage: 7,
    totalRuns: 0,
    toolCalls: 0,
    safetyBlocks: 0,
  },
  loading: false,
  error: null,
};

// Async Thunks
export const sendMessage = createAsyncThunk(
  'ai/sendMessage',
  async (
    payload: { conversationId: string; content: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as any;
      const { selectedModel, currentConversation, conversations } = state.ai;

      // 找到当前对话
      const conversation = conversations.find((c: AIConversation) => c.id === payload.conversationId)
        || currentConversation;

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const userMessage: AIMessage = {
        id: generateId(),
        role: 'user',
        content: payload.content,
        timestamp: Date.now(),
      };

      // 构建消息历史（最近10条）
      const recentMessages = conversation.messages
        .slice(-10)
        .map((m: AIMessage) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        }));

      // 调用AI服务
      const response = await aiService.sendMessage(
        {
          model: selectedModel,
          messages: [
            ...recentMessages,
            { role: 'user' as const, content: payload.content }
          ],
        },
        {
          conversationId: payload.conversationId,
        }
      );

      const webExtractions = response.agent?.webExtractions || [];
      const webSummary = webExtractions.length > 0
        ? webExtractions
          .map((item) =>
            item.ok
              ? `OK(${item.mode || 'n/a'},len=${item.textLength})`
              : `FAIL(${item.errorCode || 'UNKNOWN'})`
          )
          .join(' | ')
        : undefined;

      const assistantMessage: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        metadata: {
          model: selectedModel,
          tokens: response.tokens,
          latency: response.latency,
          agentRunId: response.agent?.runId,
          agentMode: response.agent?.mode,
          agentWebExtractionSummary: webSummary,
          agentWebExtractions: webExtractions.map((item) => ({
            url: item.url,
            ok: item.ok,
            mode: item.mode,
            textLength: item.textLength,
            errorCode: item.errorCode,
          })),
          agentToolLoopUsed: response.agent?.toolLoopUsed,
          agentToolCallRaw: response.agent?.toolCallRaw,
        },
      };

      return {
        conversationId: payload.conversationId,
        userMessage,
        assistantMessage,
        agent: response.agent,
      };
    } catch (error: any) {
      console.error('sendMessage error:', error);
      return rejectWithValue(error.message || 'Unknown error');
    }
  }
);

// Slice
const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setCurrentConversation: (state, action: PayloadAction<string | null>) => {
      if (action.payload) {
        state.currentConversation = state.conversations.find(
          c => c.id === action.payload
        ) || null;
      } else {
        state.currentConversation = null;
      }
    },
    setSelectedModel: (state, action: PayloadAction<string>) => {
      state.selectedModel = action.payload;
    },
    setAgentEnabled: (state, action: PayloadAction<boolean>) => {
      state.agent.enabled = action.payload;
      aiService.setAgentEnabled(action.payload);
    },
    setAgentStage: (state, action: PayloadAction<AgentStage>) => {
      state.agent.stage = action.payload;
      aiService.setAgentStage(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
    deleteConversation: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter(
        c => c.id !== action.payload
      );
      if (state.currentConversation?.id === action.payload) {
        state.currentConversation = null;
      }
    },
    createConversation: (state) => {
      const newConversation: AIConversation = {
        id: generateId(),
        title: '新对话',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      state.conversations.unshift(newConversation);
      state.currentConversation = newConversation;
    },
  },
  extraReducers: (builder) => {
    builder
      // 发送消息
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        const { conversationId, userMessage, assistantMessage, agent } = action.payload;

        // 查找或创建对话
        let conversation = state.conversations.find(c => c.id === conversationId);

        if (!conversation) {
          // 如果对话不存在于数组中，但currentConversation匹配，使用它
          if (state.currentConversation?.id === conversationId) {
            conversation = state.currentConversation;
            // 确保添加到数组中
            state.conversations.unshift(conversation);
          }
        }

        if (conversation) {
          conversation.messages.push(userMessage, assistantMessage);
          conversation.updatedAt = Date.now();

          // 自动生成标题（如果是第一条消息）
          if (conversation.messages.length === 2) {
            conversation.title = userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : '');
          }
        }

        // 同步更新 currentConversation
        if (state.currentConversation?.id === conversationId) {
          state.currentConversation = conversation || null;
        }

        if (agent) {
          state.agent.lastRunId = agent.runId;
          state.agent.lastMode = agent.mode;
          state.agent.stage = agent.stage;
          state.agent.totalRuns += 1;
          state.agent.toolCalls += agent.toolCalls;
          if (agent.safetyBlocked) {
            state.agent.safetyBlocks += 1;
          }
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentConversation,
  setSelectedModel,
  setAgentEnabled,
  setAgentStage,
  clearError,
  deleteConversation,
  createConversation,
} = aiSlice.actions;

export default aiSlice.reducer;
