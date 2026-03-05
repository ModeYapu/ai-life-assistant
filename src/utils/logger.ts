/**
 * 统一日志工具
 * 生产环境自动禁用调试日志
 */

const isDev = __DEV__;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enableDebug: boolean;
  enableInfo: boolean;
  enableWarn: boolean;
  enableError: boolean;
  sendToRemote: boolean;
}

const defaultConfig: LoggerConfig = {
  enableDebug: isDev,
  enableInfo: true,
  enableWarn: true,
  enableError: true,
  sendToRemote: !isDev,  // 生产环境发送到远程
};

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * 调试日志 - 仅开发环境
   */
  debug(...args: any[]) {
    if (this.config.enableDebug) {
      console.log('[DEBUG]', ...args);
    }
  }

  /**
   * 信息日志
   */
  info(...args: any[]) {
    if (this.config.enableInfo) {
      console.info('[INFO]', ...args);
    }
  }

  /**
   * 警告日志
   */
  warn(...args: any[]) {
    if (this.config.enableWarn) {
      console.warn('[WARN]', ...args);
    }
  }

  /**
   * 错误日志 - 始终启用
   */
  error(...args: any[]) {
    if (this.config.enableError) {
      console.error('[ERROR]', ...args);

      // 生产环境发送到错误监控服务
      if (this.config.sendToRemote) {
        this.sendToMonitoring('error', args);
      }
    }
  }

  /**
   * 性能日志
   */
  time(label: string) {
    if (isDev) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (isDev) {
      console.timeEnd(label);
    }
  }

  /**
   * 分组日志
   */
  group(label: string) {
    if (isDev) {
      console.group(label);
    }
  }

  groupEnd() {
    if (isDev) {
      console.groupEnd();
    }
  }

  /**
   * 发送到远程监控服务
   */
  private sendToMonitoring(level: LogLevel, args: any[]) {
    try {
      // 这里可以集成错误监控服务
      // 例如: Sentry, Bugsnag, LogRocket等
      // fetch('https://api.example.com/logs', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     level,
      //     message: args,
      //     timestamp: new Date().toISOString(),
      //     environment: isDev ? 'development' : 'production',
      //   }),
      // });
    } catch (error) {
      // 静默失败，避免日志系统本身导致崩溃
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

// 创建全局logger实例
export const logger = new Logger();

// 导出类型
export type { LoggerConfig, LogLevel };
