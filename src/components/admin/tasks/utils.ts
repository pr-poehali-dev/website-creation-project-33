import { PlannedOrganization, STORAGE_KEY } from './types';

export const getInitialPlans = (): PlannedOrganization[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    console.log('📦 Loading from localStorage:', saved);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('✅ Parsed plans:', parsed);
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load plans:', error);
  }
  console.log('⚠️ No plans found, returning empty array');
  return [];
};

export const getMoscowDate = () => {
  const moscowTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' });
  const [month, day, year] = moscowTime.split('/');
  return `${year}-${month}-${day}`;
};

export const getWeekDates = (weekOffset: number = 0) => {
  const today = new Date(getMoscowDate());
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setDate(monday.getDate() + (weekOffset * 7));
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

export const getDayName = (dateStr: string) => {
  const date = new Date(dateStr);
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return days[date.getDay()];
};

export const getMonthDay = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.getDate();
};

export const getWeekLabel = (weekDates: string[]) => {
  const firstDate = new Date(weekDates[0]);
  const lastDate = new Date(weekDates[6]);
  const firstDay = firstDate.getDate();
  const lastDay = lastDate.getDate();
  const month = firstDate.toLocaleDateString('ru-RU', { month: 'long' });
  const year = firstDate.getFullYear();
  
  if (firstDate.getMonth() === lastDate.getMonth()) {
    return `${firstDay}–${lastDay} ${month} ${year}`;
  } else {
    const month2 = lastDate.toLocaleDateString('ru-RU', { month: 'long' });
    return `${firstDay} ${month} – ${lastDay} ${month2} ${year}`;
  }
};
