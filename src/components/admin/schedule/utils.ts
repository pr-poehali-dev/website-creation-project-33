import { DaySchedule, Week } from './types';

const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getMoscowDate = (): Date => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 3));
};

export const getMondayOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const getAllWeeksUntilEndOfYear = (): Week[] => {
  const weeks = [];
  const startDate = new Date('2025-03-01');
  const endOfYear = new Date('2025-12-31');
  
  let currentMonday = new Date(startDate);
  
  while (currentMonday <= endOfYear) {
    const weekEnd = new Date(currentMonday);
    weekEnd.setDate(currentMonday.getDate() + 6);
    
    weeks.push({
      start: formatDateLocal(currentMonday),
      label: `${currentMonday.getDate().toString().padStart(2, '0')}.${(currentMonday.getMonth() + 1).toString().padStart(2, '0')} - ${weekEnd.getDate().toString().padStart(2, '0')}.${(weekEnd.getMonth() + 1).toString().padStart(2, '0')}`
    });
    
    currentMonday = new Date(currentMonday);
    currentMonday.setDate(currentMonday.getDate() + 7);
  }
  
  return weeks;
};

export const getCurrentWeekIndex = (): number => {
  const weeks = getAllWeeksUntilEndOfYear();
  const moscowDate = getMoscowDate();
  const currentMonday = getMondayOfWeek(moscowDate);
  const currentMondayStr = formatDateLocal(currentMonday);
  
  const index = weeks.findIndex(week => week.start === currentMondayStr);
  return index >= 0 ? index : 0;
};

export const initializeWeekDays = (weekStart: string): DaySchedule[] => {
  const days: DaySchedule[] = [];
  const startDate = new Date(weekStart);
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const dayNamesFull = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    const isWeekend = i >= 5;
    
    days.push({
      date: dateStr,
      dayName: dayNames[i],
      dayNameFull: dayNamesFull[i],
      isWeekend,
      slots: isWeekend ? [
        { label: '11:00-15:00', time: 'slot1' },
        { label: '15:00-19:00', time: 'slot2' }
      ] : [
        { label: '12:00-16:00', time: 'slot1' },
        { label: '16:00-20:00', time: 'slot2' }
      ]
    });
  }
  
  return days;
};

export const getTotalShifts = (userSchedule: any): number => {
  let total = 0;
  Object.values(userSchedule).forEach((day: any) => {
    if (day.slot1) total++;
    if (day.slot2) total++;
  });
  return total;
};

export const getUserScheduleForDay = (userSchedule: any, date: string) => {
  return userSchedule[date] || { slot1: false, slot2: false };
};

export const isMaximKorelsky = (firstName: string, lastName: string): boolean => {
  const fn = firstName?.toLowerCase() || '';
  const ln = lastName?.toLowerCase() || '';
  return (fn === 'максим' && ln === 'корельский') || (fn === 'корельский' && ln === 'максим');
};