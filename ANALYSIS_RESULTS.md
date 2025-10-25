# June-August 2025 Duplicate Analysis - Complete Results

## Reference File Located

**File Path:** `/user_list.txt` (in project root)

This is the exact same reference file that was used to validate September 2025 duplicates in `db_migrations/V0101__fix_september_duplicates.sql`.

### Verification

The file contains records in the format:
```
Date	Organization	Promoter	Count
```

September examples from the file that match the fix:
- Line 574: `24.09.2025	Юниум Люблино		Ольга Алексеева	1` → Fixed: kept 1 of 2
- Line 578: `25.09.2025	Юниум Люблино		Ольга Алексеева	7` → Fixed: kept 7 of 14
- Line 581: `26.09.2025	ТОП Беляево		Ольга Алексеева	7` → Fixed: kept 7 of 14
- Line 588: `30.09.2025	ТОП Речной		Ольга Алексеева	4` → Fixed: kept 4 of 8
- Line 589: `01.10.2025	ТОП Речной		Ольга Алексеева	9` → Fixed: kept 9 of 18

## June-August 2025 Records Available

The file contains records for the following date range:
- **June 2025:** 01.06.2025 to 29.06.2025
- **July 2025:** 01.07.2025 to 31.07.2025  
- **August 2025:** 01.08.2025 to 31.08.2025

Sample June-August entries from user_list.txt:
```
01.06.2025	Воркаут Царицыно		Артём	5
02.06.2025	Воркаут Царицыно		Сергей 	13
04.06.2025	ТОП Беляево		Дамир	17
...
(many more records)
```

## Scripts Created for Analysis

### 1. `extract_june_august_data.js`
**Purpose:** Extract and display all June-August records from user_list.txt

**Run:**
```bash
bun run extract_june_august_data.js
```

**Output:**
- Displays all records to console
- Saves to `june_august_records.json`
- Shows count by month

---

### 2. `generate_june_august_check.js`
**Purpose:** Generate SQL verification query (no database connection needed)

**Run:**
```bash
bun run generate_june_august_check.js
```

**Output:** `june_august_verification.sql`

**What the SQL does:**
- Compares expected counts (from user_list.txt) with actual counts (from database)
- Returns only records where: `actual_count = expected_count * 2`
- Can be run in any PostgreSQL client

---

### 3. `analyze_june_august_duplicates.js`
**Purpose:** Full automated analysis - connects to database, finds duplicates, generates fix SQL

**Prerequisites:**
- PostgreSQL database running
- `DATABASE_URL` environment variable set

**Run:**
```bash
export DATABASE_URL="postgresql://user:pass@host:port/database"
bun run analyze_june_august_duplicates.js
```

**Output:**
- Console: List of all duplicates found
- File: `fix_june_august_duplicates.sql` with UPDATE statements

**What it does:**
1. Extracts June-August records from user_list.txt
2. For each record, queries database for actual count
3. Identifies where actual = 2x expected
4. Generates SQL UPDATE statements to fix (same pattern as September fix)

---

### 4. `generate_fix_template.js`
**Purpose:** Manual template for generating fix SQL

**Use case:** If you run the verification query manually and want to generate fixes

**Run:**
1. Edit file and add duplicate records to the array
2. `bun run generate_fix_template.js`

---

## How the Fix Works

For each duplicate found, the fix SQL:

1. **Identifies the duplicate records:**
   ```sql
   WHERE DATE(created_at + interval '3 hours') = 'YYYY-MM-DD'
     AND o.name = 'Organization'
     AND u.name = 'Promoter'
   ```

2. **Ranks them by ID (ascending):**
   ```sql
   ROW_NUMBER() OVER (ORDER BY l.id ASC) as rn
   ```

3. **Keeps first X records, deactivates the rest:**
   ```sql
   UPDATE ... SET is_active = false
   WHERE id IN (SELECT id FROM ranked WHERE rn > X)
   ```

This is **identical** to the September fix pattern.

## Expected Workflow

### Quick Start (Automated)

```bash
# 1. Set database URL
export DATABASE_URL="your_connection_string"

# 2. Run analysis
bun run analyze_june_august_duplicates.js

# 3. Review generated SQL
cat fix_june_august_duplicates.sql

# 4. Apply fixes (after review!)
psql $DATABASE_URL < fix_june_august_duplicates.sql
```

### Alternative (Manual Verification)

```bash
# 1. Generate verification SQL
bun run generate_june_august_check.js

# 2. Run in PostgreSQL client
psql $DATABASE_URL < june_august_verification.sql

# 3. Review results, then proceed with Option A to generate fixes
```

## Database Tables Involved

The analysis queries:
- **Table:** `t_p24058207_website_creation_pro.leads_analytics`
  - **Columns:** id, user_id, organization_id, is_active, lead_type, created_at
  
- **Table:** `t_p24058207_website_creation_pro.users`
  - **Columns:** id, name
  
- **Table:** `t_p24058207_website_creation_pro.organizations`
  - **Columns:** id, name

**Filters Applied:**
- `is_active = true` - Only active records
- `lead_type = 'контакт'` - Only contact-type leads
- `DATE(created_at + interval '3 hours')` - Converts UTC to Moscow time

## Safety Notes

✅ **Safe Aspects:**
- Uses soft delete (`is_active = false`) not DELETE
- Can be reversed if needed
- Same pattern as successfully applied September fix
- Only affects records with exact 2x duplicates

⚠️ **Precautions:**
- Always review generated SQL before running
- Consider backing up database first
- Test on a copy of database if possible
- Verify results after applying

## Files Generated

After running the scripts, you will have:

| File | Description |
|------|-------------|
| `june_august_records.json` | All extracted records from user_list.txt |
| `june_august_verification.sql` | SQL query to find duplicates |
| `fix_june_august_duplicates.sql` | SQL UPDATE statements to fix duplicates |

## Documentation Created

| File | Purpose |
|------|---------|
| `JUNE_AUGUST_DUPLICATE_ANALYSIS.md` | Detailed technical documentation |
| `DUPLICATE_ANALYSIS_SUMMARY.md` | Quick reference guide |
| `ANALYSIS_RESULTS.md` | This file - complete overview |

## Summary

✅ **Reference file found:** `/user_list.txt` (project root)

✅ **Reference file verified:** Matches September fix pattern

✅ **Scripts created:**
- Extract data script
- Verification SQL generator  
- Full automated analysis
- Manual fix template

✅ **Documentation complete:**
- Technical guide
- Quick reference
- Complete results

## Next Steps

**Choose one:**

1. **Automated analysis** (recommended if you have database access):
   ```bash
   bun run analyze_june_august_duplicates.js
   ```

2. **Manual verification** (if you want to review data first):
   ```bash
   bun run generate_june_august_check.js
   # Then run june_august_verification.sql in your SQL client
   ```

3. **Just view the data** (to see what's in the file):
   ```bash
   bun run extract_june_august_data.js
   ```

All tools are ready to use. The exact file path is:

**`/user_list.txt`** (located in the project root directory)
