import { Task } from './Task';

export interface CalendarView {
  year: number;
  tasksByMonth: Record<number, Task[]>;
  tasksByWeek: Record<string, Task[]>;
}

