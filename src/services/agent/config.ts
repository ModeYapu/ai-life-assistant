import { AgentConfig, AgentStage } from './types';

const state: AgentConfig = {
  enabled: true,
  stage: 7,
  maxPlanSteps: 6,
  safetyMode: 'normal',
};

export const agentConfig = {
  get(): AgentConfig {
    return { ...state };
  },
  setEnabled(enabled: boolean): void {
    state.enabled = enabled;
  },
  setStage(stage: AgentStage): void {
    state.stage = stage;
  },
  setSafetyMode(mode: AgentConfig['safetyMode']): void {
    state.safetyMode = mode;
  },
};
