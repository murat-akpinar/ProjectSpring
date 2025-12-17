import { format, startOfWeek, endOfWeek, getWeek, parseISO, startOfMonth, endOfMonth, eachWeekOfInterval } from 'date-fns';
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

export const getSeasonForMonth = (month: number): 'winter' | 'spring' | 'summer' | 'autumn' => {
  // Kış: Aralık, Ocak, Şubat (12, 1, 2)
  // İlkbahar: Mart, Nisan, Mayıs (3, 4, 5)
  // Yaz: Haziran, Temmuz, Ağustos (6, 7, 8)
  // Sonbahar: Eylül, Ekim, Kasım (9, 10, 11)
  if (month === 12 || month <= 2) return 'winter';
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  return 'autumn';
};

export const getSeasonColor = (season: 'winter' | 'spring' | 'summer' | 'autumn', isBright: boolean = false): string => {
  // Catppuccin Mocha renkleri
  const colors = {
    winter: isBright ? '#89b4fa' : '#6c7086', // Blue (parlak) / Overlay0 (soluk)
    spring: isBright ? '#a6e3a1' : '#6c7086', // Green (parlak) / Overlay0 (soluk)
    summer: isBright ? '#f9e2af' : '#6c7086', // Yellow (parlak) / Overlay0 (soluk)
    autumn: isBright ? '#fab387' : '#6c7086', // Peach (parlak) / Overlay0 (soluk)
  };
  return colors[season];
};

export const getWeeksInMonth = (month: number, year: number): number => {
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  const weeks = eachWeekOfInterval(
    { start: monthStart, end: monthEnd },
    { weekStartsOn: 1, locale: tr }
  );
  return weeks.length;
};

