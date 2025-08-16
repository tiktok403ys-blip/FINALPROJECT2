-- Align footer_content table structure with baseline.sql requirements
-- This migration adds missing columns and adjusts structure

-- Add missing columns to footer_content table
ALTER TABLE footer_content 
ADD COLUMN IF NOT EXISTS link_url TEXT,
ADD COLUMN IF NOT EXISTS link_text VARCHAR(255);

-- Add section column as alias for section_name for compatibility
ALTER TABLE footer_content 
ADD COLUMN IF NOT EXISTS section VARCHAR(100);

-- Update section column with values from section_name
UPDATE footer_content 
SET section = section_name 
WHERE section IS NULL;

-- Make section column NOT NULL after populating it
ALTER TABLE footer_content 
ALTER COLUMN section SET NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_footer_content_section ON footer_content(section);
CREATE INDEX IF NOT EXISTS idx_footer_content_display_order ON footer_content(display_order);

-- Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON footer_content TO authenticated;
GRANT SELECT ON footer_content TO anon;