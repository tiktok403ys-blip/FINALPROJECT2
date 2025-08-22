-- Temporary test: Remove logo_url from TEST casino to test placeholder
UPDATE casinos 
SET logo_url = NULL 
WHERE name = 'TEST';

-- Also update placeholder_bg_color to a distinct color for testing
UPDATE casinos 
SET placeholder_bg_color = '#ff6b35' 
WHERE name = 'TEST';