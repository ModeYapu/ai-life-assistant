/**
 * 首页
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Title style={styles.title}>AI Life Assistant</Title>
          <Paragraph style={styles.subtitle}>您的全能AI助手</Paragraph>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Title>🤖 AI对话</Title>
            <Paragraph>与AI助手聊天，获取帮助和建议</Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => navigation.navigate('Main')}>
              开始对话
            </Button>
          </Card.Actions>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>✅ 任务管理</Title>
            <Paragraph>管理您的待办事项，设置提醒</Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => navigation.navigate('Main')}>
              查看任务
            </Button>
          </Card.Actions>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>💻 代码开发</Title>
            <Paragraph>AI辅助编程，提高开发效率</Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button>即将推出</Button>
          </Card.Actions>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>🛒 购物助手</Title>
            <Paragraph>智能购物，价格监控</Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button>即将推出</Button>
          </Card.Actions>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <Title>📊 使用统计</Title>
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>对话次数</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>完成任务</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>节省时间</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => console.log('Quick action')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  statsCard: {
    marginTop: 24,
    elevation: 2,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200EE',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200EE',
  },
});
