import { AgentRunTrace } from './types';

class AgentObservability {
  private traces: AgentRunTrace[] = [];

  push(trace: AgentRunTrace): void {
    this.traces.unshift(trace);
    if (this.traces.length > 200) {
      this.traces = this.traces.slice(0, 200);
    }
  }

  last(): AgentRunTrace | undefined {
    return this.traces[0];
  }

  getMetrics() {
    const totalRuns = this.traces.length;
    const toolCalls = this.traces.reduce((sum, trace) => sum + trace.toolCalls, 0);
    const safetyBlocks = this.traces.filter((trace) => trace.safetyBlocked).length;
    const memoryHits = this.traces.reduce((sum, trace) => sum + trace.memoryHits, 0);
    return {
      totalRuns,
      toolCalls,
      safetyBlocks,
      avgMemoryHits: totalRuns > 0 ? memoryHits / totalRuns : 0,
    };
  }
}

export const agentObservability = new AgentObservability();
