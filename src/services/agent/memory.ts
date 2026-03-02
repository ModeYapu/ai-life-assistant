import { hybridMemorySystem } from '../hybridMemorySystem';

interface MemoryRecord {
  id: string;
  content: string;
  timestamp: number;
  layer: 'working' | 'episodic' | 'semantic';
}

class AgentMemory {
  private workingMemory = new Map<string, MemoryRecord[]>();
  private readonly workingLimit = 8;

  async write(conversationId: string, content: string, important = false): Promise<void> {
    const id = `${conversationId}:${Date.now()}:${Math.random().toString(16).slice(2, 8)}`;
    const record: MemoryRecord = {
      id,
      content,
      timestamp: Date.now(),
      layer: 'working',
    };

    const current = this.workingMemory.get(conversationId) || [];
    current.unshift(record);
    this.workingMemory.set(conversationId, current.slice(0, this.workingLimit));

    await hybridMemorySystem.addMemory(id, content, { important });
  }

  async retrieve(conversationId: string, query: string, limit = 5): Promise<MemoryRecord[]> {
    const working = (this.workingMemory.get(conversationId) || [])
      .filter((item) => item.content.toLowerCase().includes(query.toLowerCase()))
      .slice(0, Math.min(limit, 3));

    const semantic = await hybridMemorySystem.search(query, {
      limit: Math.max(0, limit - working.length),
      strategy: 'hybrid',
      includeImportant: true,
    });

    const semanticRecords: MemoryRecord[] = semantic.map((item) => ({
      id: item.id,
      content: item.content,
      timestamp: Date.now(),
      layer: 'semantic',
    }));

    return [...working, ...semanticRecords].slice(0, limit);
  }
}

export const agentMemory = new AgentMemory();
