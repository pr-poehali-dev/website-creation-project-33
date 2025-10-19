import { DaySchedule, Week } from './types';

export const getAllWeeksUntilEndOfYear = (): Week[] => {
  const weeks = [];
  const startDate = new Date('2025-10-20');
  const endOfYear = new Date('2025-12-31');
  
  let currentMonday = new Date(startDate);
  
  while (currentMonday <= endOfYear) {
    const weekEnd = new Date(currentMonday);
    weekEnd.setDate(currentMonday.getDate() + 6);
    
    weeks.push({
      start: currentMonday.toISOString().split('T')[0],
      label: `${currentMonday.getDate().toString().padStart(2, '0')}.${(currentMonday.getMonth() + 1).toString().padStart(2, '0')} - ${weekEnd.getDate().toString().padStart(2, '0')}.${(weekEnd.getMonth() + 1).toString().padStart(2, '0')}`
    });
    
    currentMonday = new Date(currentMonday);
    currentMonday.setDate(currentMonday.getDate() + 7);
  }
  
  return weeks;
};

export const initializeWeekDays = (weekStart: string): DaySchedule[] => {
  const days: DaySchedule[] = [];
  const startDate = new Date(weekStart);
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    const isWeekend = i >= 5;
    
    days.push({
      date: dateStr,
      dayName: dayNames[i],
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