export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  POSTPONED = 'POSTPONED',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
}

export enum TaskType {
  TASK = 'TASK',      // Görev
  FEATURE = 'FEATURE', // Özellik
  BUG = 'BUG',        // Hata
}

export enum Priority {
  NORMAL = 'NORMAL',  // Normal
  HIGH = 'HIGH',      // Yüksek
  URGENT = 'URGENT',  // Acil
}

export interface Subtask {
  id: number;
  title: string;
  content?: string;
  startDate?: string;
  endDate?: string;
  assigneeId?: number;
  assigneeName?: string;
  isCompleted: boolean;
}

export interface Task {
  id: number;
  title: string;
  content?: string;
  startDate: string;
  endDate: string;
  status: TaskStatus;
  taskType?: TaskType;
  priority?: Priority;
  teamId: number;
  teamName: string;
  teamColor?: string;
  teamIcon?: string;
  projectId?: number;
  projectName?: string;
  createdById: number;
  createdByName: string;
  assigneeIds: number[];
  assigneeNames: string[];
  subtasks: Subtask[];
  postponedToDate?: string;
  postponedFromDate?: string;
  isPostponed: boolean;
}

export interface CreateTaskRequest {
  title: string;
  content?: string;
  startDate: string;
  endDate: string;
  status?: TaskStatus;
  taskType?: TaskType;
  priority?: Priority;
  teamId: number;
  projectId?: number;
  assigneeIds?: number[];
  subtasks?: CreateSubtaskRequest[];
}

export interface CreateSubtaskRequest {
  title: string;
  content?: string;
  startDate?: string;
  endDate?: string;
  assigneeId?: number;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
  changeReason?: string;
  postponedToDate?: string;
}

