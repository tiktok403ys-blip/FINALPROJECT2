-- Reports Realtime System Migration (Fixed Version)
-- Run this in Supabase SQL Editor
-- This version handles existing triggers and functions

-- 1. Create reports table with realtime support (if not exists)
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  casino_name TEXT,
  user_email TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'closed')),
  amount_disputed DECIMAL(10,2),
  contact_method TEXT DEFAULT 'email' CHECK (contact_method IN ('email', 'phone', 'both')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  admin_id UUID REFERENCES auth.users(id),
  estimated_resolution_date TIMESTAMP WITH TIME ZONE,
  time_limit_hours INTEGER DEFAULT 72 -- Default 72 hours for resolution
);

-- 2. Enable Row Level Security (RLS) - if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'reports' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 3. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public to insert reports" ON reports;
DROP POLICY IF EXISTS "Allow public to view reports" ON reports;
DROP POLICY IF EXISTS "Allow admins to update reports" ON reports;
DROP POLICY IF EXISTS "Allow admins to delete reports" ON reports;

-- 4. Create RLS policies
-- Allow public to insert reports
CREATE POLICY "Allow public to insert reports" ON reports
  FOR INSERT WITH CHECK (true);

-- Allow public to view reports (read-only)
CREATE POLICY "Allow public to view reports" ON reports
  FOR SELECT USING (true);

-- Allow admins to update reports
CREATE POLICY "Allow admins to update reports" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Allow admins to delete reports
CREATE POLICY "Allow admins to delete reports" ON reports
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- 5. Create function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Drop existing trigger if exists, then create new one
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at 
  BEFORE UPDATE ON reports 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Create function to calculate time elapsed (if not exists)
CREATE OR REPLACE FUNCTION calculate_time_elapsed(report_id UUID)
RETURNS JSON AS $$
DECLARE
  report_record RECORD;
  time_diff INTERVAL;
  result JSON;
BEGIN
  SELECT * INTO report_record FROM reports WHERE id = report_id;
  
  IF report_record.status = 'resolved' THEN
    -- For resolved reports, calculate time from creation to resolution
    time_diff = report_record.resolved_at - report_record.created_at;
  ELSE
    -- For active reports, calculate time from creation to now
    time_diff = NOW() - report_record.created_at;
  END IF;
  
  result = json_build_object(
    'days', EXTRACT(DAY FROM time_diff),
    'hours', EXTRACT(HOUR FROM time_diff),
    'minutes', EXTRACT(MINUTE FROM time_diff),
    'seconds', EXTRACT(SECOND FROM time_diff)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to get report statistics (if not exists)
CREATE OR REPLACE FUNCTION get_reports_stats()
RETURNS JSON AS $$
DECLARE
  total_count INTEGER;
  resolved_count INTEGER;
  active_count INTEGER;
  success_rate DECIMAL;
  result JSON;
BEGIN
  -- Get total reports
  SELECT COUNT(*) INTO total_count FROM reports;
  
  -- Get resolved reports
  SELECT COUNT(*) INTO resolved_count FROM reports WHERE status = 'resolved';
  
  -- Get active reports
  SELECT COUNT(*) INTO active_count FROM reports WHERE status IN ('pending', 'investigating');
  
  -- Calculate success rate
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

-- 9. Enable realtime for reports table (if not already enabled)
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

-- 10. Create indexes for better performance (if not exist)
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority);

-- 11. Insert sample data for testing (only if table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM reports LIMIT 1) THEN
    INSERT INTO reports (title, description, casino_name, user_email, category, priority, status, amount_disputed, contact_method) VALUES
    (
      'Betovo Casino - Player''s withdrawal has been delayed.',
      'Player submitted a withdrawal request for $2,500 on August 1st, 2025. Despite multiple follow-ups and providing all required verification documents, the casino has not processed the withdrawal. The player has been waiting for over 10 days without any clear timeline from the casino''s support team. All account verification was completed successfully, and the player has met all wagering requirements for the bonus used.',
      'Betovo Casino',
      'player@example.com',
      'withdrawal_delay',
      'high',
      'pending',
      2500.00,
      'email'
    ),
    (
      'Royal Casino - Bonus terms were not clearly explained.',
      'Player claims that the casino''s welcome bonus terms were misleading and not clearly disclosed during registration. The player deposited $500 expecting a 100% match bonus but discovered hidden wagering requirements of 50x that were not prominently displayed. Additionally, certain games were excluded from bonus play without clear notification, causing confusion and potential losses.',
      'Royal Casino',
      'user@example.com',
      'bonus_dispute',
      'medium',
      'investigating',
      500.00,
      'both'
    ),
    (
      'Diamond Palace - Account was closed without explanation.',
      'Player''s account was suddenly closed after winning $8,000 from a progressive jackpot. The casino cited ''irregular play patterns'' but provided no specific details. After our investigation, we found that the player''s gameplay was completely legitimate. The casino has since reopened the account, processed the full withdrawal, and provided a formal apology along with a goodwill bonus.',
      'Diamond Palace',
      'winner@example.com',
      'account_closure',
      'urgent',
      'resolved',
      8000.00,
      'email'
    );
  END IF;
END $$;

-- 12. Create view for admin dashboard (if not exists)
CREATE OR REPLACE VIEW reports_admin_view AS
SELECT 
  r.*,
  calculate_time_elapsed(r.id) as time_elapsed,
  CASE 
    WHEN r.status = 'pending' THEN 'Waiting for review'
    WHEN r.status = 'investigating' THEN 'Under investigation'
    WHEN r.status = 'resolved' THEN 'Successfully resolved'
    WHEN r.status = 'closed' THEN 'Case closed'
    ELSE r.status
  END as status_display,
  CASE 
    WHEN r.status = 'resolved' THEN 'text-green-500'
    WHEN r.status = 'investigating' THEN 'text-yellow-500'
    WHEN r.status = 'pending' THEN 'text-blue-500'
    ELSE 'text-gray-500'
  END as status_color
FROM reports r
ORDER BY r.created_at DESC;

-- 13. Grant permissions (if not already granted)
GRANT SELECT ON reports_admin_view TO authenticated;
GRANT SELECT ON reports TO anon;
GRANT SELECT ON reports TO authenticated;

-- 14. Verify setup
SELECT 'Migration completed successfully!' as status;
