/**
 * 本地存储服务
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, AIConversation, User, AppSettings } from '../types';

class StorageService {
  // Keys
  private readonly KEYS = {
    TASKS: '@tasks',
    CONVERSATIONS: '@conversations',
    USER: '@user',
    SETTINGS: '@settings',
    API_KEYS: '@api_keys',
  };

  // Tasks
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

  // Conversations
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

  // User
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

  // Settings
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

  // API Keys
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

  // Helper
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
        defaultReminder: 3600000, // 1小时
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

  // Clear all data
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(this.KEYS));
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();
