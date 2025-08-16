-- =====================================================
-- DELTA-UPGRADE.SQL - NON-DESTRUCTIVE UPGRADE
-- P0.1 Production - Align existing DB to canonical baseline
-- =====================================================

-- Safety: wrap in transaction so either all changes apply or none.
BEGIN;

-- 0) Ensure required extensions
DO $$
BEGIN
  PERFORM 1 FROM pg_extension WHERE extname='pg_net';
  IF NOT FOUND THEN
    CREATE EXTENSION IF NOT EXISTS "pg_net";
  END IF;
  PERFORM 1 FROM pg_extension WHERE extname='pgcrypto';
  IF NOT FOUND THEN
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  END IF;
END $$;

-- 1) Ensure core tables exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='casinos') THEN
    CREATE TABLE casinos (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
      location VARCHAR(100),
      bonus_info TEXT,
      logo_url TEXT,
      website_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bonuses') THEN
    CREATE TABLE bonuses (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      bonus_amount VARCHAR(100),
      bonus_type VARCHAR(50),
      expiry_date DATE,
      casino_id UUID REFERENCES casinos(id) ON DELETE CASCADE,
      claim_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='leaderboard') THEN
    CREATE TABLE leaderboard (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      player_name VARCHAR(255) NOT NULL,
      points INTEGER DEFAULT 0,
      rank INTEGER,
      casino_id UUID REFERENCES casinos(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='news') THEN
    CREATE TABLE news (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      excerpt TEXT,
      category VARCHAR(100),
      image_url TEXT,
      author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      published BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='forum_posts') THEN
    CREATE TABLE forum_posts (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      category VARCHAR(100),
      author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='forum_comments') THEN
    CREATE TABLE forum_comments (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      content TEXT NOT NULL,
      post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
      author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='reports') THEN
    CREATE TABLE reports (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      casino_name VARCHAR(255),
      user_email VARCHAR(255),
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- 2) Profiles, RLS and trigger alignment
-- Ensure profiles table (structure per canonical)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
    CREATE TABLE public.profiles (
      id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
      updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
      username text UNIQUE,
      full_name text,
      avatar_url text,
      website text,
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  END IF;

  -- Ensure columns for admin functionality exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='profiles' AND column_name='email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='profiles' AND column_name='admin_pin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN admin_pin TEXT;
  END IF;
END $$;

-- Enable RLS on profiles and (re)create canonical policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 3) Admin roles and helpers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='profiles' AND column_name='role') THEN
    ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND role IN ('admin', 'super_admin'));
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Footer & partners tables and policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='footer_content') THEN
    CREATE TABLE footer_content (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      section VARCHAR(100) NOT NULL,
      title VARCHAR(255),
      content TEXT,
      link_url TEXT,
      link_text VARCHAR(255),
      display_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='partners') THEN
    CREATE TABLE partners (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      logo_url TEXT,
      website_url TEXT,
      description TEXT,
      partner_type VARCHAR(50) DEFAULT 'sponsor',
      display_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

ALTER TABLE footer_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read footer content" ON footer_content;
DROP POLICY IF EXISTS "Public can read partners" ON partners;
DROP POLICY IF EXISTS "Admins can manage footer content" ON footer_content;
DROP POLICY IF EXISTS "Admins can manage partners" ON partners;
CREATE POLICY "Public can read footer content" ON footer_content FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read partners" ON partners FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage footer content" ON footer_content FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage partners" ON partners FOR ALL USING (public.is_admin(auth.uid()));

-- 5) Player reviews + webhook
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='player_reviews') THEN
    CREATE TABLE player_reviews (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      casino_id UUID REFERENCES casinos(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      reviewer_name TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      rating DECIMAL(2,1) CHECK (rating >= 1 AND rating <= 5),
      is_approved BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

ALTER TABLE player_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read approved reviews" ON player_reviews;
DROP POLICY IF EXISTS "Users can create their own reviews" ON player_reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON player_reviews;
CREATE POLICY "Public can read approved reviews" ON player_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can create their own reviews" ON player_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all reviews" ON player_reviews FOR ALL USING (public.is_admin(auth.uid()));

-- Webhook function and trigger
CREATE OR REPLACE FUNCTION fn_notify_new_player_review()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_url text := current_setting('app.webhook_player_review_url', true);
BEGIN
  IF new.is_approved = false AND v_url IS NOT NULL AND v_url <> '' THEN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object('x-webhook-secret', current_setting('app.webhook_secret', true)),
      body := jsonb_build_object(
        'id', new.id,
        'casino_id', new.casino_id,
        'user_id', new.user_id,
        'reviewer_name', new.reviewer_name,
        'title', new.title,
        'content', new.content,
        'rating', new.rating,
        'created_at', new.created_at
      )
    );
  END IF;
  RETURN null;
END $$;

DROP TRIGGER IF EXISTS trg_notify_new_player_review ON player_reviews;
CREATE TRIGGER trg_notify_new_player_review AFTER INSERT ON player_reviews FOR EACH ROW EXECUTE FUNCTION fn_notify_new_player_review();

-- 6) Realtime publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE casinos;
    ALTER PUBLICATION supabase_realtime ADD TABLE bonuses;
    ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;
    ALTER PUBLICATION supabase_realtime ADD TABLE news;
    ALTER PUBLICATION supabase_realtime ADD TABLE forum_posts;
    ALTER PUBLICATION supabase_realtime ADD TABLE forum_comments;
    ALTER PUBLICATION supabase_realtime ADD TABLE reports;
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
    ALTER PUBLICATION supabase_realtime ADD TABLE player_reviews;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

COMMIT;

-- Post-upgrade notes:
-- - Set runtime configs to activate webhook (example):
--   select set_config('app.webhook_player_review_url', 'https://YOUR_DOMAIN/api/webhooks/player-review', false);
--   select set_config('app.webhook_secret', 'YOUR_SECRET', false);
-- - Ensure Vercel ENV: WEBHOOK_SECRET and SLACK_WEBHOOK_URL