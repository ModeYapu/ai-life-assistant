/**
 * 增强型AI服务
 * 整合记忆、画像、Agent和工作流
 */

import { VectorMemory, Memory } from './VectorMemory';
import { UserProfileManager } from './UserProfileManager';
import { AgentExecutor } from './AgentExecutor';
import { ToolRegistry, BuiltinTools } from './ToolRegistry';
import { WorkflowEngine, WorkflowNode } from './WorkflowEngine';
import { logger } from '@/utils/logger';

export interface EnhancedAIConfig {
  userId: string;
  enableMemory: boolean;
  enableProfile: boolean;
  enableAgent: boolean;
  enableWorkflow: boolean;
}

/**
 * 增强型AI服务
 */
export class EnhancedAIService {
  private memory: VectorMemory;
  private profileManager: UserProfileManager;
  private toolRegistry: ToolRegistry;
  private agentExecutor: AgentExecutor;
  private workflowEngine: WorkflowEngine;
  private config: EnhancedAIConfig;

  constructor(config: EnhancedAIConfig) {
    this.config = config;
    this.memory = new VectorMemory(config.userId);
    this.profileManager = new UserProfileManager();
    this.toolRegistry = new ToolRegistry();
    this.agentExecutor = new AgentExecutor(this.toolRegistry);
    this.workflowEngine = new WorkflowEngine();

    // 注册内置工具
    BuiltinTools.registerAll(this.toolRegistry);

    // 注册自定义工具
    this.registerCustomTools();

    logger.info('增强型AI服务初始化完成', { config });
  }

  /**
   * 注册自定义工具
   */
  private registerCustomTools(): void {
    // 记忆存储工具
    this.toolRegistry.register(
      'store_memory',
      '存储记忆到向量数据库',
      [
        {
          name: 'content',
          type: 'string',
          required: true,
          description: '记忆内容',
        },
        {
          name: 'type',
          type: 'string',
          required: false,
          description: '记忆类型',
        },
      ],
      async (params) => {
        const id = await this.memory.store(
          params.content,
          params.type || 'note'
        );
        return { success: true, memoryId: id };
      }
    );

    // 记忆搜索工具
    this.toolRegistry.register(
      'search_memory',
      '搜索历史记忆',
      [
        {
          name: 'query',
          type: 'string',
          required: true,
          description: '搜索查询',
        },
        {
          name: 'topK',
          type: 'number',
          required: false,
          description: '返回结果数量',
        },
      ],
      async (params) => {
        const results = await this.memory.search(params.query, params.topK || 5);
        return {
          success: true,
          results: results.map((r) => ({
            content: r.memory.content,
            score: r.score,
            type: r.memory.metadata.type,
          })),
        };
      }
    );

    // 用户偏好更新工具
    this.toolRegistry.register(
      'update_preference',
      '更新用户偏好',
      [
        {
          name: 'category',
          type: 'string',
          required: true,
          description: '偏好类别',
        },
        {
          name: 'value',
          type: 'string',
          required: true,
          description: '偏好值',
        },
      ],
      async (params) => {
        this.profileManager.updatePreference(
          this.config.userId,
          params.category,
          params.value
        );
        return { success: true };
      }
    );

    logger.info('自定义工具注册完成');
  }

  /**
   * 增强型对话
   */
  async chat(message: string): Promise<string> {
    // 1. 获取上下文
    const context = await this.memory.getContext(message, 1000);

    // 2. 获取用户画像
    const profile = this.profileManager.getProfile(this.config.userId);

    // 3. 记录用户行为
    this.profileManager.recordBehavior(this.config.userId, 'chat', 'send_message');

    // 4. 构建增强提示
    const enhancedPrompt = this.buildEnhancedPrompt(message, context, profile);

    logger.info('增强对话', {
      userId: this.config.userId,
      message,
      contextLength: context.length,
    });

    // 5. 调用AI模型（这里返回模拟响应）
    const response = await this.callAI(enhancedPrompt);

    // 6. 存储对话记忆
    await this.memory.store(`用户: ${message}`, 'conversation');
    await this.memory.store(`助手: ${response}`, 'conversation');

    return response;
  }

