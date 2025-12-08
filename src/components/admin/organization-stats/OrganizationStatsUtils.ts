export const getAvailableWeeks = () => {
  const weeks = [];
  const now = new Date();
  
  const currentDayOfWeek = now.getDay();
  const daysSinceMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
  
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - daysSinceMonday);
  thisMonday.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 12; i++) {
    const weekStart = new Date(thisMonday);
    weekStart.setDate(thisMonday.getDate() - (i * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    weeks.push({
      start: weekStart,
      end: weekEnd,
      label: `${weekStart.getDate()}.${String(weekStart.getMonth() + 1).padStart(2, '0')} - ${weekEnd.getDate()}.${String(weekEnd.getMonth() + 1).padStart(2, '0')}`
    });
  }
  
  return weeks;
};

export const getAvailableMonths = () => {
  const months = [];
  const now = new Date();
  
  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      date: monthDate,
      label: monthDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
    });
  }
  
  return months;
};

export const getAvailableYears = (orgStatsData: any[]) => {
  const years = [];
  const currentYear = new Date().getFullYear();
  const oldestDataYear = orgStatsData.length > 0 
    ? new Date(orgStatsData[orgStatsData.length - 1].date).getFullYear()
    : currentYear;
  
  for (let year = currentYear; year >= Math.max(oldestDataYear, currentYear - 5); year--) {
    years.push(year);
  }
  
  return years;
};

export const ORG_COLORS: Record<string, string> = {
  'Сотка': '#10b981',
  'ТОП (Академическая)': '#3b82f6',
  'ТОП (Беляево)': '#6366f1',
  'ТОП (Коломенская)': '#8b5cf6',
  'ТОП (Юго-Западная)': '#a855f7',
  'ТОП (Речной Вокзал)': '#ec4899',
  'ТОП (Домодедовская)': '#f59e0b',
  'ТОП (Митино)': '#ef4444',
  'ТОП (Перово)': '#14b8a6',
  'ТОП (Реутов)': '#06b6d4',
  'ТОП (Тушинская)': '#84cc16',
  'ТОП (Ногинск)': '#f97316',
  'ТОП (Воскресенск)': '#d946ef',
  'KIBERONE (Бабушкинская)': '#0891b2',
  'KIBERONE (Бибирево)': '#7c3aed',
  'KIBERONE (Деловой Центр)': '#dc2626',
  'KIBERONE (Электросталь)': '#ca8a04',
  'WORKOUT ANT': '#16a34a',
  'Не указана': '#9ca3af'
};
