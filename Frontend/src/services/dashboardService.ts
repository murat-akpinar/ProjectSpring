import api from './api';
import { DashboardStats, DashboardDetails } from '../types/Dashboard';

export const dashboardService = {
  getTeamDashboard: async (teamId: number, startDate?: string, endDate?: string): Promise<DashboardStats> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get<DashboardStats>(`/teams/${teamId}/dashboard${query}`);
    return response.data;
  },

  getAllTeamsDashboard: async (startDate?: string, endDate?: string): Promise<DashboardStats> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get<DashboardStats>(`/teams/dashboard${query}`);
    return response.data;
  },

  getTeamDashboardDetails: async (teamId: number, startDate?: string, endDate?: string): Promise<DashboardDetails> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get<DashboardDetails>(`/teams/${teamId}/dashboard/details${query}`);
    return response.data;
  },

  getAllTeamsDashboardDetails: async (startDate?: string, endDate?: string): Promise<DashboardDetails> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get<DashboardDetails>(`/teams/dashboard/details${query}`);
    return response.data;
  },
};
