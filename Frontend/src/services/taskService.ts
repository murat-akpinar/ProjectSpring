import api from './api';
import { Task, CreateTaskRequest, UpdateTaskStatusRequest } from '../types/Task';

export const taskService = {
  getTasks: async (teamId?: number, year?: number, month?: number, projectId?: number): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (teamId) params.append('teamId', teamId.toString());
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    if (projectId) params.append('projectId', projectId.toString());
    
    const response = await api.get<Task[]>(`/tasks?${params.toString()}`);
    return response.data;
  },

  getTaskById: async (id: number): Promise<Task> => {
    const response = await api.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (task: CreateTaskRequest): Promise<Task> => {
    const response = await api.post<Task>('/tasks', task);
    return response.data;
  },

  updateTask: async (id: number, task: CreateTaskRequest): Promise<Task> => {
    const response = await api.put<Task>(`/tasks/${id}`, task);
    return response.data;
  },

  deleteTask: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  updateTaskStatus: async (id: number, request: UpdateTaskStatusRequest): Promise<Task> => {
    const response = await api.put<Task>(`/tasks/${id}/status`, request);
    return response.data;
  },

  getTasksByDateRange: async (
    startDate: string,
    endDate: string,
    teamId?: number
  ): Promise<Task[]> => {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    if (teamId) params.append('teamId', teamId.toString());
    
    const response = await api.get<Task[]>(`/tasks/date-range?${params.toString()}`);
    return response.data;
  },
};

