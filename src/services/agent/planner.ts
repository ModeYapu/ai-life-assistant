export interface PlanStep {
  id: string;
  title: string;
  done: boolean;
}

export const planner = {
  build(task: string, maxSteps = 6): PlanStep[] {
    const segments = task
      .split(/[,.，。;；\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, maxSteps);

    if (segments.length === 0) {
      return [
        { id: 'step-1', title: 'Clarify requirements', done: false },
        { id: 'step-2', title: 'Implement and validate', done: false },
      ];
    }

    return segments.map((segment, index) => ({
      id: `step-${index + 1}`,
      title: segment,
      done: false,
    }));
  },
};
