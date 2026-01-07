export const getMoscowDate = (): Date => {
  // Получаем текущую дату и время в московской таймзоне
  const moscowTimeStr = new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' });
  return new Date(moscowTimeStr);
};

export const getMondayOfWeek = (date: Date): Date => {
  // Создаем дату в московском времени
  const year = date.getFullYear();
  const month = date.getMonth();
  const day_of_month = date.getDate();
  
  // Создаем новую дату без влияния таймзоны
  const localDate = new Date(year, month, day_of_month);
  
  const dayOfWeek = localDate.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(localDate);
  monday.setDate(localDate.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getAllWeeksUntilEndOfYear = () => {
  const weeks = [];
  const startDate = new Date('2026-01-05');  // Понедельник 05.01.2026
  const endOfYear = new Date('2026-12-31');
  
  let currentMonday = new Date(startDate);
  
  while (currentMonday <= endOfYear) {
    const weekEnd = new Date(currentMonday);
    weekEnd.setDate(currentMonday.getDate() + 6);
    
    const startMonth = (currentMonday.getMonth() + 1).toString().padStart(2, '0');
    const startDay = currentMonday.getDate().toString().padStart(2, '0');
    const endMonth = (weekEnd.getMonth() + 1).toString().padStart(2, '0');
    const endDay = weekEnd.getDate().toString().padStart(2, '0');
    
    weeks.push({
      start: formatDateLocal(currentMonday),
      label: `${startDay}.${startMonth} - ${endDay}.${endMonth}`
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
  
  console.log('🔍 Текущая дата (Москва):', formatDateLocal(moscowDate));
  console.log('🔍 Понедельник текущей недели:', currentMondayStr);
  console.log('🔍 Все недели:', weeks.map(w => w.start));
  
  const index = weeks.findIndex(week => week.start === currentMondayStr);
  console.log('🔍 Найденный индекс недели:', index);
  
  return index >= 0 ? index : 0;
};
