-- Standardize RLS policies for reports - Flexible version
-- Safe to run multiple times - Adapts to existing database structure

-- 1) Ensure RLS enabled on reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 2) Drop conflicting/legacy policies if exist
DROP POLICY IF EXISTS "Allow public to insert reports" ON public.reports;
DROP POLICY IF EXISTS "Allow public to view reports" ON public.reports;
DROP POLICY IF EXISTS "Allow admins to update reports" ON public.reports;
DROP POLICY IF EXISTS "Allow admins to delete reports" ON public.reports;

-- 3) Recreate consistent policies - Flexible approach
-- Public can INSERT reports
CREATE POLICY "Allow public to insert reports" ON public.reports
  FOR INSERT
  WITH CHECK (true);

-- Public can SELECT reports (read-only)
CREATE POLICY "Allow public to view reports" ON public.reports
  FOR SELECT
  USING (true);

-- 4) Create admin policies based on available user structure
DO $$
DECLARE
  user_table_exists BOOLEAN;
  auth_users_has_role BOOLEAN;
  public_users_exists BOOLEAN;
BEGIN
  -- Check if public.users table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) INTO public_users_exists;
  
  -- Check if auth.users has role column
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'role'
  ) INTO auth_users_has_role;
  
  -- Check if auth.users has raw_user_meta_data
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'raw_user_meta_data'
  ) INTO user_table_exists;
  
  -- Create admin UPDATE policy based on available structure
  IF public_users_exists THEN
    -- Use public.users.role if table exists
    EXECUTE 'CREATE POLICY "Allow admins to update reports" ON public.reports FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role IN (''admin'',''super_admin'')
      )
    )';
  ELSIF auth_users_has_role THEN
    -- Use auth.users.role if column exists
    EXECUTE 'CREATE POLICY "Allow admins to update reports" ON public.reports FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = auth.uid()
        AND u.role IN (''admin'',''super_admin'')
      )
    )';
  ELSIF user_table_exists THEN
    -- Use auth.users.raw_user_meta_data->>role if available
    EXECUTE 'CREATE POLICY "Allow admins to update reports" ON public.reports FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = auth.uid()
        AND u.raw_user_meta_data->>''role'' IN (''admin'',''super_admin'')
      )
    )';
  ELSE
    -- Fallback: Allow all authenticated users to update (less secure)
    EXECUTE 'CREATE POLICY "Allow admins to update reports" ON public.reports FOR UPDATE USING (auth.role() = ''authenticated'')';
  END IF;
  
  -- Create admin DELETE policy based on available structure
  IF public_users_exists THEN
    -- Use public.users.role if table exists
    EXECUTE 'CREATE POLICY "Allow admins to delete reports" ON public.reports FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role IN (''admin'',''super_admin'')
      )
    )';
  ELSIF auth_users_has_role THEN
    -- Use auth.users.role if column exists
    EXECUTE 'CREATE POLICY "Allow admins to delete reports" ON public.reports FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = auth.uid()
        AND u.role IN (''admin'',''super_admin'')
      )
    )';
  ELSIF user_table_exists THEN
    -- Use auth.users.raw_user_meta_data->>role if available
    EXECUTE 'CREATE POLICY "Allow admins to delete reports" ON public.reports FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = auth.uid()
        AND u.raw_user_meta_data->>''role'' IN (''admin'',''super_admin'')
      )
    )';
  ELSE
    -- Fallback: Allow all authenticated users to delete (less secure)
    EXECUTE 'CREATE POLICY "Allow admins to delete reports" ON public.reports FOR DELETE USING (auth.role() = ''authenticated'')';
  END IF;
  
  RAISE NOTICE 'Admin policies created based on available user structure. Public users: %, Auth users with role: %, Auth users with meta: %', 
    public_users_exists, auth_users_has_role, user_table_exists;
END $$;

-- 5) Ensure reports is part of realtime publication
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

-- 6) Optionally align analytics_events RLS to allow inserts from server actions
DO $$
BEGIN
  IF to_regclass('public.analytics_events') IS NOT NULL THEN
    -- Ensure RLS enabled
    BEGIN
      EXECUTE 'ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN others THEN NULL; -- ignore
    END;

    -- Drop existing permissive insert policy if any
    BEGIN
      EXECUTE 'DROP POLICY IF EXISTS "Allow inserts for analytics (auth)" ON public.analytics_events';
    EXCEPTION WHEN others THEN NULL; -- ignore
    END;

    -- Create permissive insert policy for authenticated users
    BEGIN
      EXECUTE 'CREATE POLICY "Allow inserts for analytics (auth)" ON public.analytics_events FOR INSERT TO authenticated WITH CHECK (true)';
    EXCEPTION WHEN others THEN NULL; -- ignore
    END;
  END IF;
END $$;

-- 7) Verify setup and show current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'reports';

-- 8) Show final status
SELECT 'Migration completed successfully! RLS policies updated for reports table.' as status;
