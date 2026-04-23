/**
 * 用户画像系统
 * 构建个性化用户模型
 */

import { logger } from '@/utils/logger';

export interface UserPreference {
  category: string;
  value: any;
  confidence: number;
  lastUpdated: number;
}

export interface UserProfile {
  userId: string;
  preferences: Map<string, UserPreference>;
  behaviorPatterns: BehaviorPattern[];
  interests: string[];
  communicationStyle: CommunicationStyle;
  createdAt: number;
  updatedAt: number;
}

export interface BehaviorPattern {
  type: string;
  pattern: string;
  frequency: number;
  lastOccurrence: number;
}

export interface CommunicationStyle {
  tone: 'formal' | 'casual' | 'friendly' | 'professional';
  language: string;
  avgMessageLength: number;
  emojiUsage: number;
  responseTimePreference: 'instant' | 'quick' | 'thoughtful';
}

/**
 * 用户画像管理器
 */
export class UserProfileManager {
  private profiles: Map<string, UserProfile> = new Map();

  /**
   * 获取或创建用户画像
   */
  getProfile(userId: string): UserProfile {
    if (!this.profiles.has(userId)) {
      this.createProfile(userId);
    }
    return this.profiles.get(userId)!;
  }

  /**
   * 创建用户画像
   */
  private createProfile(userId: string): UserProfile {
    const profile: UserProfile = {
      userId,
      preferences: new Map(),
      behaviorPatterns: [],
      interests: [],
      communicationStyle: {
        tone: 'friendly',
        language: 'zh-CN',
        avgMessageLength: 50,
        emojiUsage: 0.3,
        responseTimePreference: 'quick',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.profiles.set(userId, profile);
    logger.info(`创建用户画像: ${userId}`);
    return profile;
  }

  /**
   * 更新用户偏好
   */
  updatePreference(
    userId: string,
    category: string,
    value: any,
    confidence: number = 0.8
  ): void {
    const profile = this.getProfile(userId);
    const existing = profile.preferences.get(category);

    if (existing) {
      // 加权平均更新
      const newConfidence = Math.min(existing.confidence + 0.1, 1.0);
      profile.preferences.set(category, {
        category,
        value,
        confidence: newConfidence,
        lastUpdated: Date.now(),
      });
    } else {
      profile.preferences.set(category, {
        category,
        value,
        confidence,
        lastUpdated: Date.now(),
      });
    }

    profile.updatedAt = Date.now();
    logger.info(`更新偏好: ${category} = ${value}`, { userId, confidence });
  }

  /**
   * 获取用户偏好
   */
  getPreference(userId: string, category: string): UserPreference | undefined {
    const profile = this.getProfile(userId);
    return profile.preferences.get(category);
  }

  /**
   * 记录行为模式
   */
  recordBehavior(userId: string, type: string, pattern: string): void {
    const profile = this.getProfile(userId);
    const existing = profile.behaviorPatterns.find(
      (bp) => bp.type === type && bp.pattern === pattern
    );

    if (existing) {
      existing.frequency++;
      existing.lastOccurrence = Date.now();
    } else {
      profile.behaviorPatterns.push({
        type,
        pattern,
        frequency: 1,
        lastOccurrence: Date.now(),
      });
    }

    profile.updatedAt = Date.now();
    logger.info(`记录行为: ${type} - ${pattern}`, { userId });
  }

  /**
   * 更新兴趣标签
   */
  updateInterests(userId: string, interests: string[]): void {
    const profile = this.getProfile(userId);
    profile.interests = [...new Set([...profile.interests, ...interests])];
    profile.updatedAt = Date.now();
    logger.info(`更新兴趣: ${interests.join(', ')}`, { userId });
  }

  /**
   * 分析沟通风格
   */
  analyzeCommunicationStyle(userId: string, messages: string[]): void {
    const profile = this.getProfile(userId);

    // 平均消息长度
    const avgLength =
      messages.reduce((sum, msg) => sum + msg.length, 0) / messages.length;
    profile.communicationStyle.avgMessageLength = avgLength;

    // Emoji使用率
    const emojiCount = messages.reduce((count, msg) => {
      const emojis = msg.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]/gu);
      return count + (emojis ? emojis.length : 0);
    }, 0);
    profile.communicationStyle.emojiUsage = emojiCount / messages.length;

    // 语气判断
    if (avgLength > 100 && emojiCount < messages.length * 0.2) {
      profile.communicationStyle.tone = 'professional';
    } else if (emojiCount > messages.length * 0.5) {
      profile.communicationStyle.tone = 'friendly';
    } else {
      profile.communicationStyle.tone = 'casual';
    }

    profile.updatedAt = Date.now();
    logger.info(`分析沟通风格`, { userId, style: profile.communicationStyle });
  }

