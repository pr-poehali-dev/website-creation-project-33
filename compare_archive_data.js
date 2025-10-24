#!/usr/bin/env node
/**
 * Compare Excel-like table data with database records
 */

// Table data from user (first 23 rows as provided)
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

function parseTableData(tableText) {
  const records = [];
  const lines = tableText.trim().split('\n');
  
  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length === 3) {
      const [dateStr, promoter, count] = parts;
      // Convert date from DD.MM.YYYY to YYYY-MM-DD
      const [day, month, year] = dateStr.split('.');
      const isoDate = `${year}-${month}-${day}`;
      records.push({
        date: isoDate,
        promoter_name: promoter.trim(),
        contact_count: parseInt(count.trim())
      });
    }
  }
  return records;
}

async function getDbRecords() {
  const url = "https://functions.poehali.dev/21cf6c5f-30ec-4a13-bbbe-369db6a0b051";
  const response = await fetch(url);
  const data = await response.json();
  return data.records;
}

function createRecordKey(record) {
  return `${record.date}|${record.promoter_name}`;
}

async function compareData() {
  console.log("=".repeat(80));
  console.log("СРАВНЕНИЕ ДАННЫХ ТАБЛИЦЫ С БАЗОЙ ДАННЫХ");
  console.log("=".repeat(80));
  console.log();
  
  // Parse table data
  const tableRecords = parseTableData(TABLE_DATA);
  console.log(`📊 Загружено записей из таблицы: ${tableRecords.length}`);
  
  // Get DB records
  const dbRecords = await getDbRecords();
  console.log(`💾 Загружено записей из БД: ${dbRecords.length}`);
  console.log();
  
  // Create lookup dictionaries (using Maps with arrays for duplicates)
  const tableDict = new Map();
  for (const record of tableRecords) {
    const key = createRecordKey(record);
    if (!tableDict.has(key)) {
      tableDict.set(key, []);
    }
    tableDict.get(key).push(record);
  }
  
  const dbDict = new Map();
  for (const record of dbRecords) {
    const key = createRecordKey(record);
    if (!dbDict.has(key)) {
      dbDict.set(key, []);
    }
    dbDict.get(key).push(record);
  }
  
  // Find missing records (in table but not in DB)
  const missingRecords = [];
  for (const [key, records] of tableDict.entries()) {
    if (!dbDict.has(key)) {
      missingRecords.push(...records);
    }
  }
  
  // Find mismatches (same date+promoter but different count)
  const mismatches = [];
  for (const [key, tableRecs] of tableDict.entries()) {
    if (dbDict.has(key)) {
      const dbRecs = dbDict.get(key);
      const tableTotal = tableRecs.reduce((sum, r) => sum + r.contact_count, 0);
      const dbTotal = dbRecs.reduce((sum, r) => sum + r.contact_count, 0);
      
      if (tableTotal !== dbTotal) {
        const [date, promoter] = key.split('|');
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
  
  // Find perfect matches
  const perfectMatches = [];
  for (const [key, tableRecs] of tableDict.entries()) {
    if (dbDict.has(key)) {
      const dbRecs = dbDict.get(key);
      const tableTotal = tableRecs.reduce((sum, r) => sum + r.contact_count, 0);
      const dbTotal = dbRecs.reduce((sum, r) => sum + r.contact_count, 0);
      
      if (tableTotal === dbTotal) {
        const [date, promoter] = key.split('|');
        perfectMatches.push({
          date,
          promoter_name: promoter,
          count: tableTotal
        });
      }
    }
  }
  
  // Print results
  console.log("=".repeat(80));
  console.log("РЕЗУЛЬТАТЫ СРАВНЕНИЯ");
  console.log("=".repeat(80));
  console.log();
  
  console.log(`📈 Всего уникальных записей в таблице: ${tableDict.size}`);
  console.log(`📈 Всего уникальных записей в БД: ${dbDict.size}`);
  console.log(`✅ Идеальных совпадений: ${perfectMatches.length}`);
  console.log(`❌ Записей отсутствует в БД: ${missingRecords.length}`);
  console.log(`⚠️  Несовпадений по количеству: ${mismatches.length}`);
  console.log();
  
  // Print missing records
  if (missingRecords.length > 0) {
    console.log("=".repeat(80));
    console.log("ЗАПИСИ ОТСУТСТВУЮЩИЕ В БД (есть в таблице, нет в базе)");
    console.log("=".repeat(80));
    for (const record of missingRecords) {
      console.log(`  ${record.date} | ${record.promoter_name.padEnd(20)} | ${record.contact_count} контактов`);
    }
    console.log();
  }
  
  // Print mismatches
  if (mismatches.length > 0) {
    console.log("=".repeat(80));
    console.log("НЕСОВПАДЕНИЯ ПО КОЛИЧЕСТВУ КОНТАКТОВ");
    console.log("=".repeat(80));
    for (const mismatch of mismatches) {
      const diff = mismatch.difference >= 0 ? `+${mismatch.difference}` : mismatch.difference;
      console.log(`  ${mismatch.date} | ${mismatch.promoter_name.padEnd(20)} | Таблица: ${String(mismatch.table_count).padStart(3)} | БД: ${String(mismatch.db_count).padStart(3)} | Разница: ${diff.padStart(4)}`);
    }
    console.log();
  }
  
  // Print first 10 perfect matches
  if (perfectMatches.length > 0) {
    console.log("=".repeat(80));
    console.log("ПЕРВЫЕ 10 ПРИМЕРОВ ИДЕАЛЬНЫХ СОВПАДЕНИЙ");
    console.log("=".repeat(80));
    for (let i = 0; i < Math.min(10, perfectMatches.length); i++) {
      const match = perfectMatches[i];
      console.log(`  ✓ ${match.date} | ${match.promoter_name.padEnd(20)} | ${match.count} контактов`);
    }
    console.log();
  }
  
  console.log("=".repeat(80));
  console.log("АНАЛИЗ ЗАВЕРШЁН");
  console.log("=".repeat(80));
}

// Run comparison
compareData().catch(console.error);
