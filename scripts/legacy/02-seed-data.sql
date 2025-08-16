-- Insert sample casinos
INSERT INTO casinos (name, description, rating, location, bonus_info, website_url) VALUES
('Royal Casino', 'Premium online casino with extensive game selection', 4.8, 'Malta', 'Welcome bonus up to $1000 + 100 free spins', 'https://royalcasino.com'),
('Lucky Stars Casino', 'Modern casino with live dealers and slots', 4.5, 'Curacao', '$500 welcome package + 50 free spins', 'https://luckystars.com'),
('Diamond Palace', 'Luxury casino experience with VIP rewards', 4.7, 'Gibraltar', 'Up to $2000 welcome bonus', 'https://diamondpalace.com'),
('Golden Spin Casino', 'Fast payouts and great customer service', 4.3, 'Malta', '$750 bonus + 75 free spins', 'https://goldenspin.com'),
('Neon Nights Casino', 'Exciting games with progressive jackpots', 4.6, 'Curacao', 'Welcome package up to $1500', 'https://neonnights.com');

-- Insert sample bonuses
INSERT INTO bonuses (title, description, bonus_amount, bonus_type, expiry_date, casino_id, claim_url)
SELECT 
  'Welcome Bonus',
  'New player welcome bonus with free spins',
  '$1000 + 100 Free Spins',
  'Welcome',
  CURRENT_DATE + INTERVAL '30 days',
  id,
  'https://example.com/claim'
FROM casinos LIMIT 3;

-- Insert sample leaderboard data
INSERT INTO leaderboard (player_name, points, rank, casino_id)
SELECT 
  'Player' || generate_series(1, 10),
  (1000 - (generate_series(1, 10) * 50)),
  generate_series(1, 10),
  (SELECT id FROM casinos ORDER BY RANDOM() LIMIT 1)
FROM generate_series(1, 10);

-- Insert sample news
INSERT INTO news (title, content, excerpt, category, published) VALUES
('New Casino Regulations Announced', 'The gaming authority has announced new regulations...', 'Latest updates on casino regulations', 'Regulation', true),
('Top 5 Slot Games This Month', 'Discover the most popular slot games...', 'Monthly roundup of popular slots', 'Games', true),
('Casino Security Updates', 'Enhanced security measures implemented...', 'Important security improvements', 'Security', true);

-- Insert sample forum posts
INSERT INTO forum_posts (title, content, category) VALUES
('Best strategies for blackjack', 'What are your favorite blackjack strategies?', 'Strategy'),
('New player introduction', 'Hello everyone, new to online casinos!', 'General'),
('Bonus hunting tips', 'Share your best bonus hunting techniques', 'Bonuses');
