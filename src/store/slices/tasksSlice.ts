/**
 * 任务状态管理
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TasksState, Task, TaskFilter } from '../../types';
import { storageService } from '../../services/storageService';
import { v4 as uuidv4 } from 'uuid';

const initialState: TasksState = {
  tasks: [],
  selectedTask: null,
  filter: {},
  loading: false,
  error: null,
};

// Async Thunks
export const loadTasks = createAsyncThunk(
  'tasks/loadTasks',
  async (_, { rejectWithValue }) => {
    try {
      const tasks = await storageService.getTasks();
      return tasks;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: Partial<Task>, { rejectWithValue }) => {
    try {
      const task: Task = {
        id: uuidv4(),
        title: taskData.title || '新任务',
        description: taskData.description,
        status: 'pending',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate,
        reminder: taskData.reminder,
        tags: taskData.tags || [],
        subtasks: taskData.subtasks || [],
        attachments: taskData.attachments || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      await storageService.saveTask(task);
      return task;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async (task: Task, { rejectWithValue }) => {
    try {
      const updatedTask = {
        ...task,
        updatedAt: Date.now(),
      };
      await storageService.updateTask(updatedTask);
      return updatedTask;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      await storageService.deleteTask(taskId);
      return taskId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setSelectedTask: (state, action: PayloadAction<Task | null>) => {
      state.selectedTask = action.payload;
    },
    setFilter: (state, action: PayloadAction<TaskFilter>) => {
      state.filter = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 加载任务
      .addCase(loadTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(loadTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // 创建任务
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload);
      })
      // 更新任务
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        if (state.selectedTask?.id === action.payload.id) {
          state.selectedTask = action.payload;
        }
      })
      // 删除任务
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(t => t.id !== action.payload);
        if (state.selectedTask?.id === action.payload) {
          state.selectedTask = null;
        }
      });
  },
});

export const { setSelectedTask, setFilter, clearError } = tasksSlice.actions;

// Selectors
export const selectFilteredTasks = (state: { tasks: TasksState }) => {
  const { tasks, filter } = state.tasks;
  
  return tasks.filter(task => {
    if (filter.status && !filter.status.includes(task.status)) return false;
    if (filter.priority && !filter.priority.includes(task.priority)) return false;
    if (filter.tags && filter.tags.length > 0) {
      if (!task.tags.some(tag => filter.tags!.includes(tag))) return false;
    }
    if (filter.dueDate) {
      if (filter.dueDate.start && task.dueDate && task.dueDate < filter.dueDate.start) return false;
      if (filter.dueDate.end && task.dueDate && task.dueDate > filter.dueDate.end) return false;
    }
    return true;
  });
};

export default tasksSlice.reducer;
