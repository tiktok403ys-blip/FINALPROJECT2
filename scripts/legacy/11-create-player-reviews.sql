-- Player-generated reviews (UGC) for casinos

CREATE TABLE IF NOT EXISTS player_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  casino_id UUID REFERENCES casinos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  -- Optional category ratings for richer breakdowns
  game_variety_rating DECIMAL(2,1) CHECK (game_variety_rating >= 0 AND game_variety_rating <= 5),
  customer_service_rating DECIMAL(2,1) CHECK (customer_service_rating >= 0 AND customer_service_rating <= 5),
  payout_speed_rating DECIMAL(2,1) CHECK (payout_speed_rating >= 0 AND payout_speed_rating <= 5),
  -- Social signals
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  -- Moderation
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_player_reviews_casino_id ON player_reviews(casino_id);
CREATE INDEX IF NOT EXISTS idx_player_reviews_created ON player_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_player_reviews_approved ON player_reviews(is_approved, created_at DESC);

-- Enable RLS
ALTER TABLE player_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
-- Public can read approved reviews
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'player_reviews' AND policyname = 'Public can read approved player reviews'
  ) THEN
    CREATE POLICY "Public can read approved player reviews" ON player_reviews
      FOR SELECT USING (is_approved = true);
  END IF;
END $$;

-- Authenticated users can insert their own review
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'player_reviews' AND policyname = 'Authenticated can insert player reviews'
  ) THEN
    CREATE POLICY "Authenticated can insert player reviews" ON player_reviews
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
  END IF;
END $$;

-- Owners can update their own review (basic), admins can manage via existing admin function if present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'player_reviews' AND policyname = 'Owners can update their reviews'
  ) THEN
    CREATE POLICY "Owners can update their reviews" ON player_reviews
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Optional: allow incrementing helpful counters by authenticated users (simple model)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'player_reviews' AND policyname = 'Authenticated can vote helpful counters'
  ) THEN
    CREATE POLICY "Authenticated can vote helpful counters" ON player_reviews
      FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;


