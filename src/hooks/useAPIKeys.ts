/**
 * API配置管理Hook
 * 管理API密钥和配置
 */

import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

const API_KEYS_STORAGE = '@api_keys';

export interface APIKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
  deepseek?: string;
  zhipu?: string;
}

export interface UseAPIKeysReturn {
  keys: APIKeys;
  setKey: (provider: string, key: string) => Promise<void>;
  removeKey: (provider: string) => Promise<void>;
  clearAllKeys: () => Promise<void>;
  hasKey: (provider: string) => boolean;
  getKey: (provider: string) => string | undefined;
  loadKeys: () => Promise<void>;
}

/**
 * API密钥管理Hook
 */
export function useAPIKeys(): UseAPIKeysReturn {
  const [keys, setKeys] = useState<APIKeys>({});

  // 加载密钥
  const loadKeys = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(API_KEYS_STORAGE);
      if (stored) {
        const parsed = JSON.parse(stored);
        setKeys(parsed);
        logger.info('API密钥已加载');
      }
    } catch (error) {
      logger.error('加载API密钥失败', error);
    }
  }, []);

  // 保存密钥
  const saveKeys = useCallback(async (newKeys: APIKeys) => {
    try {
      await AsyncStorage.setItem(API_KEYS_STORAGE, JSON.stringify(newKeys));
      logger.info('API密钥已保存');
    } catch (error) {
      logger.error('保存API密钥失败', error);
    }
  }, []);

  // 设置密钥
  const setKey = useCallback(
    async (provider: string, key: string) => {
      const newKeys = { ...keys, [provider]: key };
      setKeys(newKeys);
      await saveKeys(newKeys);
    },
    [keys, saveKeys]
  );

  // 删除密钥
  const removeKey = useCallback(
    async (provider: string) => {
      const newKeys = { ...keys };
      delete newKeys[provider as keyof APIKeys];
      setKeys(newKeys);
      await saveKeys(newKeys);
    },
    [keys, saveKeys]
  );

  // 清空所有密钥
  const clearAllKeys = useCallback(async () => {
    setKeys({});
    await AsyncStorage.removeItem(API_KEYS_STORAGE);
    logger.info('所有API密钥已清除');
  }, []);

  // 检查是否有密钥
  const hasKey = useCallback(
    (provider: string): boolean => {
      return !!keys[provider as keyof APIKeys];
    },
    [keys]
  );

  // 获取密钥
  const getKey = useCallback(
    (provider: string): string | undefined => {
      return keys[provider as keyof APIKeys];
    },
    [keys]
  );

  // 初始化加载
  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  return {
    keys,
    setKey,
    removeKey,
    clearAllKeys,
    hasKey,
    getKey,
    loadKeys,
  };
}

/**
 * API配置Hook
 */
export function useAPIConfig() {
  const [config, setConfig] = useState({
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.9,
    frequencyPenalty: 0,
    presencePenalty: 0,
  });

  const updateConfig = useCallback((key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    logger.info(`API配置已更新: ${key} = ${value}`);
  }, []);

  const resetConfig = useCallback(() => {
    setConfig({
      temperature: 0.7,
      maxTokens: 2000,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0,
    });
    logger.info('API配置已重置');
  }, []);

  return {
    config,
    updateConfig,
    resetConfig,
  };
}
