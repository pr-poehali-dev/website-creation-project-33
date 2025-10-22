// Скрипт для импорта архивных данных
// Использование: вставьте CSV данные в массив и вызовите функцию

export async function importArchiveData(csvText: string, sessionToken: string) {
  const lines = csvText.trim().split('\n');
  
  const data = lines.map(line => {
    const parts = line.split('\t');
    if (parts.length < 4) return null;
    
    return {
      datetime: parts[0].trim(),
      organization: parts[1].trim(),
      user: parts[2].trim(),
      count: parts[3].trim()
    };
  }).filter(Boolean);

  try {
    const response = await fetch('https://functions.poehali.dev/94c5eb5a-9182-4dc0-82f0-b4ddbb44acaf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': sessionToken
      },
      body: JSON.stringify({ data })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка импорта');
    }

    const result = await response.json();
    console.log(`✅ Импортировано: ${result.imported} записей`);
    
    if (result.errors && result.errors.length > 0) {
      console.warn('⚠️ Ошибки:', result.errors);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Ошибка импорта:', error);
    throw error;
  }
}

// Пример использования в консоли браузера:
// 1. Откройте консоль браузера (F12)
// 2. Скопируйте CSV данные
// 3. Вставьте в переменную csvData
// 4. Выполните:
/*
const csvData = `15.03.2025 18:09:53	Кид Форс Выхино	Вероника	3
18.03.2025 22:19:14	ШИЯ Солнцево	Арсен	15`;

const sessionToken = localStorage.getItem('session_token');
importArchiveData(csvData, sessionToken).then(r => console.log('Готово!', r));
*/
