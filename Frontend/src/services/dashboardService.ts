import api from './api';
import { DashboardStats } from '../types/Dashboard';

export const dashboardService = {
  getTeamDashboard: async (teamId: number): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>(`/teams/${teamId}/dashboard`);
    return response.data;
  },

  getAllTeamsDashboard: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/teams/dashboard');
    return response.data;
  },
};

