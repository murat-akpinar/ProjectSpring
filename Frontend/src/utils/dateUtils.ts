import { format, startOfWeek, endOfWeek, getWeek, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd.MM.yyyy', { locale: tr });
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd.MM.yyyy HH:mm', { locale: tr });
};

export const getWeekKey = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const week = getWeek(d, { locale: tr });
  return `${year}-${month.toString().padStart(2, '0')}-W${week.toString().padStart(2, '0')}`;
};

export const getWeekRange = (date: string | Date): { start: Date; end: Date } => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return {
    start: startOfWeek(d, { locale: tr }),
    end: endOfWeek(d, { locale: tr }),
  };
};

export const getMonthName = (month: number): string => {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  return months[month - 1] || '';
};

