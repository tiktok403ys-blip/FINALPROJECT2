-- Insert partner/sponsor data for logo slider (separated to avoid syntax issues)
INSERT INTO partners (name, logo_url, website_url, description, partner_type, display_order) VALUES
('Evolution Gaming', '/placeholder.svg?height=60&width=120&text=Evolution', 'https://evolution.com', 'Leading live casino game provider', 'partner', 1),
('NetEnt', '/placeholder.svg?height=60&width=120&text=NetEnt', 'https://netent.com', 'Premium slot game developer', 'partner', 2),
('Microgaming', '/placeholder.svg?height=60&width=120&text=Microgaming', 'https://microgaming.com', 'Pioneer in online gaming software', 'partner', 3),
('Pragmatic Play', '/placeholder.svg?height=60&width=120&text=Pragmatic', 'https://pragmaticplay.com', 'Multi-product content provider', 'partner', 4),
('Play n GO', '/placeholder.svg?height=60&width=120&text=PlaynGO', 'https://playngo.com', 'Mobile-first game developer', 'partner', 5),
('Red Tiger Gaming', '/placeholder.svg?height=60&width=120&text=RedTiger', 'https://redtiger.com', 'Innovative slot game creator', 'partner', 6),
('Big Time Gaming', '/placeholder.svg?height=60&width=120&text=BigTime', 'https://bigtimegaming.com', 'Megaways slot innovator', 'partner', 7),
('Yggdrasil Gaming', '/placeholder.svg?height=60&width=120&text=Yggdrasil', 'https://yggdrasilgaming.com', 'Superior gaming experiences', 'partner', 8),
('Quickspin', '/placeholder.svg?height=60&width=120&text=Quickspin', 'https://quickspin.com', 'Swedish slot game studio', 'partner', 9),
('Thunderkick', '/placeholder.svg?height=60&width=120&text=Thunder', 'https://thunderkick.com', 'Unique and quirky slot games', 'partner', 10),
('Betsoft Gaming', '/placeholder.svg?height=60&width=120&text=Betsoft', 'https://betsoft.com', '3D cinematic gaming experience', 'partner', 11),
('Push Gaming', '/placeholder.svg?height=60&width=120&text=Push', 'https://pushgaming.com', 'Innovative mobile-first developer', 'partner', 12);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_footer_content_section ON footer_content(section, display_order);
CREATE INDEX IF NOT EXISTS idx_partners_active ON partners(is_active, display_order);
