import { startOfWeek, endOfWeek, eachDayOfInterval, format, addWeeks, subWeeks } from 'date-fns';
import { sv } from 'date-fns/locale';

export function getWeekDates(date: Date = new Date()): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 });
  
  return eachDayOfInterval({ start, end });
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDisplayDate(date: Date): string {
  return format(date, 'E d/M', { locale: sv });
}

export function getNextWeek(currentDate: Date): Date {
  return addWeeks(currentDate, 1);
}

export function getPreviousWeek(currentDate: Date): Date {
  return subWeeks(currentDate, 1);
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
}

export function getWeekLabel(date: Date): string {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  
  return `${format(start, 'd MMM', { locale: sv })} - ${format(end, 'd MMM', { locale: sv })}`;
}