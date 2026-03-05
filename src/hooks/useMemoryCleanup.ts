import { useEffect } from 'react';
import { unifiedMemorySystem } from '../services/unifiedMemorySystem';

/**
 * React Hook - 组件卸载时清理内存系统资源
 */
export function useMemoryCleanup() {
  useEffect(() => {
    return () => {
      // 组件卸载时清理定时器
      unifiedMemorySystem.cleanup();
    };
  }, []);
}

/**
 * 全局清理函数 - 应用退出时调用
 */
export function cleanupMemorySystem() {
  unifiedMemorySystem.cleanup();
  console.log('🧹 Memory system cleaned up');
}
