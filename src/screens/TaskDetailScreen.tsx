/**
 * 任务详情页面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  RadioButton,
  Chip,
  IconButton,
  DateTimePicker,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootState } from '@/store';
import { createTask, updateTask } from '@/store/slices/tasksSlice';
import { Task, TaskPriority, TaskStatus } from '@/types';
import { format } from 'date-fns';

export const TaskDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { taskId } = route.params as { taskId: string };
  const { tasks } = useSelector((state: RootState) => state.tasks);
  
  const isNewTask = taskId === 'new';
  const existingTask = tasks.find(t => t.id === taskId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [dueDate, setDueDate] = useState<number | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setDescription(existingTask.description || '');
      setPriority(existingTask.priority);
      setStatus(existingTask.status);
      setDueDate(existingTask.dueDate);
      setTags(existingTask.tags);
    }
  }, [existingTask]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('错误', '请输入任务标题');
      return;
    }

    const taskData: Partial<Task> = {
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      dueDate,
      tags,
    };

    if (isNewTask) {
      await dispatch(createTask(taskData));
    } else if (existingTask) {
      await dispatch(updateTask({ ...existingTask, ...taskData }));
    }

    navigation.goBack();
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const priorityColors = {
    urgent: '#F44336',
    high: '#FF9800',
    medium: '#2196F3',
    low: '#4CAF50',
  };

  return (
    <ScrollView style={styles.container}>
      {/* 标题 */}
      <View style={styles.section}>
        <Text style={styles.label}>任务标题 *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="输入任务标题"
          multiline
        />
      </View>

      {/* 描述 */}
      <View style={styles.section}>
        <Text style={styles.label}>任务描述</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="输入任务描述"
          multiline
          numberOfLines={4}
        />
      </View>

      {/* 优先级 */}
      <View style={styles.section}>
        <Text style={styles.label}>优先级</Text>
        <RadioButton.Group
          onValueChange={(value) => setPriority(value as TaskPriority)}
          value={priority}
        >
          {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map((p) => (
            <View key={p} style={styles.radioItem}>
              <RadioButton value={p} color={priorityColors[p]} />
              <Chip
                style={[styles.priorityChip, { backgroundColor: priorityColors[p] }]}
                textStyle={styles.priorityChipText}
              >
                {p.toUpperCase()}
              </Chip>
            </View>
          ))}
        </RadioButton.Group>
      </View>

      {/* 状态 */}
      {!isNewTask && (
        <View style={styles.section}>
          <Text style={styles.label}>状态</Text>
          <RadioButton.Group
            onValueChange={(value) => setStatus(value as TaskStatus)}
            value={status}
          >
            <View style={styles.radioItem}>
              <RadioButton value="pending" />
              <Text>待完成</Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton value="in_progress" />
              <Text>进行中</Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton value="completed" />
              <Text>已完成</Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton value="cancelled" />
              <Text>已取消</Text>
            </View>
          </RadioButton.Group>
        </View>
      )}

      {/* 截止日期 */}
      <View style={styles.section}>
        <Text style={styles.label}>截止日期</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>
            {dueDate ? format(dueDate, 'yyyy-MM-dd HH:mm') : '选择日期'}
          </Text>
          <IconButton icon="calendar" />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={dueDate ? new Date(dueDate) : new Date()}
            mode="datetime"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) {
                setDueDate(date.getTime());
              }
            }}
          />
        )}
        {dueDate && (
          <Button
            mode="text"
            onPress={() => setDueDate(undefined)}
            style={styles.clearButton}
          >
            清除日期
          </Button>
        )}
      </View>

      {/* 标签 */}
      <View style={styles.section}>
        <Text style={styles.label}>标签</Text>
        <View style={styles.tagInput}>
          <TextInput
            style={styles.tagTextInput}
            value={newTag}
            onChangeText={setNewTag}
            placeholder="添加标签"
            onSubmitEditing={handleAddTag}
          />
          <IconButton icon="plus" onPress={handleAddTag} />
        </View>
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <Chip
              key={index}
              onClose={() => handleRemoveTag(tag)}
              style={styles.tag}
            >
              {tag}
            </Chip>
          ))}
        </View>
      </View>

      {/* 保存按钮 */}
      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
        >
          {isNewTask ? '创建任务' : '保存修改'}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#6200EE',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityChip: {
    marginLeft: 8,
  },
  priorityChipText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  clearButton: {
    marginTop: 8,
  },
  tagInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 12,
  },
  tagTextInput: {
    flex: 1,
    padding: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
  },
  actions: {
    marginTop: 16,
    marginBottom: 32,
  },
  saveButton: {
    backgroundColor: '#6200EE',
  },
});
