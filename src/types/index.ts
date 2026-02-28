/**
 * TypeScript类型定义
 */

// ============ 通用类型 ============

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============ AI相关类型 ============

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    model?: string;
    tokens?: number;
    latency?: number;
  };
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
  metadata?: {
    model?: string;
    context?: string;
  };
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  type: 'chat' | 'completion' | 'embedding';
  contextWindow: number;
  pricing: {
    input: number;  // per 1K tokens
    output: number; // per 1K tokens
  };
  capabilities: string[];
}

export interface AIRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// ============ 任务相关类型 ============

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: number;
  reminder?: number;
  tags: string[];
  subtasks: SubTask[];
  attachments: Attachment[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  type: 'image' | 'file' | 'link';
  url: string;
  name: string;
  size?: number;
}

// ============ 用户相关类型 ============

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: number;
  updatedAt: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  aiModel: string;
  codePlanEnabled: boolean; // 启用代码规划
  notifications: {
    tasks: boolean;
    reminders: boolean;
    updates: boolean;
  };
  privacy: {
    analytics: boolean;
    crashReports: boolean;
  };
}

// ============ 设置相关类型 ============

export interface AppSettings {
  ai: {
    defaultModel: string;
    temperature: number;
    maxTokens: number;
    streamEnabled: boolean;
  };
  tasks: {
    defaultPriority: TaskPriority;
    defaultReminder: number;
    autoArchive: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
  };
  sync: {
    enabled: boolean;
    wifiOnly: boolean;
    lastSync?: number;
  };
}

// ============ 导航相关类型 ============

export type RootStackParamList = {
  Main: undefined;
  Chat: { conversationId?: string };
  TaskDetail: { taskId: string };
  Settings: undefined;
  Profile: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Chat: undefined;
  Tasks: undefined;
  Profile: undefined;
};

// ============ Redux状态类型 ============

export interface RootState {
  user: UserState;
  ai: AIState;
  tasks: TasksState;
  settings: SettingsState;
  ui: UIState;
}

export interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface AIState {
  conversations: AIConversation[];
  currentConversation: AIConversation | null;
  models: AIModel[];
  selectedModel: string;
  loading: boolean;
  error: string | null;
}

export interface TasksState {
  tasks: Task[];
  selectedTask: Task | null;
  filter: TaskFilter;
  loading: boolean;
  error: string | null;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  tags?: string[];
  dueDate?: {
    start?: number;
    end?: number;
  };
}

export interface SettingsState {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
}

export interface UIState {
  theme: 'light' | 'dark';
  isLoading: boolean;
  toast: {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null;
}
