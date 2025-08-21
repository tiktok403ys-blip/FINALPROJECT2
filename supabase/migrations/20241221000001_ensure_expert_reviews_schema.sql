-- Ensure casino_reviews table has all necessary fields for expert reviews
-- This migration aligns the database schema with the frontend requirements

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add slug column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'casino_reviews' AND column_name = 'slug') THEN
        ALTER TABLE casino_reviews ADD COLUMN slug VARCHAR(255);
        RAISE NOTICE 'Added slug column to casino_reviews table';
    END IF;

    -- Add summary column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'casino_reviews' AND column_name = 'summary') THEN
        ALTER TABLE casino_reviews ADD COLUMN summary TEXT;
        RAISE NOTICE 'Added summary column to casino_reviews table';
    END IF;

    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'casino_reviews' AND column_name = 'created_by') THEN
        ALTER TABLE casino_reviews ADD COLUMN created_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added created_by column to casino_reviews table';
    END IF;

    -- Add updated_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'casino_reviews' AND column_name = 'updated_by') THEN
        ALTER TABLE casino_reviews ADD COLUMN updated_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added updated_by column to casino_reviews table';
    END IF;

    -- Add published_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'casino_reviews' AND column_name = 'published_at') THEN
        ALTER TABLE casino_reviews ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added published_at column to casino_reviews table';
    END IF;
END $$;

-- Update rating constraint to allow 0-10 scale (if currently 0-5)
DO $$
BEGIN
    -- Check current rating constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%rating%' 
        AND table_name = 'casino_reviews'
    ) THEN
        -- Drop existing constraint if it's too restrictive
        ALTER TABLE casino_reviews DROP CONSTRAINT IF EXISTS casino_reviews_rating_check;
        RAISE NOTICE 'Dropped existing rating constraint';
    END IF;
    
    -- Add new constraint for 0-10 scale
    ALTER TABLE casino_reviews ADD CONSTRAINT casino_reviews_rating_check 
    CHECK (rating >= 0 AND rating <= 10);
    RAISE NOTICE 'Added new rating constraint (0-10 scale)';
END $$;

-- Ensure slug is unique
DO $$
BEGIN
    -- Add unique constraint to slug if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'casino_reviews_slug_key' 
        AND table_name = 'casino_reviews'
    ) THEN
        ALTER TABLE casino_reviews ADD CONSTRAINT casino_reviews_slug_key UNIQUE (slug);
        RAISE NOTICE 'Added unique constraint to slug column';
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_casino_reviews_casino_id ON casino_reviews(casino_id);
CREATE INDEX IF NOT EXISTS idx_casino_reviews_slug ON casino_reviews(slug);
CREATE INDEX IF NOT EXISTS idx_casino_reviews_published ON casino_reviews(is_published);
CREATE INDEX IF NOT EXISTS idx_casino_reviews_featured ON casino_reviews(is_featured);
CREATE INDEX IF NOT EXISTS idx_casino_reviews_rating ON casino_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_casino_reviews_created_at ON casino_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_casino_reviews_author_id ON casino_reviews(author_id);

-- Ensure RLS is enabled
ALTER TABLE casino_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read published reviews" ON casino_reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON casino_reviews;

-- Create public read policy for published reviews
CREATE POLICY "Public can read published reviews" ON casino_reviews
  FOR SELECT USING (is_published = true);

-- Create admin management policy
CREATE POLICY "Admins can manage reviews" ON casino_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_casino_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_casino_reviews_updated_at_trigger'
    ) THEN
        CREATE TRIGGER update_casino_reviews_updated_at_trigger
        BEFORE UPDATE ON casino_reviews
        FOR EACH ROW
        EXECUTE FUNCTION update_casino_reviews_updated_at();
        RAISE NOTICE 'Created updated_at trigger for casino_reviews';
    END IF;
END $$;

-- Create trigger to set created_by on insert
CREATE OR REPLACE FUNCTION set_casino_reviews_created_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'set_casino_reviews_created_by_trigger'
    ) THEN
        CREATE TRIGGER set_casino_reviews_created_by_trigger
        BEFORE INSERT ON casino_reviews
        FOR EACH ROW
        EXECUTE FUNCTION set_casino_reviews_created_by();
        RAISE NOTICE 'Created created_by trigger for casino_reviews';
    END IF;
END $$;

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'casino_reviews' 
ORDER BY ordinal_position;

-- Show success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== EXPERT REVIEWS SCHEMA UPDATED ===';
    RAISE NOTICE 'The casino_reviews table now has all necessary fields for expert reviews:';
    RAISE NOTICE '- slug (unique identifier for URLs)';
    RAISE NOTICE '- summary (brief review summary)';
    RAISE NOTICE '- created_by/updated_by (audit trail)';
    RAISE NOTICE '- published_at (publication timestamp)';
    RAISE NOTICE '- rating constraint (0-10 scale)';
    RAISE NOTICE '- proper indexes for performance';
    RAISE NOTICE '- RLS policies for security';
    RAISE NOTICE '- triggers for automatic updates';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now use the admin panel to manage expert reviews!';
END $$;
