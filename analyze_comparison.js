#!/usr/bin/env node
/**
 * Comprehensive comparison of Excel table with database
 */

const fs = require('fs');

// Full table data from user (23 rows provided)
const TABLE_DATA = `15.03.2025	Вероника	3
18.03.2025	Арсен	15
22.03.2025	Наталия	4
23.03.2025	Арсен	5
26.03.2025	Влад	10
26.03.2025	Злата	9
28.03.2025	Марина	7
28.03.2025	Дмитрий	5
29.03.2025	Александр	19
31.03.2025	Влад	17
31.03.2025	Злата	26
31.03.2025	Александр	16
31.03.2025	Дима	2
02.04.2025	Александр	4
03.04.2025	Злата	2
03.04.2025	Александр	5
04.04.2025	Владимир	2
04.04.2025	Евгения	5
05.04.2025	Жаркынай	5
07.04.2025	Тихон	9
07.04.2025	Артём	1
07.04.2025	Дмитрий	1
07.04.2025	Марина	6`;

async function analyzeComparison() {
  try {
    // Fetch database records
    console.log('Загрузка данных из базы данных...');
    const response = await fetch('https://functions.poehali.dev/21cf6c5f-30ec-4a13-bbbe-369db6a0b051');
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to fetch database records');
    }
    
    const dbRecords = result.records;
    console.log(`Загружено ${dbRecords.length} записей из БД`);
    
    // Parse table data
    const tableRecords = [];
    for (const line of TABLE_DATA.trim().split('\n')) {
      const parts = line.split('\t');
      if (parts.length === 3) {
        const [dateStr, promoter, count] = parts;
        const [day, month, year] = dateStr.split('.');
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        tableRecords.push({
          date: isoDate,
          promoter_name: promoter.trim(),
          contact_count: parseInt(count.trim())
        });
      }
    }
    console.log(`Обработано ${tableRecords.length} записей из таблицы\n`);
    
    // Create indexed maps (key = date|promoter_name)
    const tableMap = new Map();
    const dbMap = new Map();
    
    // Index table records
    for (const rec of tableRecords) {
      const key = `${rec.date}|${rec.promoter_name}`;
      if (!tableMap.has(key)) {
        tableMap.set(key, []);
      }
      tableMap.get(key).push(rec);
    }
    
    // Index DB records
    for (const rec of dbRecords) {
      const key = `${rec.date}|${rec.promoter_name}`;
      if (!dbMap.has(key)) {
        dbMap.set(key, []);
      }
      dbMap.get(key).push(rec);
    }
    
    // Perform analysis
    const missing = [];
    const mismatches = [];
    const perfectMatches = [];
    
    // Check each table record
    for (const [key, tableRecs] of tableMap.entries()) {
      const [date, promoter] = key.split('|');
      const tableTotal = tableRecs.reduce((sum, r) => sum + r.contact_count, 0);
      
      if (!dbMap.has(key)) {
        // Record missing in DB
        missing.push({
          date,
          promoter_name: promoter,
          table_count: tableTotal
        });
      } else {
        // Record exists, check if counts match
        const dbRecs = dbMap.get(key);
        const dbTotal = dbRecs.reduce((sum, r) => sum + r.contact_count, 0);
        
        if (tableTotal === dbTotal) {
          perfectMatches.push({
            date,
            promoter_name: promoter,
            count: tableTotal
          });
        } else {
          mismatches.push({
            date,
            promoter_name: promoter,
            table_count: tableTotal,
            db_count: dbTotal,
            difference: tableTotal - dbTotal
          });
        }
      }
    }
    
    // Generate report
    let report = '';
    report += '='.repeat(100) + '\n';
    report += 'СРАВНЕНИЕ ДАННЫХ ТАБЛИЦЫ С БАЗОЙ ДАННЫХ archive_leads_analytics\n';
    report += '='.repeat(100) + '\n\n';
    
    report += 'КРИТИЧЕСКИЕ ПРАВИЛА СРАВНЕНИЯ:\n';
    report += '  • "Ярослав" и "Ярослав Демкин" - это РАЗНЫЕ промоутеры\n';
    report += '  • "Михаил" и "Михаил Г" - это РАЗНЫЕ промоутеры\n';
    report += '  • Только точное совпадение имён считается одним промоутером\n\n';
    
    report += '='.repeat(100) + '\n';
    report += '📊 ИТОГОВАЯ СТАТИСТИКА\n';
    report += '='.repeat(100) + '\n\n';
    report += `  Всего строк в таблице:                ${tableRecords.length}\n`;
    report += `  Всего строк в БД:                     ${dbRecords.length}\n`;
    report += `  Уникальных записей в таблице:         ${tableMap.size}\n`;
    report += `  Уникальных записей в БД:              ${dbMap.size}\n\n`;
    report += `  ✅ Идеальных совпадений:              ${perfectMatches.length}\n`;
    report += `  ❌ Записей отсутствует в БД:          ${missing.length}\n`;
    report += `  ⚠️  Несовпадений по количеству:        ${mismatches.length}\n\n`;
    
    // Missing records
    if (missing.length > 0) {
      report += '='.repeat(100) + '\n';
      report += '❌ ЗАПИСИ ОТСУТСТВУЮЩИЕ В БД (есть в таблице, нет в базе данных)\n';
      report += '='.repeat(100) + '\n\n';
      report += '  Дата       | Промоутер              | Количество\n';
      report += '  ' + '-'.repeat(96) + '\n';
      for (const rec of missing) {
        report += `  ${rec.date} | ${rec.promoter_name.padEnd(22)} | ${rec.table_count}\n`;
      }
      report += '\n';
    } else {
      report += '✅ Нет отсутствующих записей - все данные из таблицы присутствуют в БД\n\n';
    }
    
    // Mismatches
    if (mismatches.length > 0) {
      report += '='.repeat(100) + '\n';
      report += '⚠️  НЕСОВПАДЕНИЯ ПО КОЛИЧЕСТВУ КОНТАКТОВ\n';
      report += '='.repeat(100) + '\n\n';
      report += '  Дата       | Промоутер              | Таблица | БД  | Разница\n';
      report += '  ' + '-'.repeat(96) + '\n';
      for (const rec of mismatches) {
        const diff = rec.difference >= 0 ? `+${rec.difference}` : `${rec.difference}`;
        report += `  ${rec.date} | ${rec.promoter_name.padEnd(22)} | ${String(rec.table_count).padStart(7)} | ${String(rec.db_count).padStart(3)} | ${String(diff).padStart(7)}\n`;
      }
      report += '\n';
    } else {
      report += '✅ Нет несовпадений - все совпадающие записи имеют одинаковое количество контактов\n\n';
    }
    
    // Perfect matches (first 10)
    if (perfectMatches.length > 0) {
      report += '='.repeat(100) + '\n';
      report += '✅ ПЕРВЫЕ 10 ПРИМЕРОВ ИДЕАЛЬНЫХ СОВПАДЕНИЙ (для валидации)\n';
      report += '='.repeat(100) + '\n\n';
      report += '  Дата       | Промоутер              | Количество\n';
      report += '  ' + '-'.repeat(96) + '\n';
      for (let i = 0; i < Math.min(10, perfectMatches.length); i++) {
        const match = perfectMatches[i];
        report += `  ${match.date} | ${match.promoter_name.padEnd(22)} | ${match.count}\n`;
      }
      report += '\n';
    }
    
    report += '='.repeat(100) + '\n';
    report += '✓ АНАЛИЗ ЗАВЕРШЁН\n';
    report += '='.repeat(100) + '\n';
    
    // Output report
    console.log(report);
    
    // Save to file
    fs.writeFileSync('comparison_report.txt', report, 'utf8');
    console.log('\n📄 Отчёт сохранён в файл: comparison_report.txt\n');
    
    // Also save detailed JSON
    const detailedData = {
      summary: {
        table_rows: tableRecords.length,
        db_rows: dbRecords.length,
        table_unique: tableMap.size,
        db_unique: dbMap.size,
        perfect_matches: perfectMatches.length,
        missing_in_db: missing.length,
        mismatches: mismatches.length
      },
      missing_records: missing,
      mismatched_records: mismatches,
      perfect_matches: perfectMatches
    };
    
    fs.writeFileSync('comparison_details.json', JSON.stringify(detailedData, null, 2), 'utf8');
    console.log('📄 Детальные данные сохранены в файл: comparison_details.json\n');
    
  } catch (error) {
    console.error('Ошибка:', error.message);
    process.exit(1);
  }
}

// Run analysis
analyzeComparison();
