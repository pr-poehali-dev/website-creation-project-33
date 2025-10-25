#!/usr/bin/env bun
import fs from 'fs';

// Read user_list.txt and extract June-August records
const content = fs.readFileSync('user_list.txt', 'utf-8');
const lines = content.split('\n').filter(line => line.trim());

const records = [];

console.log('Extracting June-August 2025 records from user_list.txt...\n');

for (const line of lines) {
  const parts = line.split('\t').filter(p => p.trim());
  if (parts.length < 4) continue;
  
  const dateStr = parts[0].trim();
  const organization = parts[1].trim();
  const promoter = parts[2].trim();
  const countStr = parts[3].trim();
  
  // Check if date is in June, July, or August 2025
  if (dateStr.match(/^(0[1-9]|[12][0-9]|3[01])\.(06|07|08)\.2025$/)) {
    const count = parseInt(countStr);
    if (!isNaN(count) && count > 0) {
      const [day, month, year] = dateStr.split('.');
      const sqlDate = `${year}-${month}-${day}`;
      
      records.push({
        date: dateStr,
        sqlDate,
        organization,
        promoter,
        expectedCount: count
      });
      
      console.log(`${dateStr} | ${organization.padEnd(30)} | ${promoter.padEnd(25)} | ${count}`);
    }
  }
}

console.log(`\n\nTotal records found: ${records.length}`);

// Count by month
const june = records.filter(r => r.sqlDate.startsWith('2025-06')).length;
const july = records.filter(r => r.sqlDate.startsWith('2025-07')).length;
const august = records.filter(r => r.sqlDate.startsWith('2025-08')).length;

console.log(`\nBreakdown by month:`);
console.log(`  June 2025:   ${june} records`);
console.log(`  July 2025:   ${july} records`);
console.log(`  August 2025: ${august} records`);

// Save records to JSON for easy processing
fs.writeFileSync('june_august_records.json', JSON.stringify(records, null, 2));
console.log(`\nRecords saved to: june_august_records.json`);
