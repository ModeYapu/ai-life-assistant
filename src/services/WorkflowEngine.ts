/**
 * 工作流引擎
 * 自动化工作流编排
 */

import { logger } from '@/utils/logger';

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'loop' | 'delay';
  name: string;
  config: any;
  next?: string[];
  onError?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: Map<string, WorkflowNode>;
  triggers: string[];
  status: 'active' | 'inactive' | 'running';
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentNode: string;
  context: any;
  logs: ExecutionLog[];
  startedAt: number;
  completedAt?: number;
}

export interface ExecutionLog {
  nodeId: string;
  nodeName: string;
  status: 'started' | 'completed' | 'failed';
  timestamp: number;
  message?: string;
  error?: string;
}

/**
 * 工作流引擎
 */
export class WorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private actionHandlers: Map<string, Function> = new Map();

  /**
   * 创建工作流
   */
  createWorkflow(
    name: string,
    description: string,
    nodes: WorkflowNode[]
  ): Workflow {
    const workflow: Workflow = {
      id: this.generateId(),
      name,
      description,
      nodes: new Map(),
      triggers: [],
      status: 'inactive',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 添加节点
    nodes.forEach((node) => {
      workflow.nodes.set(node.id, node);

      // 识别触发器
      if (node.type === 'trigger') {
        workflow.triggers.push(node.id);
      }
    });

    this.workflows.set(workflow.id, workflow);
    logger.info(`创建工作流: ${name}`, { workflowId: workflow.id });
    return workflow;
  }

  /**
   * 注册动作处理器
   */
  registerAction(actionType: string, handler: Function): void {
    this.actionHandlers.set(actionType, handler);
    logger.info(`注册动作: ${actionType}`);
  }

  /**
   * 执行工作流
   */
  async execute(workflowId: string, context: any = {}): Promise<any> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`工作流不存在: ${workflowId}`);
    }

    // 创建执行实例
    const execution: WorkflowExecution = {
      id: this.generateId(),
      workflowId,
      status: 'pending',
      currentNode: workflow.triggers[0] || '',
      context,
      logs: [],
      startedAt: Date.now(),
    };

    this.executions.set(execution.id, execution);

    try {
      execution.status = 'running';
      workflow.status = 'running';

      // 从触发器开始执行
      const startNode = workflow.nodes.get(execution.currentNode);
      if (!startNode) {
        throw new Error('未找到起始节点');
      }

      await this.executeNode(workflow, execution, startNode);

      execution.status = 'completed';
      workflow.status = 'active';
      execution.completedAt = Date.now();

      logger.info(`工作流执行完成: ${workflow.name}`, {
        executionId: execution.id,
      });

      return execution.context;
    } catch (error: any) {
      execution.status = 'failed';
      workflow.status = 'active';
      execution.completedAt = Date.now();

      this.addLog(execution, execution.currentNode, 'failed', error.message);

      logger.error(`工作流执行失败: ${error.message}`, {
        workflowId,
        executionId: execution.id,
      });

      throw error;
    }
  }

  /**
   * 执行节点
   */
  private async executeNode(
    workflow: Workflow,
    execution: WorkflowExecution,
    node: WorkflowNode
  ): Promise<void> {
    execution.currentNode = node.id;
    this.addLog(execution, node.id, 'started', `执行节点: ${node.name}`);

    try {
      switch (node.type) {
        case 'trigger':
          // 触发器：继续执行下一个节点
          await this.executeNext(workflow, execution, node);
          break;

        case 'action':
          // 动作：执行具体操作
          await this.executeAction(workflow, execution, node);
          break;

        case 'condition':
          // 条件：根据条件分支
          await this.executeCondition(workflow, execution, node);
          break;

        case 'loop':
          // 循环：重复执行
          await this.executeLoop(workflow, execution, node);
          break;

        case 'delay':
          // 延迟：等待指定时间
          await this.executeDelay(workflow, execution, node);
          break;
      }

      this.addLog(execution, node.id, 'completed');
    } catch (error: any) {
      this.addLog(execution, node.id, 'failed', error.message);

      // 错误处理
      if (node.onError) {
        const errorNode = workflow.nodes.get(node.onError);
        if (errorNode) {
          await this.executeNode(workflow, execution, errorNode);
          return;
        }
      }

      throw error;
    }
  }

  /**
   * 执行动作节点
   */
  private async executeAction(
    workflow: Workflow,
    execution: WorkflowExecution,
    node: WorkflowNode
  ): Promise<void> {
    const handler = this.actionHandlers.get(node.config.action);
    if (!handler) {
      throw new Error(`动作处理器不存在: ${node.config.action}`);
    }

    const result = await handler(node.config.params, execution.context);
    execution.context[node.id] = result;

    await this.executeNext(workflow, execution, node);
  }

  /**
   * 执行条件节点
   */
  private async executeCondition(
    workflow: Workflow,
    execution: WorkflowExecution,
    node: WorkflowNode
  ): Promise<void> {
    const condition = this.evaluateCondition(node.config.condition, execution.context);
    const nextNode = condition ? node.next?.[0] : node.next?.[1];

    if (nextNode) {
      const next = workflow.nodes.get(nextNode);
      if (next) {
        await this.executeNode(workflow, execution, next);
      }
    }
  }

  /**
   * 执行循环节点
   */
  private async executeLoop(
    workflow: Workflow,
    execution: WorkflowExecution,
    node: WorkflowNode
  ): Promise<void> {
    const items = execution.context[node.config.itemsPath] || [];
    const bodyNodeId = node.next?.[0];

    if (!bodyNodeId) return;

    const bodyNode = workflow.nodes.get(bodyNodeId);
    if (!bodyNode) return;

    for (let i = 0; i < items.length; i++) {
      execution.context.loopItem = items[i];
      execution.context.loopIndex = i;
      await this.executeNode(workflow, execution, bodyNode);
    }

    // 循环完成后继续
    if (node.next?.[1]) {
      const nextNode = workflow.nodes.get(node.next[1]);
      if (nextNode) {
        await this.executeNode(workflow, execution, nextNode);
      }
    }
  }

  /**
   * 执行延迟节点
   */
  private async executeDelay(
    workflow: Workflow,
    execution: WorkflowExecution,
    node: WorkflowNode
  ): Promise<void> {
    const delayMs = node.config.duration || 1000;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await this.executeNext(workflow, execution, node);
  }

  /**
   * 执行下一个节点
   */
  private async executeNext(
    workflow: Workflow,
    execution: WorkflowExecution,
    node: WorkflowNode
  ): Promise<void> {
    if (node.next && node.next.length > 0) {
      for (const nextNodeId of node.next) {
        const nextNode = workflow.nodes.get(nextNodeId);
        if (nextNode) {
          await this.executeNode(workflow, execution, nextNode);
        }
      }
    }
  }

  /**
   * 评估条件
   */
  private evaluateCondition(condition: string, context: any): boolean {
    try {
      // 简单的条件评估（实际应使用安全解析器）
      return eval(condition);
    } catch {
      return false;
    }
  }

  /**
   * 添加执行日志
   */
  private addLog(
    execution: WorkflowExecution,
    nodeId: string,
    status: ExecutionLog['status'],
    message?: string
  ): void {
    const node = this.workflows
      .get(execution.workflowId)
      ?.nodes.get(nodeId);

    execution.logs.push({
      nodeId,
      nodeName: node?.name || nodeId,
      status,
      timestamp: Date.now(),
      message,
    });
  }

  /**
   * 获取工作流
   */
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * 获取执行记录
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * 获取所有工作流
   */
  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 工作流Hook
 */
export function useWorkflow() {
  const engineRef = React.useRef<WorkflowEngine>(new WorkflowEngine());

  const createWorkflow = (
    name: string,
    description: string,
    nodes: WorkflowNode[]
  ) => {
    return engineRef.current.createWorkflow(name, description, nodes);
  };

  const executeWorkflow = async (workflowId: string, context?: any) => {
    return await engineRef.current.execute(workflowId, context);
  };

  const registerAction = (actionType: string, handler: Function) => {
    engineRef.current.registerAction(actionType, handler);
  };

  const getWorkflow = (workflowId: string) => {
    return engineRef.current.getWorkflow(workflowId);
  };

  const getExecution = (executionId: string) => {
    return engineRef.current.getExecution(executionId);
  };

  const getAllWorkflows = () => {
    return engineRef.current.getAllWorkflows();
  };

  return {
    createWorkflow,
    executeWorkflow,
    registerAction,
    getWorkflow,
    getExecution,
    getAllWorkflows,
  };
}

// 添加React导入
import React from 'react';
