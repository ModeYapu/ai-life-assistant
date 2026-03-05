/**
 * 设置管理Hook
 * 提取设置逻辑，可复用
 */

import { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { updateSettings } from '@/store/slices/settingsSlice';
import { logger } from '@/utils/logger';

export interface UseSettingsReturn {
  settings: any;
  updateSetting: (key: string, value: any) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (data: string) => boolean;
}

/**
 * 设置管理Hook
 */
export function useSettings(): UseSettingsReturn {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);

  // 更新单个设置
  const updateSetting = useCallback(
    (key: string, value: any) => {
      try {
        dispatch(updateSettings({ [key]: value }));
        logger.info(`设置已更新: ${key} = ${value}`);
      } catch (error) {
        logger.error('更新设置失败', error);
      }
    },
    [dispatch]
  );

  // 重置设置
  const resetSettings = useCallback(() => {
    try {
      const defaultSettings = {
        theme: 'auto',
        notifications: true,
        language: 'zh-CN',
      };
      dispatch(updateSettings(defaultSettings));
      logger.info('设置已重置');
    } catch (error) {
      logger.error('重置设置失败', error);
    }
  }, [dispatch]);

  // 导出设置
  const exportSettings = useCallback((): string => {
    try {
      const data = JSON.stringify(settings, null, 2);
      logger.info('设置已导出');
      return data;
    } catch (error) {
      logger.error('导出设置失败', error);
      return '';
    }
  }, [settings]);

  // 导入设置
  const importSettings = useCallback(
    (data: string): boolean => {
      try {
        const parsed = JSON.parse(data);
        dispatch(updateSettings(parsed));
        logger.info('设置已导入');
        return true;
      } catch (error) {
        logger.error('导入设置失败', error);
        return false;
      }
    },
    [dispatch]
  );

  return {
    settings,
    updateSetting,
    resetSettings,
    exportSettings,
    importSettings,
  };
}

/**
 * 主题切换Hook
 */
export function useTheme() {
  const { settings, updateSetting } = useSettings();
  const theme = settings.theme || 'auto';

  const toggleTheme = useCallback(() => {
    const themes = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    updateSetting('theme', themes[nextIndex]);
  }, [theme, updateSetting]);

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isAuto: theme === 'auto',
  };
}

/**
 * 通知设置Hook
 */
export function useNotifications() {
  const { settings, updateSetting } = useSettings();
  const enabled = settings.notifications ?? true;

  const toggleNotifications = useCallback(() => {
    updateSetting('notifications', !enabled);
  }, [enabled, updateSetting]);

  return {
    enabled,
    toggleNotifications,
    enable: () => updateSetting('notifications', true),
    disable: () => updateSetting('notifications', false),
  };
}

/**
 * 语言设置Hook
 */
export function useLanguage() {
  const { settings, updateSetting } = useSettings();
  const language = settings.language || 'zh-CN';

  const setLanguage = useCallback(
    (lang: string) => {
      updateSetting('language', lang);
    },
    [updateSetting]
  );

  return {
    language,
    setLanguage,
    isChinese: language.startsWith('zh'),
    isEnglish: language.startsWith('en'),
  };
}
