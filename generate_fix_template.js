import fs from 'fs';

/**
 * This script generates SQL fix templates for duplicates
 * Usage: Manually add duplicate records to the duplicates array below
 * Format: { date: 'DD.MM.YYYY', sqlDate: 'YYYY-MM-DD', organization: 'Name', promoter: 'Name', expectedCount: X, actualCount: Y }
 */

// MANUALLY ADD DUPLICATES HERE (from verification query results)
const duplicates = [
  // Example:
  // { date: '01.06.2025', sqlDate: '2025-06-01', organization: 'Воркаут Царицыно', promoter: 'Артём', expectedCount: 5, actualCount: 10 },
];

console.log(`Generating fix statements for ${duplicates.length} duplicates...\n`);

const fixStatements = [];
fixStatements.push('-- Исправляем дубликаты в июне, июле и августе: деактивируем лишние записи');
fixStatements.push('-- Generated on ' + new Date().toISOString());
fixStatements.push('');

for (const dup of duplicates) {
  fixStatements.push(`-- ${dup.date} | ${dup.organization} | ${dup.promoter}: оставить ${dup.expectedCount} из ${dup.actualCount}`);
  fixStatements.push(`WITH ranked AS (`);
  fixStatements.push(`  SELECT l.id, ROW_NUMBER() OVER (ORDER BY l.id ASC) as rn`);
  fixStatements.push(`  FROM t_p24058207_website_creation_pro.leads_analytics l`);
  fixStatements.push(`  JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id`);
  fixStatements.push(`  JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id`);
  fixStatements.push(`  WHERE l.is_active = true`);
  fixStatements.push(`    AND l.lead_type = 'контакт'`);
  fixStatements.push(`    AND DATE(l.created_at + interval '3 hours') = '${dup.sqlDate}'`);
  fixStatements.push(`    AND o.name = '${dup.organization.replace(/'/g, "''")}'`);
  fixStatements.push(`    AND u.name = '${dup.promoter.replace(/'/g, "''")}'`);
  fixStatements.push(`)`);
  fixStatements.push(`UPDATE t_p24058207_website_creation_pro.leads_analytics`);
  fixStatements.push(`SET is_active = false`);
  fixStatements.push(`WHERE id IN (SELECT id FROM ranked WHERE rn > ${dup.expectedCount});`);
  fixStatements.push('');
}

if (duplicates.length > 0) {
  fs.writeFileSync('fix_june_august_duplicates.sql', fixStatements.join('\n'));
  console.log('SQL fix statements written to: fix_june_august_duplicates.sql\n');
  console.log(fixStatements.join('\n'));
} else {
  console.log('No duplicates specified. Add them to the duplicates array in this script.');
}
