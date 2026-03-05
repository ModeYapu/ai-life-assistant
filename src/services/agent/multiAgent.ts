import { PlanStep } from './planner';

export const multiAgent = {
  router(complexity: 'low' | 'medium' | 'high') {
    if (complexity === 'high') return 'multi-agent' as const;
    if (complexity === 'medium') return 'planner' as const;
    return 'single' as const;
  },
  plannerReview(steps: PlanStep[]): string {
    return `Planner generated ${steps.length} steps.`;
  },
  critic(prompt: string): string {
    if (prompt.length < 12) {
      return 'Critic: request is short, ask clarifying details if needed.';
    }
    return 'Critic: plan is acceptable.';
  },
};
