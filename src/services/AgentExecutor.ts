/**
 * Agent执行框架
 * 自主任务规划和执行
 */

import { logger } from '@/utils/logger';
import { ToolRegistry } from './ToolRegistry';

export interface AgentTask {
  id: string;
  goal: string;
  status: 'pending' | 'planning' | 'executing' | 'completed' | 'failed';
  steps: TaskStep[];
  currentStep: number;
  result?: any;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TaskStep {
  id: string;
  description: string;
  tool?: string;
  params?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface AgentConfig {
  maxSteps: number;
  timeout: number;
  retryAttempts: number;
  verbose: boolean;
}

/**
 * Agent执行器
 */
export class AgentExecutor {
  private tasks: Map<string, AgentTask> = new Map();
  private toolRegistry: ToolRegistry;
  private config: AgentConfig;

  constructor(toolRegistry: ToolRegistry, config?: Partial<AgentConfig>) {
    this.toolRegistry = toolRegistry;
    this.config = {
      maxSteps: 10,
      timeout: 300000, // 5分钟
      retryAttempts: 3,
      verbose: true,
      ...config,
    };
  }

  /**
   * 创建任务
   */
  createTask(goal: string): AgentTask {
    const task: AgentTask = {
      id: this.generateId(),
      goal,
      status: 'pending',
      steps: [],
      currentStep: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.tasks.set(task.id, task);
    logger.info(`创建任务: ${goal}`, { taskId: task.id });
    return task;
  }

  /**
   * 执行任务
   */
  async execute(taskId: string): Promise<any> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`任务不存在: ${taskId}`);
    }

    try {
      // 1. 规划阶段
      task.status = 'planning';
      task.updatedAt = Date.now();
      logger.info(`开始规划: ${task.goal}`);

      await this.plan(task);

      // 2. 执行阶段
      task.status = 'executing';
      logger.info(`开始执行: ${task.steps.length}个步骤`);

      for (let i = 0; i < task.steps.length; i++) {
        task.currentStep = i;
        const step = task.steps[i];

        logger.info(`执行步骤 ${i + 1}/${task.steps.length}: ${step.description}`);

        await this.executeStep(task, step);

        if (step.status === 'failed') {
          // 失败重试
          let retryCount = 0;
          while (retryCount < this.config.retryAttempts && step.status === 'failed') {
            retryCount++;
            logger.warn(`重试步骤 ${retryCount}/${this.config.retryAttempts}`);
            await this.executeStep(task, step);
          }

          if (step.status === 'failed') {
            throw new Error(`步骤执行失败: ${step.error}`);
          }
        }
      }

      // 3. 完成阶段
      task.status = 'completed';
      task.updatedAt = Date.now();
      logger.info(`任务完成: ${task.id}`);

      return task.result;
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message;
      task.updatedAt = Date.now();
      logger.error(`任务失败: ${error.message}`, { taskId: task.id });
      throw error;
    }
  }

  /**
   * 规划任务步骤
   */
  private async plan(task: AgentTask): Promise<void> {
    // 基于目标自动分解任务
    const goal = task.goal.toLowerCase();

    // 简单的规则引擎（实际应使用LLM）
    if (goal.includes('搜索') || goal.includes('查找')) {
      task.steps.push({
        id: `${task.id}_step_1`,
        description: '执行搜索',
        tool: 'search',
        params: { query: task.goal },
        status: 'pending',
      });
    }

    if (goal.includes('创建') || goal.includes('新建')) {
      task.steps.push({
        id: `${task.id}_step_1`,
        description: '创建资源',
        tool: 'create',
        params: { goal: task.goal },
        status: 'pending',
      });
    }

    if (goal.includes('分析') || goal.includes('评估')) {
      task.steps.push({
        id: `${task.id}_step_1`,
        description: '收集数据',
        tool: 'collect',
        params: { goal: task.goal },
        status: 'pending',
      });
      task.steps.push({
        id: `${task.id}_step_2`,
        description: '分析数据',
        tool: 'analyze',
        params: {},
        status: 'pending',
      });
    }

    // 默认步骤
    if (task.steps.length === 0) {
      task.steps.push({
        id: `${task.id}_step_1`,
        description: '执行任务',
        tool: 'default',
        params: { goal: task.goal },
        status: 'pending',
      });
    }

    logger.info(`规划完成: ${task.steps.length}个步骤`);
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(task: AgentTask, step: TaskStep): Promise<void> {
    step.status = 'running';
    task.updatedAt = Date.now();

    try {
      if (step.tool && this.toolRegistry.has(step.tool)) {
        // 调用工具
        const result = await this.toolRegistry.execute(
          step.tool,
          step.params || {}
        );
        step.result = result;
        step.status = 'completed';
        task.result = result;
      } else {
        // 默认执行
        step.result = { success: true, message: step.description };
        step.status = 'completed';
      }

      task.updatedAt = Date.now();
      logger.info(`步骤完成: ${step.description}`, { result: step.result });
    } catch (error: any) {
      step.status = 'failed';
      step.error = error.message;
      task.updatedAt = Date.now();
      logger.error(`步骤失败: ${error.message}`, { stepId: step.id });
      throw error;
    }
  }

  /**
   * 获取任务状态
   */
  getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 取消任务
   */
  cancel(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'executing') {
      task.status = 'failed';
      task.error = '用户取消';
      task.updatedAt = Date.now();
      logger.info(`取消任务: ${taskId}`);
      return true;
    }
    return false;
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): AgentTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Agent Hook
 */
export function useAgent(config?: Partial<AgentConfig>) {
  const toolRegistryRef = React.useRef<ToolRegistry>(new ToolRegistry());
  const executorRef = React.useRef<AgentExecutor>(
    new AgentExecutor(toolRegistryRef.current, config)
  );

  const createTask = (goal: string) => {
    return executorRef.current.createTask(goal);
  };

  const executeTask = async (taskId: string) => {
    return await executorRef.current.execute(taskId);
  };

  const getTask = (taskId: string) => {
    return executorRef.current.getTask(taskId);
  };

  const cancelTask = (taskId: string) => {
    return executorRef.current.cancel(taskId);
  };

  const getAllTasks = () => {
    return executorRef.current.getAllTasks();
  };

  const registerTool = (name: string, handler: Function) => {
    toolRegistryRef.current.register(name, handler);
  };

  return {
    createTask,
    executeTask,
    getTask,
    cancelTask,
    getAllTasks,
    registerTool,
  };
}

// 添加React导入
import React from 'react';
