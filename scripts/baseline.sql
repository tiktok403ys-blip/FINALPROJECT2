-- =====================================================
-- BASELINE.SQL - COMPLETE FRESH INSTALLATION
-- GuruSingapore Casino Platform - P0.1 Production
-- Created: $(date)
-- =====================================================
-- 
-- This script provides a complete database setup for fresh installations.
-- Execute this script on a clean Supabase database instance.
-- 
-- Prerequisites:
-- 1. Supabase project created
-- 2. Database extensions enabled (automatic in Supabase)
-- 3. Environment variables configured for webhook (optional):
--    - WEBHOOK_SECRET
--    - SLACK_WEBHOOK_URL
-- 
-- Execution order is critical - do not rearrange sections.
-- =====================================================

-- =====================================================
-- SECTION 1: EXTENSIONS & CORE TABLES
-- Source: 01-create-tables-fixed.sql
-- =====================================================

-- Enable required extensions (pg_net for webhook HTTP calls, pgcrypto for UUID generation)
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create core application tables
CREATE TABLE IF NOT EXISTS casinos (
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

CREATE TABLE IF NOT EXISTS bonuses (
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

CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name VARCHAR(255) NOT NULL,
  points INTEGER DEFAULT 0,
  rank INTEGER,
  casino_id UUID REFERENCES casinos(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news (
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

CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  category VARCHAR(100),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  casino_name VARCHAR(255),
  user_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 2: USER PROFILES & AUTHENTICATION
-- Source: 12-setup-supabase-auth-fixed.sql
-- =====================================================

-- Create profiles table with proper structure
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  website text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create RLS policies for profiles table
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Could not create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SECTION 3: FOOTER & PARTNERS
-- Source: 05-add-footer-and-partners-fixed.sql
-- =====================================================

-- Create footer content table
CREATE TABLE IF NOT EXISTS footer_content (
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

-- Create partners/sponsors table for logo slider
CREATE TABLE IF NOT EXISTS partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  description TEXT,
  partner_type VARCHAR(50) DEFAULT 'sponsor', -- sponsor, affiliate, partner
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE footer_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can read footer content" ON footer_content FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read partners" ON partners FOR SELECT USING (is_active = true);

-- Admin policies (will be created after admin functions are established)
-- CREATE POLICY "Admins can manage footer content" ON footer_content FOR ALL USING (public.is_admin(auth.uid()));
-- CREATE POLICY "Admins can manage partners" ON partners FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- SECTION 4: ADMIN ROLES & SECURITY
-- Source: 14-setup-admin-roles-final-fixed.sql + 15-ensure-profiles-table.sql
-- =====================================================

-- Create user_role enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
        RAISE NOTICE 'Created user_role enum type';
    ELSE
        RAISE NOTICE 'user_role enum type already exists';
    END IF;
END $$;

-- Update profiles table for admin functionality
DO $$ 
BEGIN
    -- Add role column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user'::user_role;
        RAISE NOTICE 'Added role column to profiles table';
    END IF;
    
    -- Add admin_pin column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'admin_pin' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles ADD COLUMN admin_pin TEXT;
        RAISE NOTICE 'Added admin_pin column to profiles table';
    END IF;
    
    -- Add email column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'email' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;
        RAISE NOTICE 'Added email column to profiles table';
    END IF;
END $$;

-- Create admin helper functions
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify admin PIN
CREATE OR REPLACE FUNCTION verify_admin_pin(user_email TEXT, input_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stored_pin TEXT;
    user_role TEXT;
BEGIN
    -- Get user's PIN and role
    SELECT p.admin_pin, p.role INTO stored_pin, user_role
    FROM profiles p
    WHERE p.email = user_email;
    
    -- Check if user is admin and PIN matches
    IF user_role IN ('admin', 'super_admin') AND stored_pin = input_pin THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- Function to set admin PIN
CREATE OR REPLACE FUNCTION set_admin_pin(user_email TEXT, new_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles 
    SET admin_pin = new_pin, updated_at = NOW()
    WHERE email = user_email AND role IN ('admin', 'super_admin');
    
    RETURN FOUND;
END;
$$;

-- Update existing handle_new_user function to include admin fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, admin_pin)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    CASE 
        WHEN new.email = 'casinogurusg404@gmail.com' THEN 'super_admin'
        ELSE 'user'
    END,
    NULL  -- PIN will be validated using environment variable
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Could not create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

-- Create additional admin policies for profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Admin policies for footer & partners (created after is_admin exists)
DROP POLICY IF EXISTS "Admins can manage footer content" ON footer_content;
DROP POLICY IF EXISTS "Admins can manage partners" ON partners;
CREATE POLICY "Admins can manage footer content" ON footer_content FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage partners" ON partners FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- SECTION 5: WEBHOOK NOTIFICATION SYSTEM (OPTIONAL)
-- Source: 13-trigger-webhook-player-review.sql
-- =====================================================

-- Note: This webhook functionality requires WEBHOOK_SECRET and SLACK_WEBHOOK_URL
-- environment variables to be configured in your deployment platform.
-- If these are not set, the webhook will remain inactive and won't affect functionality.

-- Create player_reviews table if it doesn't exist (required for webhook)
CREATE TABLE IF NOT EXISTS player_reviews (
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

-- Enable RLS for player_reviews
ALTER TABLE player_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for player_reviews
CREATE POLICY "Public can read approved reviews" ON player_reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create their own reviews" ON player_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON player_reviews
  FOR ALL USING (public.is_admin(auth.uid()));

-- Create webhook notification function
CREATE OR REPLACE FUNCTION fn_notify_new_player_review()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_url text := current_setting('app.webhook_player_review_url', true);
BEGIN
  IF new.is_approved = false AND v_url IS NOT NULL AND v_url <> '' THEN
    PERFORM
      net.http_post(
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

-- Create webhook trigger
DROP TRIGGER IF EXISTS trg_notify_new_player_review ON player_reviews;
CREATE TRIGGER trg_notify_new_player_review
AFTER INSERT ON player_reviews
FOR EACH ROW EXECUTE FUNCTION fn_notify_new_player_review();

-- =====================================================
-- SECTION 6: DEFAULT DATA & PERMISSIONS
-- =====================================================

-- Insert default footer content
INSERT INTO footer_content (section, title, content, link_url, link_text, display_order) VALUES
-- About section
('about', 'About Casino Guide', 'Your trusted source for online casino reviews, bonuses, and gaming insights. We provide comprehensive guides to help you make informed decisions in the world of online gambling.', '/about', 'Learn More', 1),

-- Quick Links
('quick_links', 'Top Casinos', NULL, '/casinos', 'Browse Casinos', 1),
('quick_links', 'Best Bonuses', NULL, '/bonuses', 'View Bonuses', 2),
('quick_links', 'Player Reviews', NULL, '/reviews', 'Read Reviews', 3),
('quick_links', 'Latest News', NULL, '/news', 'Casino News', 4),
('quick_links', 'Leaderboard', NULL, '/leaderboard', 'Top Players', 5),

-- Support section
('support', 'Help Center', NULL, '/help', 'Get Help', 1),
('support', 'Contact Us', NULL, '/contact', 'Contact', 2),
('support', 'Report Issue', NULL, '/reports', 'Report Problem', 3),
('support', 'FAQ', NULL, '/faq', 'Frequently Asked Questions', 4),

-- Legal section
('legal', 'Terms of Service', NULL, '/terms', 'Terms & Conditions', 1),
('legal', 'Privacy Policy', NULL, '/privacy', 'Privacy Policy', 2),
('legal', 'Responsible Gaming', NULL, '/responsible-gaming', 'Play Responsibly', 3),
('legal', 'Cookie Policy', NULL, '/cookies', 'Cookie Policy', 4),

-- Social section
('social', 'Follow Us', 'Stay connected for the latest updates and exclusive offers', NULL, NULL, 1),

-- Contact info
('contact', 'Email', 'support@casinoguide.com', 'mailto:support@casinoguide.com', 'Email Us', 1),
('contact', 'Address', '123 Gaming Street, Casino City, CC 12345', NULL, NULL, 2),
('contact', 'Phone', '+1 (555) 123-4567', 'tel:+15551234567', 'Call Us', 3)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Enable realtime for key tables
DO $$
BEGIN
  -- Try to add tables to publication, ignore if already exists
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
  EXCEPTION
    WHEN duplicate_object THEN
      -- Table already in publication, do nothing
      NULL;
  END;
END $$;

-- =====================================================
-- SECTION 7: VERIFICATION & COMPLETION
-- =====================================================

-- Create default admin user reminder function
CREATE OR REPLACE FUNCTION create_default_admin()
RETURNS VOID AS $$
DECLARE
    admin_email TEXT := 'casinogurusg404@gmail.com';
    admin_exists BOOLEAN;
BEGIN
    -- Check if admin already exists
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = admin_email
    ) INTO admin_exists;
    
    IF NOT admin_exists THEN
        RAISE NOTICE 'Please create admin user manually in Supabase Auth Dashboard:';
        RAISE NOTICE 'Email: %', admin_email;
        RAISE NOTICE 'Password: Qwerty1122!';
        RAISE NOTICE 'Then run: UPDATE profiles SET role = ''admin'' WHERE email = ''%'';', admin_email;
    ELSE
        -- Update existing user to admin
        UPDATE profiles 
        SET role = 'admin'::user_role 
        WHERE id = (SELECT id FROM auth.users WHERE email = admin_email);
        
        RAISE NOTICE 'Updated existing user % to admin role', admin_email;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute admin user creation check
SELECT create_default_admin();

-- Final verification and success message
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'BASELINE INSTALLATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Database setup complete for GuruSingapore Casino Platform';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create admin user in Supabase Auth Dashboard';
    RAISE NOTICE '   Email: casinogurusg404@gmail.com';
    RAISE NOTICE '   Password: Qwerty1122!';
    RAISE NOTICE '';
    RAISE NOTICE '2. Configure environment variables (optional):';
    RAISE NOTICE '   WEBHOOK_SECRET=your_webhook_secret';
    RAISE NOTICE '   SLACK_WEBHOOK_URL=your_slack_webhook_url';
    RAISE NOTICE '';
    RAISE NOTICE '3. Deploy your application to Vercel';
    RAISE NOTICE '4. Test admin login and functionality';
    RAISE NOTICE '';
    RAISE NOTICE 'Webhook status: Configured but inactive until ENV vars are set';
    RAISE NOTICE '==============================================';
END $$;