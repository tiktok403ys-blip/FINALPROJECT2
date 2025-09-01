-- Complete Fix for Reports Table Structure
-- Run this in Supabase SQL Editor
-- This script fixes the existing reports table structure

-- 1. Pertama, lihat struktur tabel yang ada sekarang
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Perbaiki struktur tabel reports
DO $$
BEGIN
  -- Rename 'name' to 'title' if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE reports RENAME COLUMN name TO title;
  END IF;

  -- Add title column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' 
    AND column_name = 'title'
  ) THEN
    ALTER TABLE reports ADD COLUMN title TEXT;
  END IF;

  -- Add description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE reports ADD COLUMN description TEXT;
  END IF;

  -- Add category column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE reports ADD COLUMN category TEXT DEFAULT 'other';
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

  -- Add casino_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' 
    AND column_name = 'casino_name'
  ) THEN
    ALTER TABLE reports ADD COLUMN casino_name TEXT;
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

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE reports ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

END $$;

-- 3. Add constraints (jika belum ada)
DO $$
BEGIN
  -- Add priority constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'reports_priority_check'
  ) THEN
    ALTER TABLE reports ADD CONSTRAINT reports_priority_check 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
  END IF;

  -- Add status constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'reports_status_check'
  ) THEN
    ALTER TABLE reports ADD CONSTRAINT reports_status_check 
    CHECK (status IN ('pending', 'investigating', 'resolved', 'closed'));
  END IF;

  -- Add contact_method constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'reports_contact_method_check'
  ) THEN
    ALTER TABLE reports ADD CONSTRAINT reports_contact_method_check 
    CHECK (contact_method IN ('email', 'phone', 'both'));
  END IF;

END $$;

-- 4. Update existing records with default values
UPDATE reports 
SET 
  category = COALESCE(category, 'other'),
  priority = COALESCE(priority, 'medium'),
  status = COALESCE(status, 'pending'),
  contact_method = COALESCE(contact_method, 'email'),
  time_limit_hours = COALESCE(time_limit_hours, 72),
  updated_at = COALESCE(updated_at, created_at)
WHERE 
  category IS NULL 
  OR priority IS NULL 
  OR status IS NULL 
  OR contact_method IS NULL 
  OR time_limit_hours IS NULL
  OR updated_at IS NULL;

-- 5. Create function to get report statistics
CREATE OR REPLACE FUNCTION get_reports_stats()
RETURNS JSON AS $$
DECLARE
  total_count INTEGER;
  resolved_count INTEGER;
  active_count INTEGER;
  success_rate DECIMAL;
  result JSON;
BEGIN
  SELECT COUNT(*) INTO total_count FROM reports;
  SELECT COUNT(*) INTO resolved_count FROM reports WHERE status = 'resolved';
  SELECT COUNT(*) INTO active_count FROM reports WHERE status IN ('pending', 'investigating');
  
  IF total_count > 0 THEN
    success_rate = ROUND((resolved_count::DECIMAL / total_count) * 100, 2);
  ELSE
    success_rate = 0;
  END IF;
  
  result = json_build_object(
    'total', total_count,
    'resolved', resolved_count,
    'active', active_count,
    'success_rate', success_rate
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 6. Enable realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE reports;
  END IF;
END $$;

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority);

-- 8. Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies
DROP POLICY IF EXISTS "Allow public to insert reports" ON reports;
DROP POLICY IF EXISTS "Allow public to view reports" ON reports;
DROP POLICY IF EXISTS "Allow admins to update reports" ON reports;
DROP POLICY IF EXISTS "Allow admins to delete reports" ON reports;

CREATE POLICY "Allow public to insert reports" ON reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public to view reports" ON reports
  FOR SELECT USING (true);

CREATE POLICY "Allow admins to update reports" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Allow admins to delete reports" ON reports
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- 10. Verifikasi struktur tabel
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 11. Test fungsi statistik
SELECT get_reports_stats() as stats_test;

-- 12. Test insert sample data
INSERT INTO reports (title, description, user_email, category, priority)
VALUES ('Test Report', 'This is a test report', 'test@example.com', 'other', 'medium')
RETURNING id, title, status;
