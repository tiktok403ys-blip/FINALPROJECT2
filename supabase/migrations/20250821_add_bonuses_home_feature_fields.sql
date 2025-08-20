-- Add curated Home fields to bonuses (for Exclusive Bonuses section)

-- Columns used by admin page at app/admin/home/exclusive-bonuses/page.tsx
ALTER TABLE public.bonuses
  ADD COLUMN IF NOT EXISTS is_featured_home BOOLEAN DEFAULT false;

ALTER TABLE public.bonuses
  ADD COLUMN IF NOT EXISTS home_rank INTEGER;

-- Optional external/override link for homepage CTA
ALTER TABLE public.bonuses
  ADD COLUMN IF NOT EXISTS home_link_override TEXT;

-- Destination URL to claim the bonus (also used on homepage CTA)
ALTER TABLE public.bonuses
  ADD COLUMN IF NOT EXISTS claim_url TEXT;

-- Helpful index for homepage queries and ordering
CREATE INDEX IF NOT EXISTS idx_bonuses_featured_home
  ON public.bonuses (is_featured_home, home_rank, created_at DESC);


