-- Align casinos table with admin UI fields
-- Adds missing column used by the UI: bonus_info

ALTER TABLE public.casinos
  ADD COLUMN IF NOT EXISTS bonus_info TEXT;

-- Optionally ensure indexes remain valid (no-op if already present)
CREATE INDEX IF NOT EXISTS idx_casinos_bonus_info ON public.casinos((bonus_info));


