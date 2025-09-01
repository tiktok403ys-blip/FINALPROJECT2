-- Fix Reports Table Structure
-- Run this in Supabase SQL Editor
-- This script checks and fixes the reports table structure

-- 1. First, let's check the current table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add missing columns if they don't exist
DO $$
BEGIN
  -- Add category column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE reports ADD COLUMN category TEXT;
  END IF;

  -- Add priority column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' 
    AND column_name = 'priority'
  ) THEN
    ALTER TABLE reports ADD COLUMN priority TEXT DEFAULT 'medium';
  END IF;

  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE reports ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;

  -- Add amount_disputed column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' 
    AND column_name = 'amount_disputed'
  ) THEN
    ALTER TABLE reports ADD COLUMN amount_disputed DECIMAL(10,2);
  END IF;

  -- Add contact_method column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' 
    AND column_name = 'contact_method'
  ) THEN
    ALTER TABLE reports ADD COLUMN contact_method TEXT DEFAULT 'email';
  END IF;

  -- Add resolved_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' 
    AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE reports ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add admin_notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' 
    AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE reports ADD COLUMN admin_notes TEXT;
  END IF;

  -- Add admin_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' 
    AND column_name = 'admin_id'
  ) THEN
    ALTER TABLE reports ADD COLUMN admin_id UUID REFERENCES auth.users(id);
  END IF;

  -- Add estimated_resolution_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' 
    AND column_name = 'estimated_resolution_date'
  ) THEN
    ALTER TABLE reports ADD COLUMN estimated_resolution_date TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add time_limit_hours column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' 
    AND column_name = 'time_limit_hours'
  ) THEN
    ALTER TABLE reports ADD COLUMN time_limit_hours INTEGER DEFAULT 72;
  END IF;

END $$;

-- 3. Add constraints if they don't exist
DO $$
BEGIN
  -- Add priority constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'reports_priority_check'
  ) THEN
    ALTER TABLE reports ADD CONSTRAINT reports_priority_check 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
  END IF;

  -- Add status constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'reports_status_check'
  ) THEN
    ALTER TABLE reports ADD CONSTRAINT reports_status_check 
    CHECK (status IN ('pending', 'investigating', 'resolved', 'closed'));
  END IF;

  -- Add contact_method constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'reports_contact_method_check'
  ) THEN
    ALTER TABLE reports ADD CONSTRAINT reports_contact_method_check 
    CHECK (contact_method IN ('email', 'phone', 'both'));
  END IF;

END $$;

-- 4. Show the updated table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Update existing records with default values if needed
UPDATE reports 
SET 
  category = COALESCE(category, 'other'),
  priority = COALESCE(priority, 'medium'),
  status = COALESCE(status, 'pending'),
  contact_method = COALESCE(contact_method, 'email'),
  time_limit_hours = COALESCE(time_limit_hours, 72)
WHERE 
  category IS NULL 
  OR priority IS NULL 
  OR status IS NULL 
  OR contact_method IS NULL 
  OR time_limit_hours IS NULL;

-- 6. Show sample data to verify
SELECT 
  id,
  title,
  category,
  priority,
  status,
  contact_method,
  created_at
FROM reports 
LIMIT 5;

-- 7. Verify the table is ready for the functions
SELECT 'Table structure updated successfully!' as status;
