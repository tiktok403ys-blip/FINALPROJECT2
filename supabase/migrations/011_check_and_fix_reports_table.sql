-- Check and Fix Reports Table Structure
-- Run this in Supabase SQL Editor
-- This script first checks the actual table structure

-- 1. First, let's see what columns actually exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Let's also see what data is currently in the table
SELECT * FROM reports LIMIT 3;

-- 3. Check if we need to rename or modify existing columns
-- (This will be determined after we see the actual structure)

-- 4. If the table structure is completely different, we might need to:
-- Option A: Rename existing table and create new one
-- Option B: Add missing columns to existing table
-- Option C: Drop and recreate table (if no important data)

-- Let's see what we're working with first...
SELECT 'Please check the results above to see the actual table structure' as instruction;
