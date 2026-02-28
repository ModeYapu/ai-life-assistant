/**
 * AI状态管理
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AIState, AIMessage, AIConversation } from '../../types';
import { aiService } from '../../services/aiService';
import { v4 as uuidv4 } from 'uuid';

const initialState: AIState = {
  conversations: [],
  currentConversation: null,
  models: [
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      type: 'chat',
      contextWindow: 128000,
      pricing: { input: 0.01, output: 0.03 },
      capabilities: ['text', 'code', 'analysis'],
    },
    {
      id: 'claude-3-5-sonnet',
      name: 'Claude 3.5 Sonnet',
      provider: 'anthropic',
      type: 'chat',
      contextWindow: 200000,
      pricing: { input: 0.003, output: 0.015 },
      capabilities: ['text', 'code', 'analysis', 'vision'],
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'google',
      type: 'chat',
      contextWindow: 32000,
      pricing: { input: 0.0005, output: 0.0015 },
      capabilities: ['text', 'code', 'vision'],
    },
  ],
  selectedModel: 'claude-3-5-sonnet',
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
      const { selectedModel, currentConversation } = state.ai;
      
      const userMessage: AIMessage = {
        id: uuidv4(),
        role: 'user',
        content: payload.content,
        timestamp: Date.now(),
      };

      // 调用AI服务（改进：使用统一记忆系统）
      // 导入统一记忆系统
      const { unifiedMemorySystem } = await import('@/services/unifiedMemorySystem');
      
      // 初始化（如果还没初始化）
      await unifiedMemorySystem.initialize();
      
      // 获取智能上下文（包括历史+相关记忆）
      const contextMessages = await unifiedMemorySystem.getContextForConversation(
        payload.conversationId,
        payload.content,
        10
      );
      
      const response = await aiService.sendMessage({
        model: selectedModel,
        messages: [
          ...contextMessages,
          { role: 'user', content: payload.content }
        ],
      });

      const assistantMessage: AIMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        metadata: {
          model: selectedModel,
          tokens: response.tokens,
          latency: response.latency,
        },
      };

      return {
        conversationId: payload.conversationId,
        userMessage,
        assistantMessage,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createConversation = createAsyncThunk(
  'ai/createConversation',
  async (title: string = '新对话') => {
    const conversation: AIConversation = {
      id: uuidv4(),
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return conversation;
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
        const { conversationId, userMessage, assistantMessage } = action.payload;
        
        const conversation = state.conversations.find(c => c.id === conversationId);
        if (conversation) {
          conversation.messages.push(userMessage, assistantMessage);
          conversation.updatedAt = Date.now();
          
          // 自动生成标题（如果是第一条消息）
          if (conversation.messages.length === 2) {
            conversation.title = userMessage.content.slice(0, 30) + '...';
          }
        }
        
        if (state.currentConversation?.id === conversationId) {
          state.currentConversation = conversation || null;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // 创建对话
      .addCase(createConversation.fulfilled, (state, action) => {
        state.conversations.unshift(action.payload);
        state.currentConversation = action.payload;
      });
  },
});

export const { 
  setCurrentConversation, 
  setSelectedModel, 
  clearError,
  deleteConversation 
} = aiSlice.actions;

export default aiSlice.reducer;
