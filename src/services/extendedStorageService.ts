/**
 * 存储服务 - 扩展版（支持记忆管理）
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, AIConversation, User, AppSettings } from '@/types';

class ExtendedStorageService {
  // Keys
  private readonly KEYS = {
    TASKS: '@tasks',
    CONVERSATIONS: '@conversations',
    USER: '@user',
    SETTINGS: '@settings',
    API_KEYS: '@api_keys',
    VECTOR_MEMORIES: '@vector_memories', // 新增：向量记忆
  };

  // ============ 原有方法保持不变 ============

  async getTasks(): Promise<Task[]> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  }

  async saveTask(task: Task): Promise<void> {
    try {
      const tasks = await this.getTasks();
      tasks.push(task);
      await AsyncStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving task:', error);
      throw error;
    }
  }

  async updateTask(updatedTask: Task): Promise<void> {
    try {
      const tasks = await this.getTasks();
      const index = tasks.findIndex(t => t.id === updatedTask.id);
      if (index !== -1) {
        tasks[index] = updatedTask;
        await AsyncStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks));
      }
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      const tasks = await this.getTasks();
      const filtered = tasks.filter(t => t.id !== taskId);
      await AsyncStorage.setItem(this.KEYS.TASKS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  async getConversations(): Promise<AIConversation[]> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.CONVERSATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  }

  async saveConversation(conversation: AIConversation): Promise<void> {
    try {
      const conversations = await this.getConversations();
      const index = conversations.findIndex(c => c.id === conversation.id);
      if (index !== -1) {
        conversations[index] = conversation;
      } else {
        conversations.push(conversation);
      }
      await AsyncStorage.setItem(
        this.KEYS.CONVERSATIONS,
        JSON.stringify(conversations)
      );
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const conversations = await this.getConversations();
      const filtered = conversations.filter(c => c.id !== conversationId);
      await AsyncStorage.setItem(
        this.KEYS.CONVERSATIONS,
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  // ============ 新增方法 ============

  /**
   * 新增：清空所有对话
   */
  async clearConversations(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.KEYS.CONVERSATIONS);
    } catch (error) {
      console.error('Error clearing conversations:', error);
      throw error;
    }
  }

  /**
   * 新增：保存向量记忆
   */
  async saveVectorMemories(memories: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.KEYS.VECTOR_MEMORIES,
        JSON.stringify(memories)
      );
    } catch (error) {
      console.error('Error saving vector memories:', error);
      throw error;
    }
  }

  /**
   * 新增：加载向量记忆
   */
  async loadVectorMemories(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.VECTOR_MEMORIES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading vector memories:', error);
      return [];
    }
  }

  // ============ 原有其他方法 ============

  async getUser(): Promise<User | null> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading user:', error);
      return null;
    }
  }

  async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  async getSettings(): Promise<AppSettings | null> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.SETTINGS);
      return data ? JSON.parse(data) : this.getDefaultSettings();
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.getDefaultSettings();
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  async getApiKeys(): Promise<Record<string, string>> {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.API_KEYS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error loading API keys:', error);
      return {};
    }
  }

  async saveApiKey(provider: string, key: string): Promise<void> {
    try {
      const keys = await this.getApiKeys();
      keys[provider] = key;
      await AsyncStorage.setItem(this.KEYS.API_KEYS, JSON.stringify(keys));
    } catch (error) {
      console.error('Error saving API key:', error);
      throw error;
    }
  }

  private getDefaultSettings(): AppSettings {
    return {
      ai: {
        defaultModel: 'claude-3-5-sonnet',
        temperature: 0.7,
        maxTokens: 4096,
        streamEnabled: false,
      },
      tasks: {
        defaultPriority: 'medium',
        defaultReminder: 3600000,
        autoArchive: true,
      },
      ui: {
        theme: 'auto',
        fontSize: 'medium',
        compactMode: false,
      },
      sync: {
        enabled: false,
        wifiOnly: true,
      },
    };
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(this.KEYS));
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  /**
   * 新增：获取存储统计
   */
  async getStorageStats(): Promise<{
    keys: string[];
    totalSize: string;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(k => k.startsWith('@'));
      
      let totalSize = 0;
      for (const key of appKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
        }
      }

      const sizeInKB = totalSize / 1024;
      const sizeInMB = sizeInKB / 1024;
      
      const formattedSize = sizeInMB > 1 
        ? `${sizeInMB.toFixed(2)} MB`
        : `${sizeInKB.toFixed(2)} KB`;

      return {
        keys: appKeys,
        totalSize: formattedSize,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        keys: [],
        totalSize: '0 KB',
      };
    }
  }
}

export const extendedStorageService = new ExtendedStorageService();
