import { TaskStatus } from '../types/Task';

export const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.OPEN:
      return '#feb300'; // Sleuthe Yellow
    case TaskStatus.IN_PROGRESS:
      return '#ff5e6c'; // Coral Pink
    case TaskStatus.COMPLETED:
      return '#94e2d5'; // Teal (yeşil - tamamlandı için uygun)
    case TaskStatus.POSTPONED:
      return '#ffaaab'; // Pink Leaf
    case TaskStatus.CANCELLED:
      return '#7f849c'; // Gri
    case TaskStatus.OVERDUE:
      return '#ff5e6c'; // Coral Pink (acil durum)
    default:
      return '#9399b2';
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

