/**
 * 向量记忆系统 - 免费版（无需API Key）
 * 使用多种替代方案实现语义搜索
 */

import { AIMessage } from '@/types';

interface MemoryItem {
  id: string;
  content: string;
  timestamp: number;
  metadata?: any;
  // 关键词向量（TF-IDF）
  keywords: Map<string, number>;
}

class FreeVectorMemorySystem {
  private memories: Map<string, MemoryItem> = new Map();
  private documentFrequency: Map<string, number> = new Map();
  private totalDocuments: number = 0;

  /**
   * 添加记忆（使用TF-IDF）
   */
  async addMemory(id: string, content: string, metadata?: any): Promise<void> {
    // 1. 分词
    const tokens = this.tokenize(content);
    
    // 2. 计算词频（TF）
    const termFrequency = new Map<string, number>();
    for (const token of tokens) {
      termFrequency.set(token, (termFrequency.get(token) || 0) + 1);
    }
    
    // 3. 归一化
    const keywords = new Map<string, number>();
    const maxFreq = Math.max(...Array.from(termFrequency.values()));
    
    for (const [term, freq] of termFrequency.entries()) {
      keywords.set(term, freq / maxFreq);
      
      // 更新文档频率
      this.documentFrequency.set(term, (this.documentFrequency.get(term) || 0) + 1);
    }
    
    this.totalDocuments++;
    
    // 4. 存储
    this.memories.set(id, {
      id,
      content,
      timestamp: Date.now(),
      metadata,
      keywords,
    });
  }

  /**
   * 语义搜索（基于TF-IDF相似度）
   */
  async search(query: string, limit: number = 5): Promise<Array<{
    id: string;
    content: string;
    score: number;
    metadata?: any;
  }>> {
    // 1. 查询向量化
    const queryTokens = this.tokenize(query);
    const queryVector = this.computeTFIDF(queryTokens);
    
    // 2. 计算相似度
    const results: Array<{
      id: string;
      content: string;
      score: number;
      metadata?: any;
    }> = [];
    
    for (const [id, memory] of this.memories.entries()) {
      const memoryVector = this.computeTFIDF(Array.from(memory.keywords.keys()));
      const similarity = this.cosineSimilarity(queryVector, memoryVector);
      
      results.push({
        id,
        content: memory.content,
        score: similarity,
        metadata: memory.metadata,
      });
    }
    
    // 3. 排序并返回top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * 分词（中文优化）
   */
  private tokenize(text: string): string[] {
    // 简单的分词策略
    const tokens: string[] = [];
    
    // 1. 移除标点符号
    const cleaned = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ');
    
    // 2. 英文分词
    const englishWords = cleaned.match(/[a-zA-Z]+/g) || [];
    tokens.push(...englishWords.map(w => w.toLowerCase()));
    
    // 3. 中文分词（简单的2-gram）
    const chinese = cleaned.match(/[\u4e00-\u9fa5]+/g) || [];
    for (const word of chinese) {
      // 单字
      for (let i = 0; i < word.length; i++) {
        tokens.push(word[i]);
      }
      // 双字组合
      for (let i = 0; i < word.length - 1; i++) {
        tokens.push(word.substring(i, i + 2));
      }
    }
    
    // 4. 停用词过滤
    const stopWords = new Set([
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这',
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    ]);
    
    return tokens.filter(t => !stopWords.has(t) && t.length > 0);
  }

  /**
   * 计算TF-IDF向量
   */
  private computeTFIDF(tokens: string[]): Map<string, number> {
    const tfidf = new Map<string, number>();
    const termFreq = new Map<string, number>();
    
    // 计算词频
    for (const token of tokens) {
      termFreq.set(token, (termFreq.get(token) || 0) + 1);
    }
    
    // 计算TF-IDF
    for (const [term, freq] of termFreq.entries()) {
      const tf = freq / tokens.length;
      const df = this.documentFrequency.get(term) || 1;
      const idf = Math.log(this.totalDocuments / df);
      
      tfidf.set(term, tf * idf);
    }
    
    return tfidf;
  }

  /**
   * 余弦相似度
   */
  private cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    // 计算点积
    for (const [key, valueA] of a.entries()) {
      const valueB = b.get(key) || 0;
      dotProduct += valueA * valueB;
    }
    
    // 计算范数
    for (const value of a.values()) {
      normA += value * value;
    }
    for (const value of b.values()) {
      normB += value * value;
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 删除记忆
   */
  deleteMemory(id: string): void {
    const memory = this.memories.get(id);
    if (memory) {
      // 更新文档频率
      for (const term of memory.keywords.keys()) {
        const freq = this.documentFrequency.get(term) || 0;
        if (freq > 0) {
          this.documentFrequency.set(term, freq - 1);
        }
      }
      this.totalDocuments--;
      this.memories.delete(id);
    }
  }

  /**
   * 清空所有记忆
   */
  clearAll(): void {
    this.memories.clear();
    this.documentFrequency.clear();
    this.totalDocuments = 0;
  }

  /**
   * 获取记忆数量
   */
  getMemoryCount(): number {
    return this.memories.size;
  }

  /**
   * 导出记忆
   */
  exportMemories(): any {
    return {
      memories: Array.from(this.memories.entries()).map(([id, memory]) => ({
        ...memory,
        keywords: Array.from(memory.keywords.entries()),
      })),
      documentFrequency: Array.from(this.documentFrequency.entries()),
      totalDocuments: this.totalDocuments,
    };
  }

  /**
   * 导入记忆
   */
  importMemories(data: any): void {
    this.memories.clear();
    this.documentFrequency.clear();
    
    for (const memory of data.memories) {
      this.memories.set(memory.id, {
        ...memory,
        keywords: new Map(memory.keywords),
      });
    }
    
    this.documentFrequency = new Map(data.documentFrequency);
    this.totalDocuments = data.totalDocuments;
  }
}

export const freeVectorMemorySystem = new FreeVectorMemorySystem();
