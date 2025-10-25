import fs from 'fs';

// Read user_list.txt and generate SQL verification query
const content = fs.readFileSync('user_list.txt', 'utf-8');
const lines = content.split('\n').filter(line => line.trim());

// Parse records for June, July, August 2025
const expectedRecords = [];

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
      // Convert DD.MM.YYYY to YYYY-MM-DD for SQL
      const [day, month, year] = dateStr.split('.');
      const sqlDate = `${year}-${month}-${day}`;
      
      expectedRecords.push({
        date: dateStr,
        sqlDate,
        organization,
        promoter,
        expectedCount: count
      });
    }
  }
}

console.log(`Found ${expectedRecords.length} expected records for June-August 2025\n`);

// Generate SQL verification query
const sqlContent = [];
sqlContent.push('-- VERIFICATION QUERY FOR JUNE-AUGUST 2025 DUPLICATES');
sqlContent.push('-- Generated on ' + new Date().toISOString());
sqlContent.push('-- Run this query to find all records where actual count = 2x expected count');
sqlContent.push('');
sqlContent.push('WITH expected_data AS (');
sqlContent.push('  SELECT * FROM (VALUES');

expectedRecords.forEach((record, index) => {
  const comma = index < expectedRecords.length - 1 ? ',' : '';
  sqlContent.push(`    ('${record.sqlDate}', '${record.organization.replace(/'/g, "''")}', '${record.promoter.replace(/'/g, "''")}', ${record.expectedCount})${comma}`);
});

sqlContent.push('  ) AS t(expected_date, organization_name, promoter_name, expected_count)');
sqlContent.push('),');
sqlContent.push('actual_counts AS (');
sqlContent.push('  SELECT ');
sqlContent.push("    DATE(l.created_at + interval '3 hours') as actual_date,");
sqlContent.push('    o.name as organization_name,');
sqlContent.push('    u.name as promoter_name,');
sqlContent.push('    COUNT(*) as actual_count');
sqlContent.push('  FROM t_p24058207_website_creation_pro.leads_analytics l');
sqlContent.push('  JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id');
sqlContent.push('  JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id');
sqlContent.push('  WHERE l.is_active = true');
sqlContent.push("    AND l.lead_type = 'контакт'");
sqlContent.push("    AND DATE(l.created_at + interval '3 hours') BETWEEN '2025-06-01' AND '2025-08-31'");
sqlContent.push('  GROUP BY actual_date, o.name, u.name');
sqlContent.push(')');
sqlContent.push('SELECT ');
sqlContent.push('  e.expected_date,');
sqlContent.push('  e.organization_name,');
sqlContent.push('  e.promoter_name,');
sqlContent.push('  e.expected_count,');
sqlContent.push('  COALESCE(a.actual_count, 0) as actual_count');
sqlContent.push('FROM expected_data e');
sqlContent.push('LEFT JOIN actual_counts a ON ');
sqlContent.push('  e.expected_date = a.actual_date');
sqlContent.push('  AND e.organization_name = a.organization_name');
sqlContent.push('  AND e.promoter_name = a.promoter_name');
sqlContent.push("WHERE COALESCE(a.actual_count, 0) = e.expected_count * 2  -- Only show exact 2x duplicates");
sqlContent.push('ORDER BY e.expected_date, e.organization_name, e.promoter_name;');

fs.writeFileSync('june_august_verification.sql', sqlContent.join('\n'));
console.log('SQL verification query saved to: june_august_verification.sql');
console.log('\nNext steps:');
console.log('1. Run june_august_verification.sql in your PostgreSQL database');
console.log('2. Review the results to confirm which records are duplicates');
console.log('3. Then run: node generate_june_august_fix.js <results.json>');
console.log('   (where results.json contains the query results)');
