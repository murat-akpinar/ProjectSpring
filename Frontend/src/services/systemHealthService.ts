import api from './api';
import { SystemHealth } from '../types/SystemHealth';

export const systemHealthService = {
  getSystemHealth: async (): Promise<SystemHealth> => {
    const response = await api.get<SystemHealth>('/admin/health');
    return response.data;
  },
};

