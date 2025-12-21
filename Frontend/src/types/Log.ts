export interface SystemLog {
  id: number;
  level: string;
  message: string;
  source: 'BACKEND' | 'FRONTEND';
  userId?: number;
  username?: string;
  fullName?: string;
  ipAddress?: string;
  endpoint?: string;
  exception?: string;
  createdAt: string;
}

export interface TaskLog {
  id: number;
  taskId: number;
  taskTitle: string;
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED' | 'ASSIGNEE_ADDED' | 'ASSIGNEE_REMOVED';
  oldValue?: string;
  newValue?: string;
  changedById: number;
  changedByUsername: string;
  changedByFullName: string;
  changeReason?: string;
  createdAt: string;
}

export interface SystemLogFilter {
  source?: 'BACKEND' | 'FRONTEND';
  level?: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  userId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface TaskLogFilter {
  taskId?: number;
  userId?: number;
  action?: 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED' | 'ASSIGNEE_ADDED' | 'ASSIGNEE_REMOVED';
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface FrontendLogRequest {
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  stackTrace?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

