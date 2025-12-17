import { TaskStatus } from '../types/Task';

export const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.OPEN:
      return '#FFD700'; // Sarı
    case TaskStatus.IN_PROGRESS:
      return '#4169E1'; // Mavi
    case TaskStatus.COMPLETED:
      return '#32CD32'; // Yeşil
    case TaskStatus.POSTPONED:
      return '#FF8C00'; // Turuncu
    case TaskStatus.CANCELLED:
      return '#808080'; // Gri
    case TaskStatus.OVERDUE:
      return '#DC143C'; // Kırmızı
    default:
      return '#CCCCCC';
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

