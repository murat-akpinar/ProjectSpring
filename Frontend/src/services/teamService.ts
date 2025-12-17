import api from './api';
import { Team } from '../types/Team';

export const teamService = {
  getAllTeams: async (): Promise<Team[]> => {
    const response = await api.get<Team[]>('/teams');
    return response.data;
  },

  getTeamById: async (id: number): Promise<Team> => {
    const response = await api.get<Team>(`/teams/${id}`);
    return response.data;
  },
};

