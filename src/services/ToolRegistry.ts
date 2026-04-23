/**
 * 工具注册表
 * Agent可调用的工具管理
 */

import { logger } from '@/utils/logger';

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  handler: (params: any) => Promise<any>;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
}

/**
 * 工具注册表
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * 注册工具
   */
  register(
    name: string,
    description: string,
    parameters: ToolParameter[],
    handler: (params: any) => Promise<any>
  ): void {
    this.tools.set(name, {
      name,
      description,
      parameters,
      handler,
    });
    logger.info(`注册工具: ${name}`);
  }

  /**
   * 快速注册（简化版）
   */
  registerSimple(name: string, handler: (params: any) => Promise<any>): void {
    this.tools.set(name, {
      name,
      description: `工具: ${name}`,
      parameters: [],
      handler,
    });
    logger.info(`注册简化工具: ${name}`);
  }

  /**
   * 检查工具是否存在
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * 获取工具
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * 执行工具
   */
  async execute(name: string, params: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`工具不存在: ${name}`);
    }

    // 参数验证
    this.validateParameters(tool, params);

    logger.info(`执行工具: ${name}`, { params });

    try {
      const result = await tool.handler(params);
      logger.info(`工具执行成功: ${name}`, { result });
      return result;
    } catch (error: any) {
      logger.error(`工具执行失败: ${name}`, { error: error.message });
      throw error;
    }
  }

  /**
   * 获取所有工具
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 获取工具描述（用于LLM）
   */
  getToolDescriptions(): string {
    const descriptions = Array.from(this.tools.values()).map((tool) => {
      const params = tool.parameters
        .map((p) => `  - ${p.name} (${p.type}${p.required ? ', required' : ''}): ${p.description}`)
        .join('\n');

      return `${tool.name}: ${tool.description}\n参数:\n${params || '  无'}`;
    });

    return descriptions.join('\n\n');
  }

  /**
   * 验证参数
   */
  private validateParameters(tool: Tool, params: any): void {
    for (const param of tool.parameters) {
      if (param.required && !(param.name in params)) {
        throw new Error(`缺少必需参数: ${param.name}`);
      }

      if (param.name in params) {
        const value = params[param.name];
        const type = typeof value;

        if (param.type === 'array' && !Array.isArray(value)) {
          throw new Error(`参数类型错误: ${param.name} 应为数组`);
        }

        if (param.type !== 'array' && type !== param.type) {
          throw new Error(
            `参数类型错误: ${param.name} 应为 ${param.type}, 实际为 ${type}`
          );
        }
      }
    }
  }
}

/**
 * 内置工具集合
 */
export class BuiltinTools {
  /**
   * 获取所有内置工具
   */
  static registerAll(registry: ToolRegistry): void {
    // 搜索工具
    registry.register(
      'search',
      '搜索信息',
      [
        {
          name: 'query',
          type: 'string',
          required: true,
          description: '搜索关键词',
        },
      ],
      async (params) => {
        // 实际应接入搜索API
        logger.info(`搜索: ${params.query}`);
        return {
          results: [`搜索结果: ${params.query}`],
          total: 1,
        };
      }
    );

    // 创建任务工具
    registry.register(
      'create_task',
      '创建新任务',
      [
        {
          name: 'title',
          type: 'string',
          required: true,
          description: '任务标题',
        },
        {
          name: 'description',
          type: 'string',
          required: false,
          description: '任务描述',
        },
      ],
      async (params) => {
        logger.info(`创建任务: ${params.title}`);
        return {
          success: true,
          taskId: `task_${Date.now()}`,
          title: params.title,
        };
      }
    );

    // 发送消息工具
    registry.register(
      'send_message',
      '发送消息',
      [
        {
          name: 'recipient',
          type: 'string',
          required: true,
          description: '接收者',
        },
        {
          name: 'content',
          type: 'string',
          required: true,
          description: '消息内容',
        },
      ],
      async (params) => {
        logger.info(`发送消息给 ${params.recipient}: ${params.content}`);
        return {
          success: true,
          messageId: `msg_${Date.now()}`,
          sentAt: new Date().toISOString(),
        };
      }
    );

    // 数据分析工具
    registry.register(
      'analyze_data',
      '分析数据',
      [
        {
          name: 'data',
          type: 'object',
          required: true,
          description: '待分析数据',
        },
        {
          name: 'type',
          type: 'string',
          required: false,
          description: '分析类型 (statistical|trend|comparison)',
        },
      ],
      async (params) => {
        logger.info(`分析数据: ${params.type || 'statistical'}`);
        return {
          analysis: '数据分析结果',
          insights: ['洞察1', '洞察2'],
          recommendations: ['建议1', '建议2'],
        };
      }
    );

    // 日程管理工具
    registry.register(
      'schedule_event',
      '安排日程',
      [
        {
          name: 'title',
          type: 'string',
          required: true,
          description: '事件标题',
        },
        {
          name: 'datetime',
          type: 'string',
          required: true,
          description: '日期时间',
        },
        {
          name: 'duration',
          type: 'number',
          required: false,
          description: '持续时间（分钟）',
        },
      ],
      async (params) => {
        logger.info(`安排日程: ${params.title} at ${params.datetime}`);
        return {
          success: true,
          eventId: `event_${Date.now()}`,
          title: params.title,
          datetime: params.datetime,
        };
      }
    );

    // 文件操作工具
    registry.register(
      'read_file',
      '读取文件',
      [
        {
          name: 'path',
          type: 'string',
          required: true,
          description: '文件路径',
        },
      ],
      async (params) => {
        logger.info(`读取文件: ${params.path}`);
        return {
          success: true,
          content: '文件内容...',
          path: params.path,
        };
      }
    );

    registry.register(
      'write_file',
      '写入文件',
      [
        {
          name: 'path',
          type: 'string',
          required: true,
          description: '文件路径',
        },
        {
          name: 'content',
          type: 'string',
          required: true,
          description: '文件内容',
        },
      ],
      async (params) => {
        logger.info(`写入文件: ${params.path}`);
        return {
          success: true,
          path: params.path,
          bytesWritten: params.content.length,
        };
      }
    );

    // 网络请求工具
    registry.register(
      'http_request',
      '发送HTTP请求',
      [
        {
          name: 'url',
          type: 'string',
          required: true,
          description: '请求URL',
        },
        {
          name: 'method',
          type: 'string',
          required: false,
          description: '请求方法 (GET|POST|PUT|DELETE)',
        },
        {
          name: 'data',
          type: 'object',
          required: false,
          description: '请求数据',
        },
      ],
      async (params) => {
        logger.info(`HTTP请求: ${params.method || 'GET'} ${params.url}`);
        return {
          success: true,
          status: 200,
          data: { message: '响应数据' },
        };
      }
    );

    logger.info('注册内置工具完成');
  }
}
