# Agent Deep Development Roadmap

## Scope
Build a production-ready mobile agent in 8 phases (0-7) with gate-based self-validation after each phase.

## Validation Gate
Each phase must pass:

```bash
npm run validate:agent
```

If gate fails, fix issues in-phase and rerun until pass.

## Milestones

### Phase 0: Baseline and Metrics
- Stabilize build/test pipeline.
- Define KPIs: response latency, retrieval hit rate, tool success rate, task completion rate.
- Deliverables: roadmap doc, validation command, baseline report.

### Phase 1: Agent Kernel
- Introduce Perception -> Cognition -> Reasoning -> Action pipeline.
- Integrate kernel into existing `aiService`.

### Phase 2: Three-tier Memory
- Implement working/episodic/semantic memory.
- Add hybrid retrieval and memory write policies.

### Phase 3: Planner/Executor
- Add structured planning for complex tasks.
- Integrate `codePlanService` into reasoning path.

### Phase 4: Tools and Orchestration
- Add tool registry with schema + timeout + safety checks.
- Route actions through guarded tool execution.

### Phase 5: Multi-Agent Collaboration
- Add role agents: Router, Planner, Executor, Critic.
- Use role handoff only for complex tasks.

### Phase 6: Evaluation, Safety, Observability
- Add run traces and scoring.
- Add guardrails: prompt-injection checks, sensitive-data masking, allow-list tools.

### Phase 7: Product Integration
- Expose controls and diagnostics in app state/UI.
- Support stage toggle and agent diagnostics for debugging.

## Done Criteria
- All phases implemented with passing validation.
- Code paths remain backward compatible for basic chat flow.
