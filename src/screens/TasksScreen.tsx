/**
 * 任务列表页面
 */

import React, { useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, Card, Checkbox, IconButton, FAB, Badge } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState } from '@/store';
import { loadTasks, updateTask, deleteTask, selectFilteredTasks } from '@/store/slices/tasksSlice';
import { Task, TaskPriority } from '@/types';
import { format } from 'date-fns';

type NavigationProp = StackNavigationProp<any>;

export const TasksScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();
  const { loading, filter } = useSelector((state: RootState) => state.tasks);
  const tasks = useSelector(selectFilteredTasks);

  useEffect(() => {
    dispatch(loadTasks());
  }, []);

  const handleToggleComplete = async (task: Task) => {
    const updatedTask = {
      ...task,
      status: task.status === 'completed' ? 'pending' : 'completed',
      completedAt: task.status === 'completed' ? undefined : Date.now(),
    } as Task;
    
    await dispatch(updateTask(updatedTask));
  };

  const handleDeleteTask = async (taskId: string) => {
    await dispatch(deleteTask(taskId));
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return '#F44336';
      case 'high':
        return '#FF9800';
      case 'medium':
        return '#2196F3';
      case 'low':
        return '#4CAF50';
      default:
        return '#9E9E9E';
    }
  };

  const renderTask = ({ item }: { item: Task }) => {
    const isOverdue = item.dueDate && item.dueDate < Date.now() && item.status !== 'completed';
    
    return (
      <Card
        style={[styles.taskCard, isOverdue && styles.overdueCard]}
        onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.taskHeader}>
            <Checkbox
              status={item.status === 'completed' ? 'checked' : 'unchecked'}
              onPress={() => handleToggleComplete(item)}
            />
            <View style={styles.taskInfo}>
              <Text
                style={[
                  styles.taskTitle,
                  item.status === 'completed' && styles.completedText,
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {item.dueDate && (
                <Text style={[styles.dueDate, isOverdue && styles.overdueText]}>
                  📅 {format(item.dueDate, 'MM/dd HH:mm')}
                </Text>
              )}
            </View>
            <View style={styles.taskActions}>
              <Badge
                style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(item.priority) },
                ]}
              >
                {item.priority}
              </Badge>
              <IconButton
                icon="delete"
                size={20}
                onPress={() => handleDeleteTask(item.id)}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const pendingCount = tasks.filter(t => t.status !== 'completed').length;

  return (
    <View style={styles.container}>
      {/* 统计信息 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>待完成</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{completedCount}</Text>
          <Text style={styles.statLabel}>已完成</Text>
        </View>
      </View>

      {/* 任务列表 */}
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => dispatch(loadTasks())}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无任务</Text>
            <Text style={styles.emptyHint}>点击右下角按钮创建新任务</Text>
          </View>
        }
      />

      {/* 创建任务按钮 */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('TaskDetail', { taskId: 'new' })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
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
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  taskCard: {
    marginBottom: 12,
    elevation: 2,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
    marginLeft: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  overdueText: {
    color: '#F44336',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
  },
  emptyHint: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200EE',
  },
});
