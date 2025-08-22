-- Add display_order column to casinos table for custom ordering
-- Lower numbers appear first (1 = top position, 999 = default for unordered casinos)

ALTER TABLE casinos
ADD COLUMN display_order INTEGER DEFAULT 999;

-- Create index for better performance on ordering queries
CREATE INDEX IF NOT EXISTS idx_casinos_display_order ON casinos(display_order);

-- Update existing casinos with sequential order based on creation date
-- This ensures backward compatibility and gives existing casinos reasonable order
WITH ordered_casinos AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM casinos
  WHERE display_order = 999 OR display_order IS NULL
)
UPDATE casinos
SET display_order = ordered_casinos.row_num
FROM ordered_casinos
WHERE casinos.id = ordered_casinos.id;

-- Add comment for documentation
COMMENT ON COLUMN casinos.display_order IS 'Custom display order for casino positioning (lower number = higher position, default: 999)';
