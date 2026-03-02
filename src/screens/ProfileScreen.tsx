/**
 * 个人中心页面 - 免登录版本
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Text,
  Card,
  List,
  Avatar,
  ProgressBar,
  Divider,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../store';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { conversations } = useSelector((state: RootState) => state.ai);

  // 统计数据
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const totalMessages = conversations.reduce(
    (sum, conv) => sum + conv.messages.length,
    0
  );

  return (
    <ScrollView style={styles.container}>
      {/* 应用信息卡片 */}
      <Card style={styles.userCard}>
        <Card.Content style={styles.userContent}>
          <Avatar.Icon
            size={80}
            icon="robot"
            style={styles.avatar}
          />
          <Text style={styles.appName}>AI Life Assistant</Text>
          <Text style={styles.appSlogan}>你的智能生活助手</Text>
        </Card.Content>
      </Card>

      {/* 使用统计 */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>使用统计</Text>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalMessages}</Text>
              <Text style={styles.statLabel}>对话次数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{completedTasks}</Text>
              <Text style={styles.statLabel}>完成任务</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{conversations.length}</Text>
              <Text style={styles.statLabel}>对话数</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.statTitle}>任务完成率</Text>
          <ProgressBar
            progress={completionRate}
            color="#6200EE"
            style={styles.progressBar}
          />
          <Text style={styles.progressText}>
            {completedTasks} / {totalTasks} 任务
          </Text>
        </Card.Content>
      </Card>

      {/* 功能列表 */}
      <List.Section>
        <List.Subheader>偏好设置</List.Subheader>

        <List.Item
          title="通知设置"
          left={(props) => <List.Icon {...props} icon="bell" />}
          onPress={() => {}}
        />

        <List.Item
          title="隐私设置"
          left={(props) => <List.Icon {...props} icon="shield" />}
          onPress={() => {}}
        />

        <List.Item
          title="语言"
          description="简体中文"
          left={(props) => <List.Icon {...props} icon="translate" />}
          onPress={() => {}}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>支持</List.Subheader>

        <List.Item
          title="帮助中心"
          left={(props) => <List.Icon {...props} icon="help" />}
          onPress={() => {}}
        />

        <List.Item
          title="反馈建议"
          left={(props) => <List.Icon {...props} icon="message-text" />}
          onPress={() => {}}
        />

        <List.Item
          title="给个好评"
          left={(props) => <List.Icon {...props} icon="star" />}
          onPress={() => {}}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>其他</List.Subheader>

        <List.Item
          title="设置"
          testID="profile-settings-entry"
          left={(props) => <List.Icon {...props} icon="cog" />}
          onPress={() => navigation.navigate('Settings' as never)}
        />

        <List.Item
          title="关于"
          description="版本 0.1.0"
          left={(props) => <List.Icon {...props} icon="information" />}
          onPress={() => {}}
        />
      </List.Section>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ by AI</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  userCard: {
    margin: 16,
    elevation: 4,
  },
  userContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    marginBottom: 16,
    backgroundColor: '#6200EE',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appSlogan: {
    fontSize: 14,
    color: '#666',
  },
  statsCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6200EE',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  statTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});
