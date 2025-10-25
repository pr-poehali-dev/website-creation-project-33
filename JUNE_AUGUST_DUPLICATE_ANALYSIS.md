# June-August 2025 Duplicate Analysis

## Overview

This analysis identifies duplicate contact records in the database for June, July, and August 2025 by comparing expected counts from `user_list.txt` with actual counts in the database.

## Reference Data Source

**File:** `/user_list.txt` (located in project root)

This file contains reference contact data with:
- Dates (DD.MM.YYYY format)
- Organization names
- Promoter names  
- Expected contact counts

The same file was used to validate and fix September 2025 duplicates (see `db_migrations/V0101__fix_september_duplicates.sql`).

## Analysis Scripts

### 1. `generate_june_august_check.js`
**Purpose:** Generates SQL verification query without needing database connection

**Usage:**
```bash
node generate_june_august_check.js
```

**Output:** `june_august_verification.sql` - SQL query to find all 2x duplicates

**What it does:**
- Parses `user_list.txt` for June-August 2025 records
- Generates a SQL query that compares expected vs actual counts
- Identifies records where actual count = 2x expected count

---

### 2. `analyze_june_august_duplicates.js`
**Purpose:** Connects to database, finds duplicates, and generates fix SQL

**Prerequisites:**
- PostgreSQL database must be running
- `DATABASE_URL` environment variable must be set, OR
- Update connection string in the script

**Usage:**
```bash
# Set database URL (if not already set)
export DATABASE_URL="postgresql://user:password@host:port/database"

# Run analysis
node analyze_june_august_duplicates.js
```

**Output:** 
- Console output showing all duplicates found
- `fix_june_august_duplicates.sql` - SQL statements to fix the duplicates

**What it does:**
- Parses `user_list.txt` for June-August 2025 records
- Queries database for each date/organization/promoter combination
- Identifies exact 2x duplicates
- Generates SQL UPDATE statements to deactivate excess records

---

### 3. `generate_fix_template.js`
**Purpose:** Manual template generator for fix SQL (if you run verification query manually)

**Usage:**
1. Run `june_august_verification.sql` in your PostgreSQL client
2. Copy the results
3. Edit `generate_fix_template.js` and add duplicate records to the array
4. Run: `node generate_fix_template.js`

---

## Expected Records for June-August 2025

The scripts will extract all records from `user_list.txt` with dates between:
- **Start:** 01.06.2025 (June 1, 2025)
- **End:** 31.08.2025 (August 31, 2025)

## Duplicate Detection Logic

A record is considered a duplicate if:
```
actual_count_in_database = expected_count_from_file * 2
```

This matches the pattern observed in September 2025 duplicates.

## Fix SQL Pattern

For each duplicate found, the fix follows this pattern (same as September fix):

```sql
-- DD.MM.YYYY | Organization | Promoter: оставить X из Y
WITH ranked AS (
  SELECT l.id, ROW_NUMBER() OVER (ORDER BY l.id ASC) as rn
  FROM t_p24058207_website_creation_pro.leads_analytics l
  JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
  JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
  WHERE l.is_active = true
    AND l.lead_type = 'контакт'
    AND DATE(l.created_at + interval '3 hours') = 'YYYY-MM-DD'
    AND o.name = 'Organization Name'
    AND u.name = 'Promoter Name'
)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > X);
```

This keeps the first X records (by ID) and deactivates the rest.

## Recommended Workflow

### Option A: Automatic (with database connection)
```bash
# Install dependencies
npm install pg

# Run analysis
node analyze_june_august_duplicates.js

# Review output
cat fix_june_august_duplicates.sql

# Apply fixes (after review!)
psql $DATABASE_URL < fix_june_august_duplicates.sql
```

### Option B: Manual (without database connection)
```bash
# Generate verification query
node generate_june_august_check.js

# Run in PostgreSQL client
psql $DATABASE_URL < june_august_verification.sql

# Review results, then manually edit generate_fix_template.js
# Add duplicate records to the array

# Generate fix SQL
node generate_fix_template.js

# Apply fixes (after review!)
psql $DATABASE_URL < fix_june_august_duplicates.sql
```

## Database Schema

The analysis queries the following tables:
- `t_p24058207_website_creation_pro.leads_analytics` - Main leads table
- `t_p24058207_website_creation_pro.users` - Promoters/users
- `t_p24058207_website_creation_pro.organizations` - Organizations

Filters applied:
- `is_active = true` - Only active records
- `lead_type = 'контакт'` - Only contact-type leads
- `DATE(created_at + interval '3 hours')` - Date in Moscow timezone

## Safety Notes

1. **Review before applying:** Always review the generated SQL before running it
2. **Backup first:** Consider backing up the database before applying fixes
3. **Test query:** Run a SELECT version first to see which records will be affected
4. **Audit trail:** The UPDATE statements use `is_active = false` (soft delete) rather than DELETE

## Files Generated

- `june_august_verification.sql` - Verification query
- `fix_june_august_duplicates.sql` - Fix statements (if duplicates found)

## Related Files

- `user_list.txt` - Reference data source
- `db_migrations/V0101__fix_september_duplicates.sql` - Similar fix for September
- `db_migrations/V0100__fix_october_duplicates.sql` - Similar fix for October
