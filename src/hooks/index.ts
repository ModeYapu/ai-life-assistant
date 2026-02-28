/**
 * 自定义Hooks
 */

import { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState, AppStateStatus } from 'react-native';
import { RootState } from '../store';
import { loadTasks } from '../store/slices/tasksSlice';
import { loadUser } from '../store/slices/userSlice';
import { loadSettings } from '../store/slices/settingsSlice';

/**
 * 应用初始化Hook
 */
export const useAppInitialization = () => {
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        // 并行加载所有数据
        await Promise.all([
          dispatch(loadUser()),
          dispatch(loadTasks()),
          dispatch(loadSettings()),
        ]);
        setIsInitialized(true);
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initialize();
  }, [dispatch]);

  return isInitialized;
};

/**
 * 应用状态监听Hook
 */
export const useAppState = () => {
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return appState;
};

/**
 * 任务过滤Hook
 */
export const useTaskFilter = () => {
  const { tasks, filter } = useSelector((state: RootState) => state.tasks);

  const filteredTasks = tasks.filter((task) => {
    if (filter.status && !filter.status.includes(task.status)) return false;
    if (filter.priority && !filter.priority.includes(task.priority))
      return false;
    if (filter.tags && filter.tags.length > 0) {
      if (!task.tags.some((tag) => filter.tags!.includes(tag))) return false;
    }
    if (filter.dueDate) {
      if (
        filter.dueDate.start &&
        task.dueDate &&
        task.dueDate < filter.dueDate.start
      )
        return false;
      if (
        filter.dueDate.end &&
        task.dueDate &&
        task.dueDate > filter.dueDate.end
      )
        return false;
    }
    return true;
  });

  return filteredTasks;
};

/**
 * AI对话Hook
 */
export const useAIConversation = (conversationId?: string) => {
  const dispatch = useDispatch();
  const { conversations, currentConversation, loading, error } = useSelector(
    (state: RootState) => state.ai
  );

  const conversation = conversationId
    ? conversations.find((c) => c.id === conversationId)
    : currentConversation;

  return {
    conversation,
    loading,
    error,
  };
};

/**
 * 主题Hook
 */
export const useTheme = () => {
  const { settings } = useSelector((state: RootState) => state.settings);
  const dispatch = useDispatch();

  const toggleTheme = useCallback(() => {
    const newTheme =
      settings.ui.theme === 'light'
        ? 'dark'
        : settings.ui.theme === 'dark'
        ? 'auto'
        : 'light';
    // dispatch(setTheme(newTheme));
  }, [settings.ui.theme, dispatch]);

  return {
    theme: settings.ui.theme,
    toggleTheme,
  };
};

/**
 * Toast通知Hook
 */
export const useToast = () => {
  const dispatch = useDispatch();
  const { toast } = useSelector((state: RootState) => state.ui);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      // dispatch(showToast({ message, type }));
      // 自动隐藏
      setTimeout(() => {
        // dispatch(hideToast());
      }, 3000);
    },
    [dispatch]
  );

  return {
    toast,
    showToast,
  };
};

/**
 * 加载状态Hook
 */
export const useLoading = () => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state: RootState) => state.ui);

  const showLoading = useCallback(() => {
    // dispatch(showLoading());
  }, [dispatch]);

  const hideLoading = useCallback(() => {
    // dispatch(hideLoading());
  }, [dispatch]);

  return {
    isLoading,
    showLoading,
    hideLoading,
  };
};

/**
 * 网络状态Hook
 */
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // 监听网络状态
    // 这里简化处理，实际应该使用 @react-native-community/netinfo
    const checkConnection = () => {
      // 检查网络连接
    };

    checkConnection();
  }, []);

  return isConnected;
};
