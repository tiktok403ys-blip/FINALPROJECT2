-- Language coverage counts for casinos (to power public card info)

ALTER TABLE public.casinos
  ADD COLUMN IF NOT EXISTS website_languages INTEGER;

ALTER TABLE public.casinos
  ADD COLUMN IF NOT EXISTS live_chat_languages INTEGER;

ALTER TABLE public.casinos
  ADD COLUMN IF NOT EXISTS customer_support_languages INTEGER;

-- Optional: simple non-negative guard
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'casinos_website_languages_nonneg'
  ) THEN
    ALTER TABLE public.casinos
      ADD CONSTRAINT casinos_website_languages_nonneg
      CHECK (website_languages IS NULL OR website_languages >= 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'casinos_live_chat_languages_nonneg'
  ) THEN
    ALTER TABLE public.casinos
      ADD CONSTRAINT casinos_live_chat_languages_nonneg
      CHECK (live_chat_languages IS NULL OR live_chat_languages >= 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'casinos_support_languages_nonneg'
  ) THEN
    ALTER TABLE public.casinos
      ADD CONSTRAINT casinos_support_languages_nonneg
      CHECK (customer_support_languages IS NULL OR customer_support_languages >= 0);
  END IF;
END $$;


