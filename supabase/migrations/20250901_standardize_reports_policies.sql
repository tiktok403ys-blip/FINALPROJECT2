-- Standardize RLS policies for reports to use public.users.role
-- Safe to run multiple times

-- 1) Ensure RLS enabled on reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 2) Drop conflicting/legacy policies if exist
DROP POLICY IF EXISTS "Allow public to insert reports" ON public.reports;
DROP POLICY IF EXISTS "Allow public to view reports" ON public.reports;
DROP POLICY IF EXISTS "Allow admins to update reports" ON public.reports;
DROP POLICY IF EXISTS "Allow admins to delete reports" ON public.reports;

-- 3) Recreate consistent policies (using public.users)
-- Public can INSERT reports
CREATE POLICY "Allow public to insert reports" ON public.reports
  FOR INSERT
  WITH CHECK (true);

-- Public can SELECT reports (read-only)
CREATE POLICY "Allow public to view reports" ON public.reports
  FOR SELECT
  USING (true);

-- Admins can UPDATE reports
CREATE POLICY "Allow admins to update reports" ON public.reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin','super_admin')
    )
  );

-- Admins can DELETE reports
CREATE POLICY "Allow admins to delete reports" ON public.reports
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin','super_admin')
    )
  );

-- 4) Ensure reports is part of realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public'
      AND tablename = 'reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
  END IF;
END $$;

-- 5) Optionally align analytics_events RLS to allow inserts from server actions
--    Only apply if table exists; otherwise skip without error.
DO $$
BEGIN
  IF to_regclass('public.analytics_events') IS NOT NULL THEN
    -- Ensure RLS enabled
    BEGIN
      EXECUTE 'ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN others THEN NULL; -- ignore
    END;

    -- Drop existing permissive insert policy if any (idempotent names assumed)
    BEGIN
      EXECUTE 'DROP POLICY IF EXISTS "Allow inserts for analytics (auth)" ON public.analytics_events';
    EXCEPTION WHEN others THEN NULL; -- ignore
    END;

    -- Create permissive insert policy for authenticated users
    BEGIN
      EXECUTE $$CREATE POLICY "Allow inserts for analytics (auth)" ON public.analytics_events
        FOR INSERT TO authenticated
        WITH CHECK (true);$$;
    EXCEPTION WHEN others THEN NULL; -- ignore
    END;
  END IF;
END $$;
