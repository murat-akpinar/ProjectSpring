import { TaskStatus } from '../types/Task';

export const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.OPEN:
      return '#f9e2af'; // Catppuccin Yellow
    case TaskStatus.IN_PROGRESS:
      return '#89b4fa'; // Catppuccin Blue
    case TaskStatus.COMPLETED:
      return '#a6e3a1'; // Catppuccin Green
    case TaskStatus.POSTPONED:
      return '#fab387'; // Catppuccin Peach
    case TaskStatus.CANCELLED:
      return '#6c7086'; // Catppuccin Overlay0
    case TaskStatus.OVERDUE:
      return '#f38ba8'; // Catppuccin Red
    default:
      return '#9399b2'; // Catppuccin Overlay2
  }
};

export const getStatusLabel = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.OPEN:
      return 'Açık';
    case TaskStatus.IN_PROGRESS:
      return 'Yapılıyor';
    case TaskStatus.COMPLETED:
      return 'Tamamlandı';
    case TaskStatus.POSTPONED:
      return 'Ertelendi';
    case TaskStatus.CANCELLED:
      return 'İptal Edildi';
    case TaskStatus.OVERDUE:
      return 'Yetişmedi';
    default:
      return status;
  }
};

