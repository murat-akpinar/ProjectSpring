import api from './api';
import { SystemLog, TaskLog, SystemLogFilter, TaskLogFilter, FrontendLogRequest, PageResponse } from '../types/Log';

// Helper function to convert datetime-local format to ISO format
// datetime-local: "2025-12-20T10:00" -> ISO: "2025-12-20T10:00:00"
const formatDateForAPI = (dateString: string): string => {
  if (!dateString) return dateString;
  // datetime-local formatı: "2025-12-20T10:00" (16 karakter)
  // ISO formatı: "2025-12-20T10:00:00" (saniyeler eklenmiş)
  // Backend @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) bekliyor
  if (dateString.length === 16) {
    // "2025-12-20T10:00" -> "2025-12-20T10:00:00"
    return dateString + ':00';
  }
  // Eğer zaten formatlanmışsa olduğu gibi döndür
  return dateString;
};

export const logService = {
  async getSystemLogs(filter: SystemLogFilter = {}): Promise<PageResponse<SystemLog>> {
    const params = new URLSearchParams();
    if (filter.source) params.append('source', filter.source);
    if (filter.level) params.append('level', filter.level);
    if (filter.userId) params.append('userId', filter.userId.toString());
    if (filter.startDate) params.append('startDate', formatDateForAPI(filter.startDate));
    if (filter.endDate) params.append('endDate', formatDateForAPI(filter.endDate));
    params.append('page', (filter.page || 0).toString());
    params.append('size', (filter.size || 50).toString());
    
    const response = await api.get(`/admin/logs/system?${params.toString()}`);
    return response.data;
  },

  async getBackendLogs(filter: SystemLogFilter = {}): Promise<PageResponse<SystemLog>> {
    const params = new URLSearchParams();
    if (filter.level) params.append('level', filter.level);
    if (filter.userId) params.append('userId', filter.userId.toString());
    if (filter.startDate) params.append('startDate', formatDateForAPI(filter.startDate));
    if (filter.endDate) params.append('endDate', formatDateForAPI(filter.endDate));
    params.append('page', (filter.page || 0).toString());
    params.append('size', (filter.size || 50).toString());
    
    const response = await api.get(`/admin/logs/system/backend?${params.toString()}`);
    return response.data;
  },

  async getFrontendLogs(filter: SystemLogFilter = {}): Promise<PageResponse<SystemLog>> {
    const params = new URLSearchParams();
    if (filter.level) params.append('level', filter.level);
    if (filter.userId) params.append('userId', filter.userId.toString());
    if (filter.startDate) params.append('startDate', formatDateForAPI(filter.startDate));
    if (filter.endDate) params.append('endDate', formatDateForAPI(filter.endDate));
    params.append('page', (filter.page || 0).toString());
    params.append('size', (filter.size || 50).toString());
    
    const response = await api.get(`/admin/logs/system/frontend?${params.toString()}`);
    return response.data;
  },

  async getTaskLogs(filter: TaskLogFilter = {}): Promise<PageResponse<TaskLog>> {
    const params = new URLSearchParams();
    if (filter.taskId) params.append('taskId', filter.taskId.toString());
    if (filter.userId) params.append('userId', filter.userId.toString());
    if (filter.action) params.append('action', filter.action);
    if (filter.startDate) params.append('startDate', formatDateForAPI(filter.startDate));
    if (filter.endDate) params.append('endDate', formatDateForAPI(filter.endDate));
    params.append('page', (filter.page || 0).toString());
    params.append('size', (filter.size || 50).toString());
    
    const response = await api.get(`/admin/logs/tasks?${params.toString()}`);
    return response.data;
  },

  async getUserTaskHistory(userId: number, startDate?: string, endDate?: string): Promise<TaskLog[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', formatDateForAPI(startDate));
    if (endDate) params.append('endDate', formatDateForAPI(endDate));
    
    const response = await api.get(`/admin/logs/tasks/user/${userId}?${params.toString()}`);
    return response.data;
  },

  async sendFrontendLog(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, error?: Error): Promise<void> {
    const request: FrontendLogRequest = {
      level,
      message,
      stackTrace: error ? error.stack : undefined
    };
    
    try {
      await api.post('/admin/logs/system/frontend', request);
    } catch (err) {
      // Don't log errors when sending logs to avoid infinite loop
      console.error('Failed to send frontend log:', err);
    }
  }
};

