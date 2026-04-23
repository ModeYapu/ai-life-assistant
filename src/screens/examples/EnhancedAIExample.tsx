/**
 * 增强型AI使用示例
 * 展示记忆、画像、Agent和工作流的完整使用
 */

import React from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import { createEnhancedAI } from '@/services/EnhancedAIService';
import { WorkflowNode } from '@/services/WorkflowEngine';

export const EnhancedAIExample: React.FC = () => {
  const [ai] = React.useState(() => createEnhancedAI('user_001'));
  const [output, setOutput] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  const addOutput = (message: string) => {
    setOutput((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  /**
   * 示例1: 增强型对话
   */
  const testEnhancedChat = async () => {
    setLoading(true);
    addOutput('=== 测试增强型对话 ===');

    try {
      // 第一次对话
      const response1 = await ai.chat('我喜欢简洁的回复，不要太啰嗦');
      addOutput(`助手: ${response1}`);

      // 第二次对话（会记住用户偏好）
      const response2 = await ai.chat('给我推荐一些学习资源');
      addOutput(`助手: ${response2}`);

      // 第三次对话（会记住历史上下文）
      const response3 = await ai.chat('刚才你推荐的资源里，哪个最适合初学者？');
      addOutput(`助手: ${response3}`);

      addOutput('✅ 增强型对话测试完成');
    } catch (error: any) {
      addOutput(`❌ 错误: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 示例2: 记忆搜索
   */
  const testMemorySearch = async () => {
    setLoading(true);
    addOutput('=== 测试记忆搜索 ===');

    try {
      // 搜索历史对话
      const results = await ai.searchMemories('学习资源', 3);

      results.forEach((result, index) => {
        addOutput(`结果${index + 1}: ${result.memory.content.substring(0, 50)}...`);
        addOutput(`  相似度: ${(result.score * 100).toFixed(1)}%`);
      });

      addOutput('✅ 记忆搜索测试完成');
    } catch (error: any) {
      addOutput(`❌ 错误: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 示例3: 用户画像
   */
  const testUserProfile = async () => {
    setLoading(true);
    addOutput('=== 测试用户画像 ===');

    try {
      const profile = ai.getUserProfile();

      addOutput(`用户ID: ${profile.userId}`);
      addOutput(`创建时间: ${new Date(profile.createdAt).toLocaleString()}`);
      addOutput(`沟通风格: ${profile.communicationStyle.tone}`);
      addOutput(`偏好数量: ${profile.preferences.size}`);
      addOutput(`兴趣标签: ${profile.interests.join(', ') || '暂无'}`);

      // 获取个性化建议
      const suggestions = ai.getPersonalizedSuggestions();
      addOutput('\n个性化建议:');
      suggestions.forEach((suggestion, index) => {
        addOutput(`${index + 1}. ${suggestion}`);
      });

      addOutput('✅ 用户画像测试完成');
    } catch (error: any) {
      addOutput(`❌ 错误: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 示例4: 自动执行任务
   */
  const testAutoExecute = async () => {
    setLoading(true);
    addOutput('=== 测试自动执行 ===');

    try {
      // 任务1: 搜索信息
      addOutput('任务1: 搜索最新的AI资讯');
      const result1 = await ai.autoExecute('搜索最新的AI资讯');
      addOutput(`结果: ${JSON.stringify(result1)}`);

      // 任务2: 创建任务
      addOutput('\n任务2: 创建学习任务');
      const result2 = await ai.autoExecute('创建一个学习React Native的任务');
      addOutput(`结果: ${JSON.stringify(result2)}`);

      // 任务3: 数据分析
      addOutput('\n任务3: 分析用户数据');
      const result3 = await ai.autoExecute('分析最近一周的用户行为数据');
      addOutput(`结果: ${JSON.stringify(result3)}`);

      // 查看所有任务
      addOutput('\n所有任务:');
      const tasks = ai.getAllTasks();
      tasks.forEach((task, index) => {
        addOutput(`${index + 1}. ${task.goal} - ${task.status}`);
      });

      addOutput('✅ 自动执行测试完成');
    } catch (error: any) {
      addOutput(`❌ 错误: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 示例5: 工作流自动化
   */
  const testWorkflow = async () => {
    setLoading(true);
    addOutput('=== 测试工作流自动化 ===');

    try {
      // 创建工作流节点
      const nodes: WorkflowNode[] = [
        {
          id: 'trigger_1',
          type: 'trigger',
          name: '每日触发',
          config: { schedule: '0 9 * * *' },
          next: ['action_1'],
        },
        {
          id: 'action_1',
          type: 'action',
          name: '收集新闻',
          config: {
            action: 'search',
            params: { query: '最新科技新闻' },
          },
          next: ['action_2'],
        },
        {
          id: 'action_2',
          type: 'action',
          name: '发送摘要',
          config: {
            action: 'send_message',
            params: {
              recipient: 'user',
              content: '每日新闻摘要',
            },
          },
        },
      ];

      // 创建工作流
      const workflowId = ai.createAutomation(
        '每日新闻推送',
        '每天早上9点自动推送最新科技新闻',
        nodes
      );

      addOutput(`创建工作流: ${workflowId}`);

      // 执行工作流
      addOutput('\n执行工作流...');
      const result = await ai.runWorkflow(workflowId, {
        date: new Date().toISOString(),
      });

      addOutput(`执行结果: ${JSON.stringify(result, null, 2)}`);

      // 查看所有工作流
      addOutput('\n所有工作流:');
      const workflows = ai.getAllWorkflows();
      workflows.forEach((wf, index) => {
        addOutput(`${index + 1}. ${wf.name} - ${wf.status}`);
      });

      addOutput('✅ 工作流自动化测试完成');
    } catch (error: any) {
      addOutput(`❌ 错误: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 示例6: 完整场景 - 智能助手
   */
  const testCompleteScenario = async () => {
    setLoading(true);
    addOutput('=== 完整场景测试 ===');

    try {
      // 场景1: 用户说喜欢简洁回复
      addOutput('场景1: 学习用户偏好');
      await ai.chat('我喜欢简洁直接的回复，不要太啰嗦');
      addOutput('✓ 已记录用户偏好');

      // 场景2: 自动执行任务
      addOutput('\n场景2: 自动执行任务');
      await ai.autoExecute('帮我创建一个明天上午10点的会议提醒');
      addOutput('✓ 任务已自动执行');

      // 场景3: 记忆检索
      addOutput('\n场景3: 记忆检索');
      const memories = await ai.searchMemories('会议', 3);
      addOutput(`找到 ${memories.length} 条相关记忆`);

      // 场景4: 个性化建议
      addOutput('\n场景4: 个性化建议');
      const suggestions = ai.getPersonalizedSuggestions();
      addOutput(`生成 ${suggestions.length} 条建议`);

      // 场景5: 工作流自动化
      addOutput('\n场景5: 创建自动化工作流');
      const nodes: WorkflowNode[] = [
        {
          id: 'trigger_daily',
          type: 'trigger',
          name: '每日触发',
          config: {},
          next: ['action_summarize'],
        },
        {
          id: 'action_summarize',
          type: 'action',
          name: '生成每日摘要',
          config: {
            action: 'analyze_data',
            params: { type: 'daily_summary' },
          },
        },
      ];

      const workflowId = ai.createAutomation(
        '每日摘要',
        '自动生成每日活动摘要',
        nodes
      );
      addOutput(`✓ 工作流已创建: ${workflowId}`);

      addOutput('\n✅ 完整场景测试完成');
      addOutput('\n📊 功能统计:');
      addOutput(`- 对话记忆: ${ai.searchMemories('', 100).length} 条`);
      addOutput(`- 用户偏好: ${ai.getUserProfile().preferences.size} 个`);
      addOutput(`- 执行任务: ${ai.getAllTasks().length} 个`);
      addOutput(`- 工作流: ${ai.getAllWorkflows().length} 个`);
    } catch (error: any) {
      addOutput(`❌ 错误: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>增强型AI助手示例</Text>

      <View style={styles.buttonContainer}>
        <Button
          title="1. 增强型对话"
          onPress={testEnhancedChat}
          disabled={loading}
        />
        <Button
          title="2. 记忆搜索"
          onPress={testMemorySearch}
          disabled={loading}
        />
        <Button
          title="3. 用户画像"
          onPress={testUserProfile}
          disabled={loading}
        />
        <Button
          title="4. 自动执行"
          onPress={testAutoExecute}
          disabled={loading}
        />
        <Button
          title="5. 工作流"
          onPress={testWorkflow}
          disabled={loading}
        />
        <Button
          title="6. 完整场景"
          onPress={testCompleteScenario}
          disabled={loading}
          color="#6200EE"
        />
      </View>

      <View style={styles.outputContainer}>
        <Text style={styles.outputTitle}>输出日志:</Text>
        {output.map((line, index) => (
          <Text key={index} style={styles.outputLine}>
            {line}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  outputContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    minHeight: 200,
  },
  outputTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  outputLine: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    color: '#333',
  },
});
