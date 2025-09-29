/**
 * Форматирует дату в московское время
 */
export function formatMoscowTime(dateString: string, format: 'time' | 'datetime' = 'time'): string {
  const date = new Date(dateString);
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  if (format === 'datetime') {
    options.day = '2-digit';
    options.month = '2-digit';
    options.year = 'numeric';
  }
  
  return new Intl.DateTimeFormat('ru-RU', options).format(date);
}

/**
 * Форматирует дату для отображения в списке диалогов
 */
export function formatChatListTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  
  const moscowDate = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  const moscowNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  
  const diffMs = moscowNow.getTime() - moscowDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Сегодня - показываем только время
    return formatMoscowTime(dateString, 'time');
  } else if (diffDays === 1) {
    // Вчера
    return 'Вчера';
  } else if (diffDays < 7) {
    // На этой неделе - показываем день недели
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow',
      weekday: 'short',
    }).format(date);
  } else {
    // Давно - показываем дату
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit',
      month: '2-digit',
    }).format(date);
  }
}