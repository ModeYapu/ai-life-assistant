/**
 * 混合记忆系统 - 结合多种检索策略
 */

import { AIMessage } from '@/types';
import { freeVectorMemorySystem } from './freeVectorMemorySystem';

interface SearchResult {
  id: string;
  content: string;
  score: number;
  source: 'keyword' | 'semantic' | 'time' | 'importance';
  metadata?: any;
}

class HybridMemorySystem {
  private keywordIndex: Map<string, Set<string>> = new Map();
  private timeIndex: Map<string, number> = new Map();
  private importanceIndex: Set<string> = new Set();

  /**
   * 添加记忆到所有索引
   */
  async addMemory(id: string, content: string, metadata?: any): Promise<void> {
    // 1. 添加到向量系统
    await freeVectorMemorySystem.addMemory(id, content, metadata);
    
    // 2. 更新关键词索引
    const keywords = this.extractKeywords(content);
    for (const keyword of keywords) {
      if (!this.keywordIndex.has(keyword)) {
        this.keywordIndex.set(keyword, new Set());
      }
      this.keywordIndex.get(keyword)!.add(id);
    }
    
    // 3. 更新时间索引
    this.timeIndex.set(id, Date.now());
    
    // 4. 更新重要性索引
    if (metadata?.important) {
      this.importanceIndex.add(id);
    }
  }

  /**
   * 混合检索（多策略）
   */
  async search(query: string, options: {
    limit?: number;
    strategy?: 'keyword' | 'semantic' | 'hybrid';
    timeRange?: { start: number; end: number };
    includeImportant?: boolean;
  } = {}): Promise<SearchResult[]> {
    const {
      limit = 10,
      strategy = 'hybrid',
      timeRange,
      includeImportant = true,
    } = options;

    const results: SearchResult[] = [];

    // 1. 关键词检索
    if (strategy === 'keyword' || strategy === 'hybrid') {
      const keywordResults = this.keywordSearch(query);
      results.push(...keywordResults);
    }

    // 2. 语义检索
    if (strategy === 'semantic' || strategy === 'hybrid') {
      const semanticResults = await this.semanticSearch(query);
      results.push(...semanticResults);
    }

    // 3. 时间过滤
    let filteredResults = results;
    if (timeRange) {
      filteredResults = results.filter(r => {
        const timestamp = this.timeIndex.get(r.id) || 0;
        return timestamp >= timeRange.start && timestamp <= timeRange.end;
      });
    }

    // 4. 重要性加权
    if (includeImportant) {
      filteredResults = filteredResults.map(r => ({
        ...r,
        score: this.importanceIndex.has(r.id) ? r.score * 1.5 : r.score,
      }));
    }

    // 5. 去重和排序
    const uniqueResults = this.deduplicateResults(filteredResults);
    uniqueResults.sort((a, b) => b.score - a.score);

    return uniqueResults.slice(0, limit);
  }

  /**
   * 关键词检索
   */
  private keywordSearch(query: string): SearchResult[] {
    const keywords = this.extractKeywords(query);
    const scores = new Map<string, number>();
    
    // 计算每个记忆的匹配分数
    for (const keyword of keywords) {
      const matchingIds = this.keywordIndex.get(keyword) || new Set();
      for (const id of matchingIds) {
        scores.set(id, (scores.get(id) || 0) + 1);
      }
    }
    
    // 转换为结果
    const results: SearchResult[] = [];
    for (const [id, score] of scores.entries()) {
      const memory = Array.from(freeVectorMemorySystem['memories'].values())
        .find(m => m.id === id);
      
      if (memory) {
        results.push({
          id,
          content: memory.content,
          score: score / keywords.length, // 归一化
          source: 'keyword',
          metadata: memory.metadata,
        });
      }
    }
    
    return results;
  }

  /**
   * 语义检索
   */
  private async semanticSearch(query: string): Promise<SearchResult[]> {
    const results = await freeVectorMemorySystem.search(query, 20);
    
    return results.map(r => ({
      ...r,
      source: 'semantic' as const,
    }));
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 简单的关键词提取
    const keywords: string[] = [];
    
    // 移除标点
    const cleaned = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ');
    
    // 英文单词
    const englishWords = cleaned.match(/[a-zA-Z]+/g) || [];
    keywords.push(...englishWords.map(w => w.toLowerCase()));
    
    // 中文词组
    const chinese = cleaned.match(/[\u4e00-\u9fa5]+/g) || [];
    for (const word of chinese) {
      // 单字和双字组合
      for (let i = 0; i < word.length; i++) {
        keywords.push(word[i]);
      }
      for (let i = 0; i < word.length - 1; i++) {
        keywords.push(word.substring(i, i + 2));
      }
    }
    
    // 去重
    return Array.from(new Set(keywords));
  }

  /**
   * 去重结果
   */
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Map<string, SearchResult>();
    
    for (const result of results) {
      const existing = seen.get(result.id);
      if (!existing || result.score > existing.score) {
        seen.set(result.id, result);
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * 删除记忆
   */
  deleteMemory(id: string): void {
    // 从所有索引中删除
    for (const ids of this.keywordIndex.values()) {
      ids.delete(id);
    }
    this.timeIndex.delete(id);
    this.importanceIndex.delete(id);
    freeVectorMemorySystem.deleteMemory(id);
  }

  /**
   * 清空所有记忆
   */
  clearAll(): void {
    this.keywordIndex.clear();
    this.timeIndex.clear();
    this.importanceIndex.clear();
    freeVectorMemorySystem.clearAll();
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalMemories: number;
    keywordCount: number;
    importantCount: number;
  } {
    return {
      totalMemories: freeVectorMemorySystem.getMemoryCount(),
      keywordCount: this.keywordIndex.size,
      importantCount: this.importanceIndex.size,
    };
  }
}

export const hybridMemorySystem = new HybridMemorySystem();
