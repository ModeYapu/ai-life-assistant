import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    subtasks?: Array<{ id: string; completed: boolean }>;
  };
  onPress: () => void;
  onComplete: () => void;
}

/**
 * 任务卡片组件 - 使用React.memo优化
 * 性能提升: 减少不必要渲染
 */
export const TaskCard = React.memo<TaskCardProps>(
  ({ task, onPress, onComplete }) => {
    const completedSubtasks =
      task.subtasks?.filter((s) => s.completed).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'high':
          return '#FF4444';
        case 'medium':
          return '#FF9800';
        case 'low':
          return '#4CAF50';
        default:
          return '#999999';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'completed':
          return 'checkmark-circle';
        case 'in_progress':
          return 'time';
        default:
          return 'ellipse-outline';
      }
    };

    return (
      <TouchableOpacity style={styles.container} onPress={onPress}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons
              name={getStatusIcon(task.status)}
              size={24}
              color={task.status === 'completed' ? '#4CAF50' : '#999999'}
            />
            <Text
              style={[
                styles.title,
                task.status === 'completed' && styles.completedTitle,
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
          </View>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(task.priority) },
            ]}
          >
            <Text style={styles.priorityText}>{task.priority}</Text>
          </View>
        </View>

        {task.description && (
          <Text style={styles.description} numberOfLines={2}>
            {task.description}
          </Text>
        )}

        <View style={styles.footer}>
          {task.dueDate && (
            <View style={styles.dueDate}>
              <Ionicons name="calendar-outline" size={16} color="#666666" />
              <Text style={styles.dueDateText}>
                {new Date(task.dueDate).toLocaleDateString('zh-CN')}
              </Text>
            </View>
          )}
          {totalSubtasks > 0 && (
            <View style={styles.subtasks}>
              <Ionicons name="checkbox-outline" size={16} color="#666666" />
              <Text style={styles.subtasksText}>
                {completedSubtasks}/{totalSubtasks}
              </Text>
            </View>
          )}
          {task.status !== 'completed' && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={onComplete}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  },
  // 自定义比较函数
  (prevProps, nextProps) => {
    return (
      prevProps.task.id === nextProps.task.id &&
      prevProps.task.title === nextProps.task.title &&
      prevProps.task.status === nextProps.task.status &&
      prevProps.task.priority === nextProps.task.priority &&
      prevProps.task.dueDate === nextProps.task.dueDate
    );
  }
);

TaskCard.displayName = 'TaskCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#999999',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dueDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  subtasks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  subtasksText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
