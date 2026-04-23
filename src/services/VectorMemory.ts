/**
 * 向量记忆系统
 * 使用嵌入向量实现语义检索
 */

import { logger } from '@/utils/logger';

export interface Memory {
  id: string;
  content: string;
  embedding?: number[];
  metadata: {
    userId: string;
    type: 'conversation' | 'task' | 'preference' | 'note';
    timestamp: number;
    tags?: string[];
    importance?: number;
  };
}

export interface SearchResult {
  memory: Memory;
  score: number;
}

/**
 * 向量记忆管理器
 */
export class VectorMemory {
  private memories: Map<string, Memory> = new Map();
  private embeddings: Map<string, number[]> = new Map();
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * 存储记忆
   */
  async store(
    content: string,
    type: Memory['metadata']['type'],
    metadata?: Partial<Memory['metadata']>
  ): Promise<string> {
    const id = this.generateId();
    const embedding = await this.getEmbedding(content);

    const memory: Memory = {
      id,
      content,
      embedding,
      metadata: {
        userId: this.userId,
        type,
        timestamp: Date.now(),
        ...metadata,
      },
    };

    this.memories.set(id, memory);
    this.embeddings.set(id, embedding);

    logger.info(`存储记忆: ${type}`, { id, content: content.substring(0, 50) });
    return id;
  }

  /**
   * 语义搜索
   */
  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    const queryEmbedding = await this.getEmbedding(query);
    const results: SearchResult[] = [];

    for (const [id, memory] of this.memories) {
      if (memory.metadata.userId !== this.userId) continue;

      const storedEmbedding = this.embeddings.get(id);
      if (!storedEmbedding) continue;

      const score = this.cosineSimilarity(queryEmbedding, storedEmbedding);
      results.push({ memory, score });
    }

    // 按相似度排序
    results.sort((a, b) => b.score - a.score);

    logger.info(`搜索记忆: "${query}"`, { topK, results: results.length });
    return results.slice(0, topK);
  }

  /**
   * 获取用户画像
   */
  getUserProfile(): {
    totalMemories: number;
    byType: Record<string, number>;
    recentActivity: Memory[];
    preferences: Memory[];
  } {
    const userMemories = Array.from(this.memories.values()).filter(
      (m) => m.metadata.userId === this.userId
    );

    const byType: Record<string, number> = {};
    userMemories.forEach((m) => {
      byType[m.metadata.type] = (byType[m.metadata.type] || 0) + 1;
    });

    const recentActivity = userMemories
      .sort((a, b) => b.metadata.timestamp - a.metadata.timestamp)
      .slice(0, 10);

    const preferences = userMemories.filter((m) => m.metadata.type === 'preference');

    return {
      totalMemories: userMemories.length,
      byType,
      recentActivity,
      preferences,
    };
  }

  /**
   * 获取相关上下文
   */
  async getContext(query: string, maxTokens: number = 2000): Promise<string> {
    const results = await this.search(query, 10);
    let context = '';
    let currentTokens = 0;

    for (const result of results) {
      const tokens = this.estimateTokens(result.memory.content);
      if (currentTokens + tokens > maxTokens) break;

      context += `[${result.memory.metadata.type}] ${result.memory.content}\n\n`;
      currentTokens += tokens;
    }

    return context;
  }

  /**
   * 删除记忆
   */
  delete(id: string): boolean {
    const deleted = this.memories.delete(id);
    this.embeddings.delete(id);
    return deleted;
  }

  /**
   * 清空用户记忆
   */
  clear(): void {
    for (const [id, memory] of this.memories) {
      if (memory.metadata.userId === this.userId) {
        this.memories.delete(id);
        this.embeddings.delete(id);
      }
    }
    logger.info(`清空用户记忆: ${this.userId}`);
  }

  /**
   * 获取嵌入向量（模拟）
   * 实际使用时接入真实embedding API
   */
  private async getEmbedding(text: string): Promise<number[]> {
    // 简单的词频向量（实际应使用OpenAI/Cohere等API）
    const words = text.toLowerCase().split(/\s+/);
    const vector = new Array(128).fill(0);

    words.forEach((word, i) => {
      const hash = this.simpleHash(word);
      vector[hash % vector.length] += 1;
    });

    // 归一化
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return vector.map((v) => v / (magnitude || 1));
  }

  /**
   * 余弦相似度
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    return dotProduct / (magnitudeA * magnitudeB || 1);
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 简单哈希
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * 估算token数量
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

/**
 * 记忆管理Hook
 */
export function useMemory(userId: string) {
  const memoryRef = React.useRef<VectorMemory>(new VectorMemory(userId));

  const storeMemory = async (
    content: string,
    type: Memory['metadata']['type'],
    metadata?: Partial<Memory['metadata']>
  ) => {
    return await memoryRef.current.store(content, type, metadata);
  };

  const searchMemory = async (query: string, topK?: number) => {
    return await memoryRef.current.search(query, topK);
  };

  const getContext = async (query: string, maxTokens?: number) => {
    return await memoryRef.current.getContext(query, maxTokens);
  };

  const getUserProfile = () => {
    return memoryRef.current.getUserProfile();
  };

  return {
    storeMemory,
    searchMemory,
    getContext,
    getUserProfile,
  };
}

// 添加React导入
import React from 'react';
