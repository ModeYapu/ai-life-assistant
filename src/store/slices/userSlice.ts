/**
 * 用户状态管理
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserState, User } from '../../types';
import { storageService } from '../../services/storageService';
import { v4 as uuidv4 } from 'uuid';

const initialState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async Thunks
export const loadUser = createAsyncThunk(
  'user/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await storageService.getUser();
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const login = createAsyncThunk(
  'user/login',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      // 这里简化处理，实际应该调用认证API
      const user: User = {
        id: uuidv4(),
        name: userData.name || 'User',
        email: userData.email || '',
        avatar: userData.avatar,
        preferences: {
          theme: 'auto',
          language: 'zh-CN',
          aiModel: 'claude-3-5-sonnet',
          notifications: {
            tasks: true,
            reminders: true,
            updates: true,
          },
          privacy: {
            analytics: true,
            crashReports: true,
          },
        },
        subscription: {
          plan: 'free',
          features: ['basic_chat', 'task_management'],
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      await storageService.saveUser(user);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'user/updateUser',
  async (user: User, { rejectWithValue }) => {
    try {
      const updatedUser = {
        ...user,
        updatedAt: Date.now(),
      };
      await storageService.saveUser(updatedUser);
      return updatedUser;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const logout = createAsyncThunk(
  'user/logout',
  async (_, { rejectWithValue }) => {
    try {
      // 清除用户数据
      await storageService.clearAll();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updatePreferences: (state, action: PayloadAction<Partial<User['preferences']>>) => {
      if (state.currentUser) {
        state.currentUser.preferences = {
          ...state.currentUser.preferences,
          ...action.payload,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // 加载用户
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.isAuthenticated = action.payload !== null;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // 登录
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // 更新用户
      .addCase(updateUser.fulfilled, (state, action) => {
        state.currentUser = action.payload;
      })
      // 登出
      .addCase(logout.fulfilled, (state) => {
        state.currentUser = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, updatePreferences } = userSlice.actions;
export default userSlice.reducer;
