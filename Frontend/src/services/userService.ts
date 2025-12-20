import api from './api';
import { User } from '../types/User';
import { Task } from '../types/Task';

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/auth/users');
    return response.data;
  },

  getMyTasks: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>('/users/me/tasks');
    return response.data;
  },

  updateProfile: async (fullName: string): Promise<void> => {
    await api.put('/users/me/profile', { fullName });
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await api.put('/users/me/password', { oldPassword, newPassword });
  },
};

