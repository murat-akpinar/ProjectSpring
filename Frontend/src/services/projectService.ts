import api from './api';
import { Project, CreateProjectRequest } from '../types/Project';

export const projectService = {
  getAllProjects: async (): Promise<Project[]> => {
    const response = await api.get<Project[]>('/projects');
    return response.data;
  },

  getProjectById: async (id: number): Promise<Project> => {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
  },

  createProject: async (project: CreateProjectRequest): Promise<Project> => {
    const response = await api.post<Project>('/projects', project);
    return response.data;
  },

  updateProject: async (id: number, project: CreateProjectRequest): Promise<Project> => {
    const response = await api.put<Project>(`/projects/${id}`, project);
    return response.data;
  },

  deleteProject: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};

