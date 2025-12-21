import api from './api';
import { SystemLog, TaskLog, SystemLogFilter, TaskLogFilter, FrontendLogRequest, PageResponse } from '../types/Log';

// Helper function to convert datetime-local format to ISO format
// datetime-local: "2025-12-20T10:00" -> ISO: "2025-12-20T10:00:00"
// Backend @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) bekliyor
// ISO.DATE_TIME formatı: "YYYY-MM-DDTHH:MM:SS" (timezone olmadan)
const formatDateForAPI = (dateString: string, isEndDate: boolean = false): string => {
  if (!dateString) return dateString;
  
  // datetime-local input formatı: "YYYY-MM-DDTHH:MM" (16 karakter)
  // Backend'in beklediği format: "YYYY-MM-DDTHH:MM:SS"
  // Sadece saniye kısmını ekleyelim (":00")
  // Date objesi kullanmayalım çünkü timezone dönüşümü yapar ve tarih kayabilir
  if (dateString.length === 16 && dateString.includes('T')) {
    // "2025-12-16T10:00" -> "2025-12-16T10:00:00"
    // Eğer bitiş tarihi ise ve saat "00:00" ise, günün sonu olarak "23:59:59" yap
    if (isEndDate && dateString.endsWith('T00:00')) {
      return dateString.replace('T00:00', 'T23:59:59');
    }
    return dateString + ':00';
  }
  
  // Eğer zaten formatlanmışsa (19 karakter: "YYYY-MM-DDTHH:MM:SS") olduğu gibi döndür
  if (dateString.length === 19 && dateString.includes('T')) {
    return dateString;
  }
  
  // Diğer formatlar için olduğu gibi döndür
  return dateString;
};

export const logService = {
  async getSystemLogs(filter: SystemLogFilter = {}): Promise<PageResponse<SystemLog>> {
    const params = new URLSearchParams();
    if (filter.source) params.append('source', filter.source);
    if (filter.level) params.append('level', filter.level);
    if (filter.userId) params.append('userId', filter.userId.toString());
    if (filter.startDate) params.append('startDate', formatDateForAPI(filter.startDate, false));
    if (filter.endDate) params.append('endDate', formatDateForAPI(filter.endDate, true));
    params.append('page', (filter.page || 0).toString());
    params.append('size', (filter.size || 50).toString());
    
    const response = await api.get(`/admin/logs/system?${params.toString()}`);
    return response.data;
  },

  async getBackendLogs(filter: SystemLogFilter = {}): Promise<PageResponse<SystemLog>> {
    const params = new URLSearchParams();
    if (filter.level) params.append('level', filter.level);
    if (filter.userId) params.append('userId', filter.userId.toString());
    if (filter.startDate) params.append('startDate', formatDateForAPI(filter.startDate, false));
    if (filter.endDate) params.append('endDate', formatDateForAPI(filter.endDate, true));
    params.append('page', (filter.page || 0).toString());
    params.append('size', (filter.size || 50).toString());
    
    const response = await api.get(`/admin/logs/system/backend?${params.toString()}`);
    return response.data;
  },

  async getFrontendLogs(filter: SystemLogFilter = {}): Promise<PageResponse<SystemLog>> {
    const params = new URLSearchParams();
    if (filter.level) params.append('level', filter.level);
    if (filter.userId) params.append('userId', filter.userId.toString());
    if (filter.startDate) params.append('startDate', formatDateForAPI(filter.startDate, false));
    if (filter.endDate) params.append('endDate', formatDateForAPI(filter.endDate, true));
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
    if (filter.startDate) params.append('startDate', formatDateForAPI(filter.startDate, false));
    if (filter.endDate) params.append('endDate', formatDateForAPI(filter.endDate, true));
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
    // Only send logs if user is authenticated (has token)
    const token = localStorage.getItem('token');
    if (!token) {
      // Silently skip logging if user is not authenticated
      return;
    }
    
    const request: FrontendLogRequest = {
      level,
      message,
      stackTrace: error ? error.stack : undefined
    };
    
    try {
      await api.post('/admin/logs/system/frontend', request);
    } catch (err: any) {
      // Don't log errors when sending logs to avoid infinite loop
      // Also, if it's a 401/403 error, stop trying to send logs
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        // Token expired or invalid, stop trying to send logs
        return;
      }
      // For other errors, silently fail (don't log to avoid loop)
    }
  }
};

