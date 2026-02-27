/**
 * 统一记忆系统 - 集成混合检索和智能管理
 */

import { AIMessage, AIConversation } from '@/types';
import { hybridMemorySystem } from './hybridMemorySystem';
import { extendedStorageService } from './extendedStorageService';

// 记忆配置
const MEMORY_CONFIG = {
  MAX_MESSAGES_PER_CONVERSATION: 20,
  MAX_TOTAL_CONVERSATIONS: 10,
  AUTO_SAVE_INTERVAL: 60 * 60 * 1000, // 1小时
};

class UnifiedMemorySystem {
  private conversationCache: Map<string, AIConversation> = new Map();
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private initialized: boolean = false;

  /**
   * 初始化记忆系统
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // 1. 加载持久化数据
    await this.loadPersistedData();

    // 2. 启动自动保存
    this.startAutoSave();

    this.initialized = true;
    console.log('✅ 统一记忆系统已初始化');
  }

  /**
   * 添加消息（智能记忆管理）
   */
  async addMessage(
    conversationId: string,
    message: AIMessage
  ): Promise<AIConversation> {
    // 1. 获取或创建对话
    let conversation = await this.getConversation(conversationId);
    
    if (!conversation) {
      conversation = {
        id: conversationId,
        title: '新对话',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    // 2. 添加消息
    conversation.messages.push(message);
    conversation.updatedAt = Date.now();

    // 3. 添加到混合记忆系统
    await hybridMemorySystem.addMemory(
      message.id,
      message.content,
      {
        conversationId,
        role: message.role,
        timestamp: message.timestamp,
        important: this.isImportantMessage(message.content),
      }
    );

    // 4. 智能管理（长度限制 + 摘要）
    conversation = await this.manageConversation(conversation);

    // 5. 更新缓存和存储
    this.conversationCache.set(conversationId, conversation);
    await extendedStorageService.saveConversation(conversation);

    return conversation;
  }

  /**
   * 智能检索记忆
   */
  async searchMemories(query: string, options: {
    conversationId?: string;
    timeRange?: { start: number; end: number };
    includeImportant?: boolean;
    limit?: number;
  } = {}): Promise<Array<{
    id: string;
    content: string;
    score: number;
    source: string;
    metadata?: any;
  }>> {
    return await hybridMemorySystem.search(query, {
      strategy: 'hybrid',
      ...options,
    });
  }

  /**
   * 获取上下文（用于AI对话）
   */
  async getContextForConversation(
    conversationId: string,
    currentMessage: string,
    maxMessages: number = 10
  ): Promise<AIMessage[]> {
    // 1. 获取对话历史
    const conversation = await this.getConversation(conversationId);
    if (!conversation) return [];

    // 2. 获取最近消息
    const recentMessages = conversation.messages.slice(-maxMessages);

    // 3. 智能检索相关记忆
    const relevantMemories = await this.searchMemories(currentMessage, {
      conversationId,
      limit: 3,
      includeImportant: true,
    });

    // 4. 构建上下文
    const context: AIMessage[] = [];

    // 添加相关记忆作为上下文
    if (relevantMemories.length > 0) {
      const memoryContext = relevantMemories
        .map(m => m.content)
        .join('; ');
      
      context.push({
        id: 'context',
        role: 'system',
        content: `相关记忆: ${memoryContext}`,
        timestamp: Date.now(),
      });
    }

    // 添加最近对话
    context.push(...recentMessages);

    return context;
  }

  /**
   * 智能对话管理
   */
  private async manageConversation(
    conversation: AIConversation
  ): Promise<AIConversation> {
    const messages = conversation.messages;

    // 长度限制
    if (messages.length > MEMORY_CONFIG.MAX_MESSAGES_PER_CONVERSATION) {
      // 生成摘要
      const summary = this.generateSummary(messages.slice(0, -10));
      
      conversation.messages = [
        {
          id: 'summary',
          role: 'system',
          content: `历史摘要: ${summary}`,
          timestamp: messages[0].timestamp,
        },
        ...messages.slice(-10),
      ];
    }

    // 自动标题
    if (conversation.title === '新对话' && messages.length >= 2) {
      conversation.title = this.generateTitle(messages[0].content);
    }

    return conversation;
  }

  /**
   * 获取对话
   */
  private async getConversation(id: string): Promise<AIConversation | null> {
    // 查缓存
    if (this.conversationCache.has(id)) {
      return this.conversationCache.get(id)!;
    }

    // 查存储
    const conversations = await extendedStorageService.getConversations();
    const conversation = conversations.find(c => c.id === id) || null;
    
    if (conversation) {
      this.conversationCache.set(id, conversation);
    }

    return conversation;
  }

  /**
   * 判断消息重要性
   */
  private isImportantMessage(content: string): boolean {
    const keywords = ['重要', '记住', '提醒', 'deadline', '会议', '预约'];
    return keywords.some(k => content.includes(k));
  }

  /**
   * 生成摘要
   */
  private generateSummary(messages: AIMessage[]): string {
    const keyPoints = messages
      .filter(m => m.role === 'user' && m.content.length > 20)
      .map(m => m.content.slice(0, 50))
      .slice(0, 3);
    
    return keyPoints.join('; ');
  }

  /**
   * 生成标题
   */
  private generateTitle(content: string): string {
    return content.slice(0, 30) + (content.length > 30 ? '...' : '');
  }

  /**
   * 加载持久化数据
   */
  private async loadPersistedData(): Promise<void> {
    try {
      // 加载对话
      const conversations = await extendedStorageService.getConversations();
      
      // 恢复到混合系统
      for (const conv of conversations) {
        for (const msg of conv.messages) {
          await hybridMemorySystem.addMemory(
            msg.id,
            msg.content,
            {
              conversationId: conv.id,
              role: msg.role,
              timestamp: msg.timestamp,
              important: this.isImportantMessage(msg.content),
            }
          );
        }
      }

      console.log(`✅ 已加载 ${conversations.length} 个对话`);
    } catch (error) {
      console.error('加载持久化数据失败:', error);
    }
  }

  /**
   * 启动自动保存
   */
  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      this.persistData().catch(console.error);
    }, MEMORY_CONFIG.AUTO_SAVE_INTERVAL);
  }

  /**
   * 持久化数据
   */
  private async persistData(): Promise<void> {
    try {
      // 对话数据已在每次添加时保存
      // 这里可以添加额外的持久化逻辑
      console.log('✅ 自动保存完成');
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{
    totalConversations: number;
    totalMessages: number;
    importantMessages: number;
    memoryStats: any;
  }> {
    const conversations = await extendedStorageService.getConversations();
    const memoryStats = hybridMemorySystem.getStats();

    let totalMessages = 0;
    let importantMessages = 0;

    for (const conv of conversations) {
      totalMessages += conv.messages.length;
      importantMessages += conv.messages.filter(
        m => this.isImportantMessage(m.content)
      ).length;
    }

    return {
      totalConversations: conversations.length,
      totalMessages,
      importantMessages,
      memoryStats,
    };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
}

export const unifiedMemorySystem = new UnifiedMemorySystem();
