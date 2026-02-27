/**
 * 向量记忆系统（轻量级实现）
 */

import { OpenAI } from 'openai';

interface VectorMemory {
  id: string;
  content: string;
  embedding: number[];
  timestamp: number;
  metadata?: any;
}

class VectorMemorySystem {
  private memories: Map<string, VectorMemory> = new Map();
  private openai: OpenAI | null = null;
  private initialized: boolean = false;

  /**
   * 初始化（需要API Key）
   */
  async initialize(apiKey: string): Promise<void> {
    this.openai = new OpenAI({ apiKey });
    this.initialized = true;
  }

  /**
   * 添加记忆（生成向量嵌入）
   */
  async addMemory(id: string, content: string, metadata?: any): Promise<void> {
    if (!this.initialized || !this.openai) {
      console.warn('VectorMemorySystem not initialized');
      return;
    }

    try {
      // 生成向量嵌入
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: content,
      });

      const embedding = response.data[0].embedding;

      // 存储
      this.memories.set(id, {
        id,
        content,
        embedding,
        timestamp: Date.now(),
        metadata,
      });
    } catch (error) {
      console.error('Failed to add vector memory:', error);
    }
  }

  /**
   * 语义搜索
   */
  async search(query: string, limit: number = 5): Promise<Array<{
    id: string;
    content: string;
    score: number;
    metadata?: any;
  }>> {
    if (!this.initialized || !this.openai) {
      console.warn('VectorMemorySystem not initialized');
      return [];
    }

    try {
      // 生成查询向量
      const queryResponse = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      });

      const queryEmbedding = queryResponse.data[0].embedding;

      // 计算相似度
      const results: Array<{
        id: string;
        content: string;
        score: number;
        metadata?: any;
      }> = [];

      for (const [id, memory] of this.memories.entries()) {
        const similarity = this.cosineSimilarity(queryEmbedding, memory.embedding);
        
        results.push({
          id,
          content: memory.content,
          score: similarity,
          metadata: memory.metadata,
        });
      }

      // 排序并返回top K
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to search vector memory:', error);
      return [];
    }
  }

  /**
   * 获取相似度（余弦相似度）
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 删除记忆
   */
  deleteMemory(id: string): void {
    this.memories.delete(id);
  }

  /**
   * 清空所有记忆
   */
  clearAll(): void {
    this.memories.clear();
  }

  /**
   * 获取记忆数量
   */
  getMemoryCount(): number {
    return this.memories.size;
  }

  /**
   * 导出记忆（用于持久化）
   */
  exportMemories(): VectorMemory[] {
    return Array.from(this.memories.values());
  }

  /**
   * 导入记忆（从持久化恢复）
   */
  importMemories(memories: VectorMemory[]): void {
    for (const memory of memories) {
      this.memories.set(memory.id, memory);
    }
  }
}

export const vectorMemorySystem = new VectorMemorySystem();
