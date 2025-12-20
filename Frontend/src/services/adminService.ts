import api from './api';
import { User } from '../types/User';
import { Team } from '../types/Team';
import { CreateUserRequest, UpdateUserRequest, CreateTeamRequest, UpdateTeamRequest, CreateRoleRequest, Role } from '../types/Admin';

export const adminService = {
  // User Management
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/admin/users');
    return response.data;
  },

  getUserById: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/admin/users/${id}`);
    return response.data;
  },

  createUser: async (request: CreateUserRequest): Promise<User> => {
    const response = await api.post<User>('/admin/users', request);
    return response.data;
  },

  updateUser: async (id: number, request: UpdateUserRequest): Promise<User> => {
    const response = await api.put<User>(`/admin/users/${id}`, request);
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  changeUserPassword: async (id: number, newPassword: string): Promise<void> => {
    await api.post(`/admin/users/${id}/password`, { newPassword });
  },

  // Team Management
  getAllTeams: async (): Promise<Team[]> => {
    const response = await api.get<Team[]>('/admin/teams');
    return response.data;
  },

  getTeamById: async (id: number): Promise<Team> => {
    const response = await api.get<Team>(`/admin/teams/${id}`);
    return response.data;
  },

  createTeam: async (request: CreateTeamRequest): Promise<Team> => {
    const response = await api.post<Team>('/admin/teams', request);
    return response.data;
  },

  updateTeam: async (id: number, request: UpdateTeamRequest): Promise<Team> => {
    const response = await api.put<Team>(`/admin/teams/${id}`, request);
    return response.data;
  },

  deleteTeam: async (id: number): Promise<void> => {
    await api.delete(`/admin/teams/${id}`);
  },

  // Role Management
  getAllRoles: async (): Promise<Role[]> => {
    const response = await api.get<Role[]>('/admin/roles');
    return response.data;
  },

  getRoleById: async (id: number): Promise<Role> => {
    const response = await api.get<Role>(`/admin/roles/${id}`);
    return response.data;
  },

  createRole: async (request: CreateRoleRequest): Promise<Role> => {
    const response = await api.post<Role>('/admin/roles', request);
    return response.data;
  },

  updateRole: async (id: number, request: CreateRoleRequest): Promise<Role> => {
    const response = await api.put<Role>(`/admin/roles/${id}`, request);
    return response.data;
  },

  deleteRole: async (id: number): Promise<void> => {
    await api.delete(`/admin/roles/${id}`);
  },
};

