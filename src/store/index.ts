/**
 * Redux Store配置
 */

import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import aiReducer from './slices/aiSlice';
import tasksReducer from './slices/tasksSlice';
import settingsReducer from './slices/settingsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    ai: aiReducer,
    tasks: tasksReducer,
    settings: settingsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略某些action的serializable检查
        ignoredActions: ['ai/sendMessage/fulfilled'],
      },
    }),
  devTools: __DEV__,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
