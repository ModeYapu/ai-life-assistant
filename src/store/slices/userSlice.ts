/**
 * 用户偏好设置状态管理 - 免登录版本
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserState } from '../../types';

// 默认偏好设置
const defaultPreferences = {
  theme: 'auto' as const,
  language: 'zh-CN',
  aiModel: 'claude-3.7-sonnet',
  codePlanEnabled: false,
  notifications: {
    tasks: true,
    reminders: true,
    updates: true,
  },
  privacy: {
    analytics: true,
    crashReports: true,
  },
};

const initialState: UserState = {
  currentUser: {
    id: 'local-user',
    name: '本地用户',
    email: '',
    preferences: defaultPreferences,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  isAuthenticated: true, // 免登录，始终为true
  loading: false,
  error: null,
};

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updatePreferences: (state, action: PayloadAction<Partial<typeof defaultPreferences>>) => {
      if (state.currentUser) {
        state.currentUser.preferences = {
          ...state.currentUser.preferences,
          ...action.payload,
        };
        state.currentUser.updatedAt = Date.now();
      }
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      if (state.currentUser) {
        state.currentUser.preferences.theme = action.payload;
        state.currentUser.updatedAt = Date.now();
      }
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      if (state.currentUser) {
        state.currentUser.preferences.language = action.payload;
        state.currentUser.updatedAt = Date.now();
      }
    },
    toggleCodePlan: (state) => {
      if (state.currentUser) {
        state.currentUser.preferences.codePlanEnabled =
          !state.currentUser.preferences.codePlanEnabled;
        state.currentUser.updatedAt = Date.now();
      }
    },
    updateNotificationSettings: (
      state,
      action: PayloadAction<Partial<typeof defaultPreferences.notifications>>
    ) => {
      if (state.currentUser) {
        state.currentUser.preferences.notifications = {
          ...state.currentUser.preferences.notifications,
          ...action.payload,
        };
        state.currentUser.updatedAt = Date.now();
      }
    },
  },
});

export const {
  clearError,
  updatePreferences,
  setTheme,
  setLanguage,
  toggleCodePlan,
  updateNotificationSettings,
} = userSlice.actions;

export default userSlice.reducer;
