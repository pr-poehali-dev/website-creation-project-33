import fs from 'fs';
import pg from 'pg';
const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/website_creation_pro'
});

async function analyzeJuneAugustDuplicates() {
  try {
    // Read user_list.txt
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
            organization,
            promoter,
            expectedCount: count,
            sqlDate
          });
        }
      }
    }
    
    console.log(`Found ${expectedRecords.length} expected records for June-August 2025\n`);
    console.log('Querying database for actual counts...\n');
    
    // Query database for actual counts
    const duplicates = [];
    let processed = 0;
    
    for (const record of expectedRecords) {
      const query = `
        SELECT COUNT(*) as actual_count
        FROM t_p24058207_website_creation_pro.leads_analytics l
        JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
        JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
        WHERE l.is_active = true 
          AND l.lead_type = 'контакт'
          AND DATE(l.created_at + interval '3 hours') = $1
          AND o.name = $2
          AND u.name = $3
      `;
      
      const result = await pool.query(query, [record.sqlDate, record.organization, record.promoter]);
      const actualCount = parseInt(result.rows[0].actual_count);
      
      processed++;
      if (processed % 50 === 0) {
        console.log(`Processed ${processed}/${expectedRecords.length} records...`);
      }
      
      // Check if actual is exactly 2x expected
      if (actualCount === record.expectedCount * 2) {
        duplicates.push({
          ...record,
          actualCount
        });
        console.log(`DUPLICATE FOUND: ${record.date} | ${record.organization} | ${record.promoter} | Expected: ${record.expectedCount}, Actual: ${actualCount}`);
      } else if (actualCount !== record.expectedCount && actualCount > 0) {
        // Also log mismatches for investigation
        console.log(`MISMATCH: ${record.date} | ${record.organization} | ${record.promoter} | Expected: ${record.expectedCount}, Actual: ${actualCount}`);
      }
    }
    
    console.log(`\n\n========================================`);
    console.log(`Total duplicates found (2x): ${duplicates.length}`);
    console.log(`========================================\n\n`);
    
    // Generate SQL fix statements
    if (duplicates.length > 0) {
      const fixStatements = [];
      fixStatements.push('-- Исправляем дубликаты в июне, июле и августе: деактивируем лишние записи');
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
      
      // Write to file
      fs.writeFileSync('fix_june_august_duplicates.sql', fixStatements.join('\n'));
      console.log('SQL fix statements written to: fix_june_august_duplicates.sql\n');
      
      // Also print to console
      console.log(fixStatements.join('\n'));
    } else {
      console.log('No duplicates found!');
    }
    
  } catch (error) {
    console.error('Error:', error);
    if (error.code === 'ECONNREFUSED') {
      console.error('\nDatabase connection failed. Make sure:');
      console.error('1. PostgreSQL is running');
      console.error('2. DATABASE_URL environment variable is set correctly');
      console.error('3. Or update the connection string in the script');
    }
  } finally {
    await pool.end();
  }
}

analyzeJuneAugustDuplicates();