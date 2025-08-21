-- Add placeholder_bg_color field to casinos table
ALTER TABLE casinos ADD COLUMN placeholder_bg_color VARCHAR(7) DEFAULT '#1f2937';

-- Add comment to describe the field
COMMENT ON COLUMN casinos.placeholder_bg_color IS 'Background color for logo placeholder in hex format (e.g., #1f2937)';