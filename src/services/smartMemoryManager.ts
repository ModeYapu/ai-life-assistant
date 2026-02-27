/**
 * 智能记忆管理器 - 快速改进版
 */

import { AIMessage, AIConversation } from '@/types';
import { storageService } from './storageService';

// 记忆配置
const MEMORY_CONFIG = {
  // 对话历史限制
  MAX_MESSAGES_PER_CONVERSATION: 20,      // 每个对话最多20条消息
  MAX_TOTAL_CONVERSATIONS: 10,             // 最多保留10个对话
  
  // 时间限制
  SHORT_TERM_TTL: 24 * 60 * 60 * 1000,    // 短期记忆：24小时
  LONG_TERM_TTL: 30 * 24 * 60 * 60 * 1000, // 长期记忆：30天
  
  // 摘要配置
  SUMMARY_THRESHOLD: 15,                   // 超过15条消息时生成摘要
  SUMMARY_MAX_LENGTH: 200,                 // 摘要最大长度200字
};

class SmartMemoryManager {
  private conversationCache: Map<string, AIConversation> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startAutoCleanup();
  }

  /**
   * 添加消息到对话（智能管理）
   */
  async addMessageToConversation(
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

    // 3. 智能管理（核心改进）
    conversation = await this.manageConversationMemory(conversation);

    // 4. 保存
    await storageService.saveConversation(conversation);
    this.conversationCache.set(conversationId, conversation);

    return conversation;
  }

  /**
   * 核心改进：智能管理对话记忆
   */
  private async manageConversationMemory(
    conversation: AIConversation
  ): Promise<AIConversation> {
    const messages = conversation.messages;

    // 改进1: 长度限制
    if (messages.length > MEMORY_CONFIG.MAX_MESSAGES_PER_CONVERSATION) {
      // 生成摘要
      if (messages.length > MEMORY_CONFIG.SUMMARY_THRESHOLD) {
        const oldMessages = messages.slice(0, -10);
        const summary = await this.generateSummary(oldMessages);
        
        // 保留摘要 + 最近10条消息
        conversation.messages = [
          {
            id: 'summary',
            role: 'system',
            content: `历史摘要: ${summary}`,
            timestamp: oldMessages[oldMessages.length - 1].timestamp,
          },
          ...messages.slice(-10),
        ];
      } else {
        // 直接截断
        conversation.messages = messages.slice(-MEMORY_CONFIG.MAX_MESSAGES_PER_CONVERSATION);
      }
    }

    // 改进2: 重要性标记
    conversation.messages = conversation.messages.map(msg => ({
      ...msg,
      metadata: {
        ...msg.metadata,
        important: this.isImportantMessage(msg.content),
      },
    }));

    // 改进3: 自动标题生成
    if (conversation.title === '新对话' && messages.length >= 2) {
      conversation.title = this.generateTitle(messages[0].content);
    }

    return conversation;
  }

  /**
   * 改进4: 智能检索（时间 + 重要性）
   */
  async searchMemories(query: string, options: {
    conversationId?: string;
    timeRange?: { start: number; end: number };
    includeImportant?: boolean;
    limit?: number;
  } = {}): Promise<AIMessage[]> {
    const {
      conversationId,
      timeRange,
      includeImportant = true,
      limit = 10,
    } = options;

    let conversations: AIConversation[];

    if (conversationId) {
      const conv = await this.getConversation(conversationId);
      conversations = conv ? [conv] : [];
    } else {
      conversations = await storageService.getConversations();
    }

    let results: AIMessage[] = [];

    for (const conv of conversations) {
      let messages = conv.messages;

      // 时间过滤
      if (timeRange) {
        messages = messages.filter(
          msg => msg.timestamp >= timeRange.start && msg.timestamp <= timeRange.end
        );
      }

      // 重要性过滤
      if (includeImportant) {
        const important = messages.filter(msg => msg.metadata?.important);
        if (important.length > 0) {
          results.push(...important);
        }
      }

      // 关键词匹配（改进：更智能的匹配）
      const queryWords = query.toLowerCase().split(' ');
      const matched = messages.filter(msg => {
        const content = msg.content.toLowerCase();
        return queryWords.some(word => content.includes(word));
      });

      results.push(...matched);
    }

    // 去重
    const uniqueResults = this.deduplicateMessages(results);

    // 按时间排序（最新的在前）
    uniqueResults.sort((a, b) => b.timestamp - a.timestamp);

    return uniqueResults.slice(0, limit);
  }

  /**
   * 改进5: 获取最近记忆（时间衰减）
   */
  async getRecentMemories(hours: number = 24): Promise<AIMessage[]> {
    const conversations = await storageService.getConversations();
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;

    const recentMessages: AIMessage[] = [];

    for (const conv of conversations) {
      const recent = conv.messages.filter(msg => msg.timestamp >= cutoffTime);
      recentMessages.push(...recent);
    }

    // 按时间排序
    recentMessages.sort((a, b) => b.timestamp - a.timestamp);

    return recentMessages;
  }

  /**
   * 改进6: 自动清理过期记忆
   */
  private async cleanupOldMemories(): Promise<void> {
    const conversations = await storageService.getConversations();
    const now = Date.now();

    const validConversations = conversations.filter(conv => {
      const age = now - conv.updatedAt;
      
      // 保留条件：
      // 1. 最近30天活跃，或
      // 2. 包含重要消息
      const hasImportant = conv.messages.some(msg => msg.metadata?.important);
      
      return age < MEMORY_CONFIG.LONG_TERM_TTL || hasImportant;
    });

    // 限制总数量
    if (validConversations.length > MEMORY_CONFIG.MAX_TOTAL_CONVERSATIONS) {
      validConversations.sort((a, b) => b.updatedAt - a.updatedAt);
      validConversations.splice(MEMORY_CONFIG.MAX_TOTAL_CONVERSATIONS);
    }

    // 保存清理后的数据
    await storageService.clearConversations();
    for (const conv of validConversations) {
      await storageService.saveConversation(conv);
    }
  }

  /**
   * 辅助方法：生成摘要
   */
  private async generateSummary(messages: AIMessage[]): Promise<string> {
    // 简化版本：提取关键信息
    const keyPoints: string[] = [];
    
    for (const msg of messages) {
      if (msg.role === 'user' && msg.content.length > 20) {
        // 提取前50个字符作为要点
        keyPoints.push(msg.content.slice(0, 50) + '...');
      }
    }

    const summary = keyPoints.slice(0, 5).join('; ');
    return summary.slice(0, MEMORY_CONFIG.SUMMARY_MAX_LENGTH);
  }

  /**
   * 辅助方法：判断消息重要性
   */
  private isImportantMessage(content: string): boolean {
    const importantKeywords = [
      '重要', '记住', '提醒', '必须', '关键',
      'deadline', '会议', '预约', '订单',
    ];

    return importantKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }

  /**
   * 辅助方法：生成对话标题
   */
  private generateTitle(firstMessage: string): string {
    // 取前30个字符作为标题
    return firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '');
  }

  /**
   * 辅助方法：去重消息
   */
  private deduplicateMessages(messages: AIMessage[]): AIMessage[] {
    const seen = new Set<string>();
    return messages.filter(msg => {
      if (seen.has(msg.id)) return false;
      seen.add(msg.id);
      return true;
    });
  }

  /**
   * 辅助方法：获取对话
   */
  private async getConversation(id: string): Promise<AIConversation | null> {
    // 先查缓存
    if (this.conversationCache.has(id)) {
      return this.conversationCache.get(id)!;
    }

    // 查存储
    const conversations = await storageService.getConversations();
    const conversation = conversations.find(c => c.id === id) || null;
    
    if (conversation) {
      this.conversationCache.set(id, conversation);
    }

    return conversation;
  }

  /**
   * 启动自动清理
   */
  private startAutoCleanup(): void {
    // 每小时清理一次
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMemories().catch(console.error);
    }, 60 * 60 * 1000);
  }

  /**
   * 停止自动清理
   */
  public stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * 获取记忆统计
   */
  async getMemoryStats(): Promise<{
    totalConversations: number;
    totalMessages: number;
    oldestMessage: number | null;
    newestMessage: number | null;
    importantMessages: number;
    estimatedSize: string;
  }> {
    const conversations = await storageService.getConversations();
    
    let totalMessages = 0;
    let oldestMessage: number | null = null;
    let newestMessage: number | null = null;
    let importantMessages = 0;

    for (const conv of conversations) {
      totalMessages += conv.messages.length;
      
      for (const msg of conv.messages) {
        if (!oldestMessage || msg.timestamp < oldestMessage) {
          oldestMessage = msg.timestamp;
        }
        if (!newestMessage || msg.timestamp > newestMessage) {
          newestMessage = msg.timestamp;
        }
        if (msg.metadata?.important) {
          importantMessages++;
        }
      }
    }

    // 估算大小（每条消息约1KB）
    const estimatedKB = totalMessages * 1;
    const estimatedSize = estimatedKB > 1024 
      ? `${(estimatedKB / 1024).toFixed(2)} MB`
      : `${estimatedKB} KB`;

    return {
      totalConversations: conversations.length,
      totalMessages,
      oldestMessage,
      newestMessage,
      importantMessages,
      estimatedSize,
    };
  }
}

export const smartMemoryManager = new SmartMemoryManager();
