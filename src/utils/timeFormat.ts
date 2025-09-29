/**
 * Форматирует дату в московское время
 */
export function formatMoscowTime(dateString: string, format: 'time' | 'datetime' | 'date' = 'time'): string {
  // Убедимся что строка заканчивается на Z (UTC) или добавим её
  const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  const date = new Date(utcDateString);
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  if (format === 'datetime') {
    options.day = '2-digit';
    options.month = '2-digit';
    options.year = 'numeric';
  } else if (format === 'date') {
    delete options.hour;
    delete options.minute;
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
  const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  const date = new Date(utcDateString);
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

/**
 * Форматирует последний визит пользователя в удобной форме
 */
export function formatLastSeen(dateString: string): string {
  const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  const date = new Date(utcDateString);
  const now = new Date();
  
  const moscowDate = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  const moscowNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  
  const diffMs = moscowNow.getTime() - moscowDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) {
    return 'Только что';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} мин. назад`;
  } else if (diffHours < 24) {
    return `${diffHours} ч. назад`;
  } else if (diffDays === 1) {
    return `Вчера в ${formatMoscowTime(dateString, 'time')}`;
  } else {
    return formatMoscowTime(dateString, 'datetime');
  }
}