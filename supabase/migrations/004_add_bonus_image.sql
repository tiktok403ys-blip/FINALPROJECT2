-- Add image_url field to bonuses table
ALTER TABLE bonuses ADD COLUMN image_url TEXT;

-- Add comment for the new column
COMMENT ON COLUMN bonuses.image_url IS 'URL of the bonus promotional image';