export const toMoscowTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  
  const moscowOffset = 3 * 60;
  const localOffset = date.getTimezoneOffset();
  const totalOffset = moscowOffset + localOffset;
  
  const moscowDate = new Date(date.getTime() + totalOffset * 60 * 1000);
  
  return moscowDate.toISOString().split('T')[0];
};

export const formatMoscowDate = (dateStr: string, options?: Intl.DateTimeFormatOptions): string => {
  const moscowDateStr = toMoscowTime(dateStr);
  const date = new Date(moscowDateStr + 'T00:00:00');
  
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options
  });
};
