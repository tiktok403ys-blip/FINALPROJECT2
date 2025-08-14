-- Strengthen INSERT policy for player_reviews with DB-level throttle (10 minutes per user per casino)

-- Drop old simple insert policy if present
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'player_reviews' AND policyname = 'Authenticated can insert player reviews'
  ) THEN
    DROP POLICY "Authenticated can insert player reviews" ON player_reviews;
  END IF;
END $$;

-- Create stricter insert policy combining auth + throttle window
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'player_reviews' AND policyname = 'Authenticated throttled insert player reviews'
  ) THEN
    CREATE POLICY "Authenticated throttled insert player reviews" ON player_reviews
      FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
        AND (
          SELECT (now() - COALESCE(max(created_at), now() - interval '100 years')) >= interval '10 minutes'
          FROM player_reviews pr
          WHERE pr.user_id = auth.uid() AND pr.casino_id = player_reviews.casino_id
        )
      );
  END IF;
END $$;


