/**
 * 代码规划服务 - Code Plan
 * 使用AI自动规划代码实现步骤
 */

import { AIService } from './aiService';
import { AIModelConfig } from '../config/aiModels';

interface CodePlanStep {
  step: number;
  action: string;
  description: string;
  code?: string;
  estimated_time?: string;
}

interface CodePlan {
  task: string;
  steps: CodePlanStep[];
  total_steps: number;
  estimated_time: string;
  dependencies: string[];
}

class CodePlanService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * 生成代码规划
   */
  async generatePlan(task: string, model: AIModelConfig): Promise<CodePlan> {
    if (!model.codePlan) {
      throw new Error('This model does not support Code Plan');
    }

    const prompt = `
You are an expert code planner. Given a coding task, break it down into clear, actionable steps.

Task: ${task}

Please provide a detailed plan with the following format:
1. Break down the task into 3-7 steps
2. For each step, provide:
   - Action: What needs to be done
   - Description: Detailed explanation
   - Estimated time: Rough time estimate
   - Code snippet (if applicable)

Format your response as JSON:
{
  "steps": [
    {
      "step": 1,
      "action": "Step name",
      "description": "Detailed description",
      "code": "Optional code snippet",
      "estimated_time": "5 minutes"
    }
  ],
  "total_steps": 3,
  "estimated_time": "15 minutes",
  "dependencies": ["list of dependencies"]
}
`;

    try {
      const response = await this.aiService.sendMessage({
        model: model.id,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        maxTokens: 2000,
      });

      // 解析JSON响应
      const plan = this.parsePlanResponse(response.content);
      return {
        task,
        ...plan,
      };
    } catch (error) {
      console.error('Failed to generate code plan:', error);
      throw error;
    }
  }

  /**
   * 执行代码规划步骤
   */
  async executeStep(
    step: CodePlanStep,
    context: string,
    model: AIModelConfig
  ): Promise<string> {
    const prompt = `
Context: ${context}

Current Step: ${step.action}
Description: ${step.description}

Please implement this step. Provide:
1. Complete, working code
2. Comments explaining the logic
3. Error handling where appropriate
`;

    const response = await this.aiService.sendMessage({
      model: model.id,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      maxTokens: 2000,
    });

    return response.content;
  }

  /**
   * 解析规划响应
   */
  private parsePlanResponse(content: string): Partial<CodePlan> {
    try {
      // 尝试提取JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // 如果没有JSON，返回默认结构
      return {
        steps: [
          {
            step: 1,
            action: 'Implement solution',
            description: content,
            estimated_time: '10 minutes',
          },
        ],
        total_steps: 1,
        estimated_time: '10 minutes',
        dependencies: [],
      };
    } catch (error) {
      console.error('Failed to parse plan response:', error);
      throw new Error('Invalid plan format');
    }
  }

  /**
   * 优化代码规划
   */
  async optimizePlan(
    plan: CodePlan,
    feedback: string,
    model: AIModelConfig
  ): Promise<CodePlan> {
    const prompt = `
Current Plan:
${JSON.stringify(plan, null, 2)}

Feedback: ${feedback}

Please optimize the plan based on the feedback. Consider:
1. More efficient approach
2. Better error handling
3. Code reusability
4. Performance improvements

Provide the optimized plan in the same JSON format.
`;

    const response = await this.aiService.sendMessage({
      model: model.id,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      maxTokens: 2000,
    });

    const optimizedPlan = this.parsePlanResponse(response.content);
    return {
      task: plan.task,
      ...optimizedPlan,
    };
  }
}

export const codePlanService = new CodePlanService();
