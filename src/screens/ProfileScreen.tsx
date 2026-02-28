/**
 * 个人中心页面
 */

import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import {
  Text,
  Card,
  List,
  Avatar,
  Button,
  ProgressBar,
  Divider,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../store';
import { loadUser } from '../store/slices/userSlice';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { currentUser, isAuthenticated } = useSelector(
    (state: RootState) => state.user
  );
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { conversations } = useSelector((state: RootState) => state.ai);

  useEffect(() => {
    dispatch(loadUser());
  }, []);

  // 统计数据
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const totalMessages = conversations.reduce(
    (sum, conv) => sum + conv.messages.length,
    0
  );

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'free':
        return '免费版';
      case 'pro':
        return '专业版';
      case 'enterprise':
        return '企业版';
      default:
        return plan;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free':
        return '#9E9E9E';
      case 'pro':
        return '#6200EE';
      case 'enterprise':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 用户信息卡片 */}
      <Card style={styles.userCard}>
        <Card.Content style={styles.userContent}>
          <Avatar.Text
            size={80}
            label={currentUser?.name?.charAt(0) || 'U'}
            style={styles.avatar}
          />
          <Text style={styles.userName}>
            {currentUser?.name || '未登录'}
          </Text>
          {currentUser?.email && (
            <Text style={styles.userEmail}>{currentUser.email}</Text>
          )}
          <View
            style={[
              styles.planBadge,
              { backgroundColor: getPlanColor(currentUser?.subscription.plan || 'free') },
            ]}
          >
            <Text style={styles.planText}>
              {getPlanName(currentUser?.subscription.plan || 'free')}
            </Text>
          </View>
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
              <Text style={styles.statNumber}>0h</Text>
              <Text style={styles.statLabel}>节省时间</Text>
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
        <List.Subheader>账户</List.Subheader>
        
        <List.Item
          title="个人资料"
          left={(props) => <List.Icon {...props} icon="account-edit" />}
          onPress={() => {}}
        />
        
        <List.Item
          title="订阅管理"
          description="升级到专业版"
          left={(props) => <List.Icon {...props} icon="credit-card" />}
          onPress={() => {}}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>偏好设置</List.Subheader>
        
        <List.Item
          title="通知设置"
          left={(props) => <List.Icon {...props} icon="bell" />}
          onPress={() => {}}
        />
        
        <List.Item
          title="隐私设置"
          left={(props) => <List.Icon {...props} icon="shield-lock" />}
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
          left={(props) => <List.Icon {...props} icon="help-circle" />}
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

      {/* 登出按钮 */}
      <View style={styles.logoutContainer}>
        <Button
          mode="outlined"
          onPress={() => {}}
          style={styles.logoutButton}
          color="#F44336"
        >
          退出登录
        </Button>
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
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  planBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  planText: {
    color: '#FFF',
    fontWeight: 'bold',
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
  logoutContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  logoutButton: {
    borderColor: '#F44336',
  },
});
