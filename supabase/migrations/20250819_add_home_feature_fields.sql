-- Add curated Top Rated fields to casinos
ALTER TABLE public.casinos
  ADD COLUMN IF NOT EXISTS is_featured_home BOOLEAN DEFAULT false;

ALTER TABLE public.casinos
  ADD COLUMN IF NOT EXISTS home_rank INTEGER;

-- Optional: index to speed up home queries
CREATE INDEX IF NOT EXISTS idx_casinos_featured_home
  ON public.casinos (is_featured_home, home_rank, rating DESC);

-- Note: RLS policies remain unchanged; public read should be allowed as elsewhere

