/**
 * Code Plan界面 - 代码规划助手
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  List,
  Chip,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { codePlanService } from '@/services/codePlanService';
import { AI_MODELS, getCodePlanModels, AIModelConfig } from '@/config/aiModels';

interface CodePlanStep {
  step: number;
  action: string;
  description: string;
  code?: string;
  estimated_time?: string;
}

export const CodePlanScreen: React.FC = () => {
  const [task, setTask] = useState('');
  const [selectedModel, setSelectedModel] = useState<AIModelConfig | null>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [executingStep, setExecutingStep] = useState<number | null>(null);

  const { currentUser } = useSelector((state: RootState) => state.user);
  const codePlanModels = getCodePlanModels();

  useEffect(() => {
    // 设置默认模型
    if (codePlanModels.length > 0) {
      setSelectedModel(codePlanModels[0]);
    }
  }, []);

  const handleGeneratePlan = async () => {
    if (!task.trim()) {
      Alert.alert('提示', '请输入任务描述');
      return;
    }

    if (!selectedModel) {
      Alert.alert('提示', '请选择模型');
      return;
    }

    setLoading(true);
    try {
      const result = await codePlanService.generatePlan(task, selectedModel);
      setPlan(result);
    } catch (error: any) {
      Alert.alert('错误', error.message || '生成规划失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteStep = async (step: CodePlanStep) => {
    setExecutingStep(step.step);
    try {
      const code = await codePlanService.executeStep(
        step,
        task,
        selectedModel!
      );
      
      Alert.alert(
        '代码已生成',
        '代码实现已完成',
        [
          {
            text: '查看代码',
            onPress: () => {
              // 显示生成的代码
              Alert.alert('生成的代码', code);
            },
          },
          { text: '关闭' }
        ]
      );
    } catch (error: any) {
      Alert.alert('错误', error.message || '执行步骤失败');
    } finally {
      setExecutingStep(null);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 模型选择 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>🤖 选择模型</Text>
          <Text style={styles.hint}>
            只有支持Code Plan的模型才能使用此功能
          </Text>
          
          <View style={styles.modelList}>
            {codePlanModels.map((model) => (
              <Chip
                key={model.id}
                selected={selectedModel?.id === model.id}
                onPress={() => setSelectedModel(model)}
                style={styles.modelChip}
              >
                {model.name}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* 任务输入 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>📝 任务描述</Text>
          
          <TextInput
            mode="outlined"
            placeholder="描述你想要实现的功能..."
            value={task}
            onChangeText={setTask}
            multiline
            numberOfLines={4}
            style={styles.input}
          />
          
          <Button
            mode="contained"
            onPress={handleGeneratePlan}
            loading={loading}
            disabled={loading || !task.trim()}
            style={styles.button}
          >
            生成代码规划
          </Button>
        </Card.Content>
      </Card>

      {/* 规划结果 */}
      {plan && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>📋 实现规划</Text>
            
            <View style={styles.planMeta}>
              <Text>总步骤: {plan.total_steps}</Text>
              <Text>预计时间: {plan.estimated_time}</Text>
            </View>

            {plan.dependencies && plan.dependencies.length > 0 && (
              <View style={styles.dependencies}>
                <Text style={styles.label}>依赖:</Text>
                {plan.dependencies.map((dep: string, index: number) => (
                  <Chip key={index} style={styles.depChip}>{dep}</Chip>
                ))}
              </View>
            )}

            <Divider style={styles.divider} />

            {plan.steps.map((step: CodePlanStep) => (
              <List.Accordion
                key={step.step}
                title={`步骤 ${step.step}: ${step.action}`}
                description={step.estimated_time}
                left={props => (
                  <List.Icon {...props} icon={`numeric-${step.step}-circle`} />
                )}
              >
                <View style={styles.stepContent}>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                  
                  {step.code && (
                    <View style={styles.codeBlock}>
                      <Text style={styles.codeText}>{step.code}</Text>
                    </View>
                  )}
                  
                  <Button
                    mode="outlined"
                    onPress={() => handleExecuteStep(step)}
                    loading={executingStep === step.step}
                    disabled={executingStep !== null}
                    style={styles.executeButton}
                  >
                    执行此步骤
                  </Button>
                </View>
              </List.Accordion>
            ))}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    margin: 16,
    marginTop: 0,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  modelList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modelChip: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  planMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dependencies: {
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  depChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  divider: {
    marginVertical: 12,
  },
  stepContent: {
    padding: 16,
  },
  stepDescription: {
    marginBottom: 12,
    lineHeight: 20,
  },
  codeBlock: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  executeButton: {
    marginTop: 8,
  },
});
