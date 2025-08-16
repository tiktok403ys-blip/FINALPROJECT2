-- Fix footer_content data before running baseline.sql
-- Update null section_name values

UPDATE footer_content 
SET section_name = section 
WHERE section_name IS NULL AND section IS NOT NULL;

-- Set default section_name for any remaining null values
UPDATE footer_content 
SET section_name = 'general' 
WHERE section_name IS NULL;

-- Ensure section_name is not null constraint
ALTER TABLE footer_content 
ALTER COLUMN section_name SET NOT NULL;