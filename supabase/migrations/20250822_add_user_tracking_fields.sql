-- Add user tracking fields for dashboard analytics
-- This migration adds fields needed to track daily active users and login activity

-- Add last_seen column to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for better performance on date queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles (last_seen);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles (updated_at);

-- Create or replace function to update last_seen on any profile activity
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_seen on profile updates
DROP TRIGGER IF EXISTS update_profiles_last_seen ON public.profiles;
CREATE TRIGGER update_profiles_last_seen
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();

-- Create or replace function to track user login
CREATE OR REPLACE FUNCTION track_user_login()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_seen when user logs in
  UPDATE public.profiles
  SET last_seen = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create index on player_reviews for better performance
CREATE INDEX IF NOT EXISTS idx_player_reviews_created_at ON public.player_reviews (created_at);

-- Update existing profiles to set last_seen to updated_at
UPDATE public.profiles
SET last_seen = COALESCE(updated_at, created_at, NOW())
WHERE last_seen IS NULL;

-- Add comment
COMMENT ON COLUMN public.profiles.last_seen IS 'Tracks last user activity for daily active users metric';