  /**
   * 获取个性化建议
   */
  getPersonalizedSuggestions(userId: string): string[] {
    const profile = this.getProfile(userId);
    const suggestions: string[] = [];

    // 基于偏好
    profile.preferences.forEach((pref, category) => {
      if (pref.confidence > 0.7) {
        suggestions.push(`基于你的${category}偏好，推荐: ${pref.value}`);
      }
    });

    // 基于行为模式
    const topBehaviors = profile.behaviorPatterns
      .filter((bp) => bp.frequency > 3)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);

    topBehaviors.forEach((bp) => {
      suggestions.push(`你经常${bp.pattern}，需要帮助吗？`);
    });

    // 基于兴趣
    if (profile.interests.length > 0) {
      suggestions.push(`你感兴趣的话题: ${profile.interests.slice(0, 3).join(', ')}`);
    }

    return suggestions;
  }

  /**
   * 导出用户画像
   */
  exportProfile(userId: string): any {
    const profile = this.getProfile(userId);
    return {
      userId: profile.userId,
      preferences: Object.fromEntries(profile.preferences),
      behaviorPatterns: profile.behaviorPatterns,
      interests: profile.interests,
      communicationStyle: profile.communicationStyle,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  /**
   * 导入用户画像
   */
  importProfile(data: any): void {
    const profile: UserProfile = {
      userId: data.userId,
      preferences: new Map(Object.entries(data.preferences || {})),
      behaviorPatterns: data.behaviorPatterns || [],
      interests: data.interests || [],
      communicationStyle: data.communicationStyle || {
        tone: 'friendly',
        language: 'zh-CN',
        avgMessageLength: 50,
        emojiUsage: 0.3,
        responseTimePreference: 'quick',
      },
      createdAt: data.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    this.profiles.set(profile.userId, profile);
    logger.info(`导入用户画像: ${profile.userId}`);
  }
}

/**
 * 用户画像Hook
 */
export function useUserProfile(userId: string) {
  const managerRef = React.useRef<UserProfileManager>(new UserProfileManager());

  const updatePreference = (category: string, value: any, confidence?: number) => {
    managerRef.current.updatePreference(userId, category, value, confidence);
  };

  const getPreference = (category: string) => {
    return managerRef.current.getPreference(userId, category);
  };

  const recordBehavior = (type: string, pattern: string) => {
    managerRef.current.recordBehavior(userId, type, pattern);
  };

  const updateInterests = (interests: string[]) => {
    managerRef.current.updateInterests(userId, interests);
  };

  const analyzeCommunicationStyle = (messages: string[]) => {
    managerRef.current.analyzeCommunicationStyle(userId, messages);
  };

  const getPersonalizedSuggestions = () => {
    return managerRef.current.getPersonalizedSuggestions(userId);
  };

  const getProfile = () => {
    return managerRef.current.getProfile(userId);
  };

  return {
    updatePreference,
    getPreference,
    recordBehavior,
    updateInterests,
    analyzeCommunicationStyle,
    getPersonalizedSuggestions,
    getProfile,
  };
}

// 添加React导入
import React from 'react';
