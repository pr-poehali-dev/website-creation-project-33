#!/usr/bin/env node

// Full table data from user
const FULL_TABLE_DATA = `15.03.2025	Вероника	3
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

async function main() {
  console.log('\n='.repeat(100));
  console.log('СРАВНЕНИЕ ДАННЫХ ТАБЛИЦЫ С БАЗОЙ ДАННЫХ archive_leads_analytics');
  console.log('='.repeat(100));
  console.log('\nЗагрузка данных из базы данных...\n');
  
  // Fetch DB data
  const response = await fetch('https://functions.poehali.dev/21cf6c5f-30ec-4a13-bbbe-369db6a0b051');
  const result = await response.json();
  const dbRecords = result.records;
  
  // Parse table data
  const tableRecords = [];
  for (const line of FULL_TABLE_DATA.trim().split('\n')) {
    const [dateStr, promoter, count] = line.split('\t');
    const [day, month, year] = dateStr.split('.');
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    tableRecords.push({
      date: isoDate,
      promoter_name: promoter.trim(),
      contact_count: parseInt(count.trim())
    });
  }
  
  // Create indexed maps
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
  
  // Analysis
  const missing = [];
  const mismatches = [];
  const perfectMatches = [];
  
  for (const [key, tableRecs] of tableMap.entries()) {
    const [date, promoter] = key.split('|');
    const tableTotal = tableRecs.reduce((sum, r) => sum + r.contact_count, 0);
    
    if (!dbMap.has(key)) {
      // Missing in DB
      missing.push({ date, promoter_name: promoter, table_count: tableTotal });
    } else {
      // Check if counts match
      const dbRecs = dbMap.get(key);
      const dbTotal = dbRecs.reduce((sum, r) => sum + r.contact_count, 0);
      
      if (tableTotal === dbTotal) {
        perfectMatches.push({ date, promoter_name: promoter, count: tableTotal });
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
  
  // Results
  console.log('='.repeat(100));
  console.log('📊 ИТОГОВАЯ СТАТИСТИКА');
  console.log('='.repeat(100));
  console.log(`\n  Всего строк в таблице:                ${tableRecords.length}`);
  console.log(`  Всего строк в БД:                     ${dbRecords.length}`);
  console.log(`  Уникальных записей в таблице:         ${tableMap.size}`);
  console.log(`  Уникальных записей в БД:              ${dbMap.size}`);
  console.log(`\n  ✅ Идеальных совпадений:              ${perfectMatches.length}`);
  console.log(`  ❌ Записей отсутствует в БД:          ${missing.length}`);
  console.log(`  ⚠️  Несовпадений по количеству:        ${mismatches.length}\n`);
  
  // Missing records
  if (missing.length > 0) {
    console.log('='.repeat(100));
    console.log('❌ ЗАПИСИ ОТСУТСТВУЮЩИЕ В БД (есть в таблице, нет в базе данных)');
    console.log('='.repeat(100));
    console.log('\n  Дата       | Промоутер              | Количество контактов');
    console.log('  ' + '-'.repeat(96));
    for (const rec of missing) {
      console.log(`  ${rec.date} | ${rec.promoter_name.padEnd(22)} | ${rec.table_count}`);
    }
    console.log();
  }
  
  // Mismatches
  if (mismatches.length > 0) {
    console.log('='.repeat(100));
    console.log('⚠️  НЕСОВПАДЕНИЯ ПО КОЛИЧЕСТВУ КОНТАКТОВ (одинаковая дата + промоутер, разное количество)');
    console.log('='.repeat(100));
    console.log('\n  Дата       | Промоутер              | Таблица | БД  | Разница');
    console.log('  ' + '-'.repeat(96));
    for (const rec of mismatches) {
      const diff = rec.difference >= 0 ? `+${rec.difference}` : rec.difference;
      console.log(`  ${rec.date} | ${rec.promoter_name.padEnd(22)} | ${String(rec.table_count).padStart(7)} | ${String(rec.db_count).padStart(3)} | ${String(diff).padStart(7)}`);
    }
    console.log();
  }
  
  // Perfect matches
  if (perfectMatches.length > 0) {
    console.log('='.repeat(100));
    console.log('✅ ПЕРВЫЕ 10 ПРИМЕРОВ ИДЕАЛЬНЫХ СОВПАДЕНИЙ (для проверки корректности сравнения)');
    console.log('='.repeat(100));
    console.log('\n  Дата       | Промоутер              | Количество контактов');
    console.log('  ' + '-'.repeat(96));
    for (let i = 0; i < Math.min(10, perfectMatches.length); i++) {
      const match = perfectMatches[i];
      console.log(`  ${match.date} | ${match.promoter_name.padEnd(22)} | ${match.count}`);
    }
    console.log();
  }
  
  console.log('='.repeat(100));
  console.log('✓ АНАЛИЗ ЗАВЕРШЁН');
  console.log('='.repeat(100));
  console.log('\nКРИТИЧЕСКИЕ ПРАВИЛА ПРИМЕНЕНЫ:');
  console.log('  • "Ярослав" и "Ярослав Демкин" считаются РАЗНЫМИ промоутерами');
  console.log('  • "Михаил" и "Михаил Г" считаются РАЗНЫМИ промоутерами');
  console.log('  • Только точное совпадение имён считается одним промоутером\n');
}

main().catch(console.error);
