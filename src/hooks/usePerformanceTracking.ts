/**
 * 性能监控Hook
 * 追踪组件渲染时间和性能指标
 */

import { useEffect, useRef, useState } from 'react';
import { logger } from './logger';

interface PerformanceMetrics {
  renderTime: number;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  slowRenders: number; // > 16ms
}

interface ComponentPerformance {
  [componentName: string]: PerformanceMetrics;
}

// 全局性能数据
const performanceData: ComponentPerformance = {};

/**
 * 组件性能监控Hook
 */
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const slowRenders = useRef<number>(0);
  const totalRenderTime = useRef<number>(0);

  useEffect(() => {
    // 记录渲染开始时间
    renderStartTime.current = performance.now();

    return () => {
      // 计算渲染时间
      const renderTime = performance.now() - renderStartTime.current;
      renderCount.current++;
      totalRenderTime.current += renderTime;

      // 检查慢渲染
      if (renderTime > 16) {
        slowRenders.current++;
        logger.warn(`慢渲染: ${componentName} - ${renderTime.toFixed(2)}ms`);
      }

      // 更新性能数据
      performanceData[componentName] = {
        renderTime,
        renderCount: renderCount.current,
        averageRenderTime: totalRenderTime.current / renderCount.current,
        lastRenderTime: renderTime,
        slowRenders: slowRenders.current,
      };
    };
  });

  return {
    getMetrics: () => performanceData[componentName],
    logMetrics: () => {
      const metrics = performanceData[componentName];
      if (metrics) {
        logger.info(`性能指标 [${componentName}]:`, {
          '渲染次数': metrics.renderCount,
          '平均时间': `${metrics.averageRenderTime.toFixed(2)}ms`,
          '最后渲染': `${metrics.lastRenderTime.toFixed(2)}ms`,
          '慢渲染次数': metrics.slowRenders,
        });
      }
    },
  };
}

/**
 * 内存使用监控Hook
 */
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  useEffect(() => {
    // 检查是否支持performance.memory
    if ('memory' in performance) {
      const updateMemoryInfo = () => {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      };

      updateMemoryInfo();
      const interval = setInterval(updateMemoryInfo, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  return {
    memoryInfo,
    formatBytes: (bytes: number) => {
      const mb = bytes / (1024 * 1024);
      return `${mb.toFixed(2)} MB`;
    },
    logMemoryUsage: () => {
      if (memoryInfo) {
        logger.info('内存使用:', {
          '已用': `${(memoryInfo.usedJSHeapSize / (1024 * 1024)).toFixed(2)} MB`,
          '总计': `${(memoryInfo.totalJSHeapSize / (1024 * 1024)).toFixed(2)} MB`,
          '限制': `${(memoryInfo.jsHeapSizeLimit / (1024 * 1024)).toFixed(2)} MB`,
        });
      }
    },
  };
}

/**
 * 网络性能监控Hook
 */
export function useNetworkMonitor() {
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  } | null>(null);

  useEffect(() => {
    // 检查是否支持navigator.connection
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      const updateNetworkInfo = () => {
        setNetworkInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        });
      };

      updateNetworkInfo();
      connection.addEventListener('change', updateNetworkInfo);

      return () => {
        connection.removeEventListener('change', updateNetworkInfo);
      };
    }
  }, []);

  return {
    networkInfo,
    isSlowNetwork: () => {
      if (!networkInfo) return false;
      return (
        networkInfo.effectiveType === '2g' ||
        networkInfo.effectiveType === 'slow-2g' ||
        networkInfo.saveData
      );
    },
    logNetworkInfo: () => {
      if (networkInfo) {
        logger.info('网络状态:', {
          '类型': networkInfo.effectiveType,
          '下行速度': `${networkInfo.downlink} Mbps`,
          'RTT': `${networkInfo.rtt} ms`,
          '省流模式': networkInfo.saveData ? '开启' : '关闭',
        });
      }
    },
  };
}

/**
 * 综合性能监控Hook
 */
export function usePerformanceTracking(componentName: string) {
  const performanceMonitor = usePerformanceMonitor(componentName);
  const memoryMonitor = useMemoryMonitor();
  const networkMonitor = useNetworkMonitor();

  const logAllMetrics = () => {
    logger.info('\n========== 性能报告 ==========');
    performanceMonitor.logMetrics();
    memoryMonitor.logMemoryUsage();
    networkMonitor.logNetworkInfo();
    logger.info('================================\n');
  };

  return {
    performanceMonitor,
    memoryMonitor,
    networkMonitor,
    logAllMetrics,
  };
}

/**
 * 获取所有性能数据
 */
export function getAllPerformanceData(): ComponentPerformance {
  return { ...performanceData };
}

/**
 * 生成性能报告
 */
export function generatePerformanceReport(): string {
  const components = Object.keys(performanceData);

  if (components.length === 0) {
    return '暂无性能数据';
  }

  let report = '📊 性能报告\n\n';

  components.forEach(name => {
    const metrics = performanceData[name];
    report += `${name}:\n`;
    report += `  渲染次数: ${metrics.renderCount}\n`;
    report += `  平均时间: ${metrics.averageRenderTime.toFixed(2)}ms\n`;
    report += `  最后渲染: ${metrics.lastRenderTime.toFixed(2)}ms\n`;
    report += `  慢渲染: ${metrics.slowRenders} 次\n\n`;
  });

  return report;
}
