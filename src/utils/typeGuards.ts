/**
 * TypeScript类型守卫工具
 * 提供运行时类型检查
 */

// 基础类型守卫
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isArray<T>(value: unknown, itemGuard?: (item: unknown) => item is T): value is T[] {
  if (!Array.isArray(value)) return false;
  if (itemGuard) {
    return value.every(itemGuard);
  }
  return true;
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hasProperty<T extends string>(
  obj: unknown,
  prop: T
): obj is Record<T, unknown> {
  return isObject(obj) && prop in obj;
}

// 任务类型守卫
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  subtasks?: SubTask[];
  createdAt: string;
  updatedAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export function isTask(value: unknown): value is Task {
  if (!isObject(value)) return false;

  return (
    hasProperty(value, 'id') &&
    isString(value.id) &&
    hasProperty(value, 'title') &&
    isString(value.title) &&
    hasProperty(value, 'status') &&
    isString(value.status) &&
    ['pending', 'in_progress', 'completed'].includes(value.status as string) &&
    hasProperty(value, 'priority') &&
    isString(value.priority) &&
    ['low', 'medium', 'high'].includes(value.priority as string) &&
    hasProperty(value, 'createdAt') &&
    isString(value.createdAt) &&
    hasProperty(value, 'updatedAt') &&
    isString(value.updatedAt)
  );
}

export function isTaskArray(value: unknown): value is Task[] {
  return isArray(value, isTask);
}

// 消息类型守卫
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function isMessage(value: unknown): value is Message {
  if (!isObject(value)) return false;

  return (
    hasProperty(value, 'id') &&
    isString(value.id) &&
    hasProperty(value, 'role') &&
    isString(value.role) &&
    ['user', 'assistant'].includes(value.role as string) &&
    hasProperty(value, 'content') &&
    isString(value.content) &&
    hasProperty(value, 'timestamp') &&
    isString(value.timestamp)
  );
}

export function isMessageArray(value: unknown): value is Message[] {
  return isArray(value, isMessage);
}

// 对话类型守卫
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export function isConversation(value: unknown): value is Conversation {
  if (!isObject(value)) return false;

  return (
    hasProperty(value, 'id') &&
    isString(value.id) &&
    hasProperty(value, 'title') &&
    isString(value.title) &&
    hasProperty(value, 'messages') &&
    isMessageArray(value.messages) &&
    hasProperty(value, 'createdAt') &&
    isString(value.createdAt) &&
    hasProperty(value, 'updatedAt') &&
    isString(value.updatedAt)
  );
}

// 用户类型守卫
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: boolean;
  language?: string;
}

export function isUser(value: unknown): value is User {
  if (!isObject(value)) return false;

  return (
    hasProperty(value, 'id') &&
    isString(value.id) &&
    hasProperty(value, 'name') &&
    isString(value.name) &&
    hasProperty(value, 'email') &&
    isString(value.email)
  );
}

// API响应类型守卫
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function isAPIResponse<T>(
  value: unknown,
  dataGuard?: (data: unknown) => data is T
): value is APIResponse<T> {
  if (!isObject(value)) return false;

  if (!hasProperty(value, 'success') || !isBoolean(value.success)) {
    return false;
  }

  if (dataGuard && hasProperty(value, 'data')) {
    return dataGuard(value.data);
  }

  return true;
}

// 内存数据类型守卫
export interface MemoryData {
  id: string;
  content: string;
  type: 'short_term' | 'long_term' | 'episodic';
  importance: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export function isMemoryData(value: unknown): value is MemoryData {
  if (!isObject(value)) return false;

  return (
    hasProperty(value, 'id') &&
    isString(value.id) &&
    hasProperty(value, 'content') &&
    isString(value.content) &&
    hasProperty(value, 'type') &&
    isString(value.type) &&
    ['short_term', 'long_term', 'episodic'].includes(value.type as string) &&
    hasProperty(value, 'importance') &&
    isNumber(value.importance) &&
    hasProperty(value, 'timestamp') &&
    isString(value.timestamp)
  );
}

// 错误处理
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

// 安全的类型转换
export function safeCast<T>(value: unknown, guard: (value: unknown) => value is T): T | null {
  return guard(value) ? value : null;
}

// 带默认值的类型转换
export function castWithDefault<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  defaultValue: T
): T {
  return guard(value) ? value : defaultValue;
}

// 验证函数
export function validate<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage?: string
): T {
  if (!guard(value)) {
    throw new Error(errorMessage || 'Type validation failed');
  }
  return value;
}
