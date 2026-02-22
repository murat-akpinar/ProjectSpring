import { TaskStatus } from '../types/Task';

export const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.OPEN:
      return '#f5e0dc'; // Rosewater (daha açık sarı)
    case TaskStatus.IN_PROGRESS:
      return '#89dceb'; // Sky (daha açık mavi)
    case TaskStatus.TESTING:
      return '#cba6f7'; // Mauve (mor)
    case TaskStatus.COMPLETED:
      return '#94e2d5'; // Teal (daha açık yeşil)
    case TaskStatus.POSTPONED:
      return '#f2cdcd'; // Flamingo (daha açık turuncu)
    case TaskStatus.CANCELLED:
      return '#7f849c'; // Overlay1 (daha açık gri)
    case TaskStatus.OVERDUE:
      return '#eba0ac'; // Maroon (daha açık kırmızı)
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
    case TaskStatus.TESTING:
      return 'Test Aşamasında';
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