  /**
   * 构建增强提示
   */
  private buildEnhancedPrompt(
    message: string,
    context: string,
    profile: any
  ): string {
    let prompt = '';

    // 添加用户画像
    if (this.config.enableProfile) {
      const preferences = Array.from(profile.preferences.entries())
        .map(([key, pref]: [string, any]) => `${key}: ${pref.value}`)
        .join(', ');

      prompt += `用户画像:\n- 沟通风格: ${profile.communicationStyle.tone}\n`;
      if (preferences) {
        prompt += `- 偏好: ${preferences}\n`;
      }
      prompt += '\n';
    }

    // 添加上下文
    if (this.config.enableMemory && context) {
      prompt += `历史上下文:\n${context}\n\n`;
    }

    // 添加当前消息
    prompt += `用户消息: ${message}`;

    return prompt;
  }

  /**
   * 调用AI模型（模拟）
   */
  private async callAI(prompt: string): Promise<string> {
    // 实际应接入真实的AI API
    logger.info('调用AI模型', { promptLength: prompt.length });

    // 模拟响应
    await new Promise((resolve) => setTimeout(resolve, 500));

    return `这是基于你的个性化记忆和偏好的回复。我已经考虑了你的历史对话和偏好设置。`;
  }

  /**
   * 自动执行任务
   */
  async autoExecute(goal: string): Promise<any> {
    if (!this.config.enableAgent) {
      throw new Error('Agent功能未启用');
    }

    logger.info('自动执行任务', { goal, userId: this.config.userId });

    // 创建并执行任务
    const task = this.agentExecutor.createTask(goal);
    const result = await this.agentExecutor.execute(task.id);

    // 存储执行记录
    await this.memory.store(
      `自动执行: ${goal} - 结果: ${JSON.stringify(result)}`,
      'task'
    );

    return result;
  }

  /**
   * 创建自动化工作流
   */
  createAutomation(
    name: string,
    description: string,
    nodes: WorkflowNode[]
  ): string {
    if (!this.config.enableWorkflow) {
      throw new Error('工作流功能未启用');
    }

    const workflow = this.workflowEngine.createWorkflow(name, description, nodes);
    logger.info('创建自动化工作流', { name, workflowId: workflow.id });

    return workflow.id;
  }

  /**
   * 执行工作流
   */
  async runWorkflow(workflowId: string, context?: any): Promise<any> {
    if (!this.config.enableWorkflow) {
      throw new Error('工作流功能未启用');
    }

    logger.info('执行工作流', { workflowId });

    const result = await this.workflowEngine.execute(workflowId, context);

    // 存储执行记录
    await this.memory.store(
      `执行工作流: ${workflowId}`,
      'task',
      { workflowId }
    );

    return result;
  }

  /**
   * 获取个性化建议
   */
  getPersonalizedSuggestions(): string[] {
    return this.profileManager.getPersonalizedSuggestions(this.config.userId);
  }

  /**
   * 搜索记忆
   */
  async searchMemories(query: string, topK?: number) {
    return await this.memory.search(query, topK);
  }

  /**
   * 获取用户画像
   */
  getUserProfile() {
    return this.profileManager.getProfile(this.config.userId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks() {
    return this.agentExecutor.getAllTasks();
  }

  /**
   * 获取所有工作流
   */
  getAllWorkflows() {
    return this.workflowEngine.getAllWorkflows();
  }
}

/**
 * 创建增强型AI服务实例
 */
export function createEnhancedAI(userId: string, config?: Partial<EnhancedAIConfig>) {
  return new EnhancedAIService({
    userId,
    enableMemory: true,
    enableProfile: true,
    enableAgent: true,
    enableWorkflow: true,
    ...config,
  });
}
