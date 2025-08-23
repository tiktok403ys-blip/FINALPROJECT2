-- Add missing bonus detail fields to bonuses table
-- This migration adds all the fields needed for the enhanced bonus CRUD system

ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS promo_code VARCHAR(100);
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS valid_from DATE;
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS valid_until DATE;

-- Enhanced bonus restriction fields
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS max_bet INTEGER DEFAULT 0;
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS max_bet_text TEXT;
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS wagering_x INTEGER DEFAULT 25;
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS wagering_text TEXT;

-- Free spins fields
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS free_spins INTEGER DEFAULT 0;
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS free_spin_value DECIMAL(10,2) DEFAULT 0.25;
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS value_text TEXT;

-- User interface fields
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS play_now_text TEXT;
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS terms TEXT;
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS expiry_days INTEGER DEFAULT 30;
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS expiry_text TEXT;
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS claiming_speed VARCHAR(50) DEFAULT 'FAST';
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS card_bg_color VARCHAR(7); -- Hex color for bonus card background
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS how_to_get TEXT;

-- Homepage feature fields
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS is_featured_home BOOLEAN DEFAULT false;
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS home_rank INTEGER;
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS home_link_override TEXT;
ALTER TABLE bonuses ADD COLUMN IF NOT EXISTS claim_url TEXT;

-- Update existing bonus_code to promo_code for consistency
UPDATE bonuses SET promo_code = bonus_code WHERE promo_code IS NULL AND bonus_code IS NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bonuses_promo_code ON bonuses(promo_code);
CREATE INDEX IF NOT EXISTS idx_bonuses_valid_until ON bonuses(valid_until);
CREATE INDEX IF NOT EXISTS idx_bonuses_featured_home ON bonuses(is_featured_home, home_rank);

-- Add comments for documentation
COMMENT ON COLUMN bonuses.promo_code IS 'Bonus promo code for claiming the bonus';
COMMENT ON COLUMN bonuses.valid_from IS 'Start date when bonus becomes valid';
COMMENT ON COLUMN bonuses.valid_until IS 'End date when bonus expires';
COMMENT ON COLUMN bonuses.max_bet IS 'Maximum bet allowed when using bonus funds';
COMMENT ON COLUMN bonuses.max_bet_text IS 'Description text for maximum bet restrictions';
COMMENT ON COLUMN bonuses.wagering_x IS 'Wagering requirement multiplier (e.g., 25x)';
COMMENT ON COLUMN bonuses.wagering_text IS 'Description text for wagering requirements';
COMMENT ON COLUMN bonuses.free_spins IS 'Number of free spins included with bonus';
COMMENT ON COLUMN bonuses.free_spin_value IS 'Value per free spin (e.g., 0.25)';
COMMENT ON COLUMN bonuses.play_now_text IS 'Custom text for play now button';
COMMENT ON COLUMN bonuses.terms IS 'Additional terms and conditions text';
COMMENT ON COLUMN bonuses.expiry_days IS 'Number of days until bonus expires';
COMMENT ON COLUMN bonuses.expiry_text IS 'Description text for expiry information';
COMMENT ON COLUMN bonuses.value_text IS 'Custom description text for free spins value section';
COMMENT ON COLUMN bonuses.claiming_speed IS 'Speed label for bonus claiming process (FAST, INSTANT, QUICK, etc.)';
COMMENT ON COLUMN bonuses.card_bg_color IS 'Hex color code for bonus card background (e.g., #FF6B35)';
COMMENT ON COLUMN bonuses.how_to_get IS 'Custom description text for claiming process details';
COMMENT ON COLUMN bonuses.is_featured_home IS 'Whether bonus is featured on homepage';
COMMENT ON COLUMN bonuses.home_rank IS 'Display order for homepage featured bonuses';
COMMENT ON COLUMN bonuses.home_link_override IS 'Override URL for homepage CTA';
COMMENT ON COLUMN bonuses.claim_url IS 'Direct URL to claim the bonus';
