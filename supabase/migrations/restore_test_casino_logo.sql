-- Restore logo_url for TEST casino
UPDATE casinos 
SET logo_url = 'https://example.com/test-casino-logo.png'
WHERE name = 'TEST';