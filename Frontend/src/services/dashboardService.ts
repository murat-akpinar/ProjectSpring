import api from './api';
import { DashboardStats, DashboardDetails } from '../types/Dashboard';

export const dashboardService = {
  getTeamDashboard: async (teamId: number): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>(`/teams/${teamId}/dashboard`);
    return response.data;
  },

  getAllTeamsDashboard: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/teams/dashboard');
    return response.data;
  },

  getTeamDashboardDetails: async (teamId: number): Promise<DashboardDetails> => {
    const response = await api.get<DashboardDetails>(`/teams/${teamId}/dashboard/details`);
    return response.data;
  },

  getAllTeamsDashboardDetails: async (): Promise<DashboardDetails> => {
    const response = await api.get<DashboardDetails>('/teams/dashboard/details');
    return response.data;
  },
};

