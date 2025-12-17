import api from './api';
import { CalendarView } from '../types/Calendar';
import { Task } from '../types/Task';

export const calendarService = {
  getCalendarByYear: async (year: number, teamId?: number): Promise<CalendarView> => {
    const params = teamId ? `?teamId=${teamId}` : '';
    const response = await api.get<CalendarView>(`/calendar/${year}${params}`);
    return response.data;
  },

  getCalendarByMonth: async (
    year: number,
    month: number,
    teamId?: number
  ): Promise<Record<string, Task[]>> => {
    const params = teamId ? `?teamId=${teamId}` : '';
    const response = await api.get<Record<string, Task[]>>(
      `/calendar/${year}/${month}${params}`
    );
    return response.data;
  },
};

