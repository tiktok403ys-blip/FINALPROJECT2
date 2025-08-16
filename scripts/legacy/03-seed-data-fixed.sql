-- Insert sample casinos
INSERT INTO casinos (name, description, rating, location, bonus_info, website_url) VALUES
('Royal Casino', 'Premium online casino with extensive game selection', 4.8, 'Malta', 'Welcome bonus up to $1000 + 100 free spins', 'https://royalcasino.com'),
('Lucky Stars Casino', 'Modern casino with live dealers and slots', 4.5, 'Curacao', '$500 welcome package + 50 free spins', 'https://luckystars.com'),
('Diamond Palace', 'Luxury casino experience with VIP rewards', 4.7, 'Gibraltar', 'Up to $2000 welcome bonus', 'https://diamondpalace.com'),
('Golden Spin Casino', 'Fast payouts and great customer service', 4.3, 'Malta', '$750 bonus + 75 free spins', 'https://goldenspin.com'),
('Neon Nights Casino', 'Exciting games with progressive jackpots', 4.6, 'Curacao', 'Welcome package up to $1500', 'https://neonnights.com'),
('Platinum Elite Casino', 'High-roller friendly with exclusive games', 4.9, 'Malta', 'VIP welcome bonus up to $5000', 'https://platinumelite.com'),
('Cosmic Casino', 'Space-themed casino with unique games', 4.2, 'Curacao', '$800 bonus + 80 free spins', 'https://cosmiccasino.com'),
('Thunder Bay Casino', 'Canadian-themed casino with maple bonuses', 4.4, 'Ontario', 'C$1200 welcome bonus', 'https://thunderbay.com');

-- Insert sample bonuses (using casino IDs)
INSERT INTO bonuses (title, description, bonus_amount, bonus_type, expiry_date, casino_id, claim_url)
SELECT 
  'Welcome Bonus',
  'New player welcome bonus with free spins',
  '$1000 + 100 Free Spins',
  'Welcome',
  CURRENT_DATE + INTERVAL '30 days',
  id,
  'https://example.com/claim'
FROM casinos 
WHERE name IN ('Royal Casino', 'Lucky Stars Casino', 'Diamond Palace');

-- Insert more varied bonuses
INSERT INTO bonuses (title, description, bonus_amount, bonus_type, expiry_date, casino_id, claim_url)
SELECT 
  'Weekend Reload Bonus',
  'Special weekend bonus for existing players',
  '50% up to $500',
  'Reload',
  CURRENT_DATE + INTERVAL '7 days',
  id,
  'https://example.com/weekend'
FROM casinos 
WHERE name IN ('Golden Spin Casino', 'Neon Nights Casino');

INSERT INTO bonuses (title, description, bonus_amount, bonus_type, expiry_date, casino_id, claim_url)
SELECT 
  'Free Spins Friday',
  'Weekly free spins promotion',
  '100 Free Spins',
  'Free Spins',
  CURRENT_DATE + INTERVAL '14 days',
  id,
  'https://example.com/freespins'
FROM casinos 
WHERE name IN ('Platinum Elite Casino', 'Cosmic Casino');

-- Insert sample leaderboard data with more variety
INSERT INTO leaderboard (player_name, points, rank) VALUES
('CasinoKing2024', 15750, 1),
('LuckyPlayer88', 14200, 2),
('SlotMaster', 13800, 3),
('PokerPro', 12500, 4),
('BlackjackBoss', 11900, 5),
('RouletteRuler', 11200, 6),
('BaccaratBeast', 10800, 7),
('CrapsChampion', 10300, 8),
('VideoPokerVIP', 9750, 9),
('JackpotHunter', 9200, 10),
('HighRoller', 8800, 11),
('CardShark', 8400, 12),
('DiceDealer', 7900, 13),
('SpinWinner', 7500, 14),
('BetMaster', 7100, 15);

-- Update leaderboard with random casino associations
UPDATE leaderboard 
SET casino_id = (
  SELECT id FROM casinos 
  ORDER BY RANDOM() 
  LIMIT 1
);

-- Insert sample news with varied categories
INSERT INTO news (title, content, excerpt, category, published) VALUES
('New Casino Regulations Announced for 2024', 
 'The gaming authority has announced comprehensive new regulations that will take effect in early 2024. These regulations focus on player protection, responsible gambling measures, and enhanced security protocols. Casino operators will need to implement new verification systems and provide more detailed reporting on player activities. The changes are expected to improve the overall safety and transparency of online gambling.',
 'Latest updates on casino regulations and player protection measures for 2024', 
 'Regulation', true),

('Top 10 Slot Games Dominating 2024', 
 'This year has seen incredible innovation in slot game development. From immersive 3D graphics to innovative bonus features, game developers are pushing the boundaries of what''s possible. Our analysis of player data shows clear favorites emerging, with themes ranging from ancient mythology to futuristic sci-fi adventures. Progressive jackpots continue to attract players, with several games offering life-changing prizes.',
 'Discover the most popular and innovative slot games taking the casino world by storm', 
 'Games', true),

('Enhanced Security Measures Implemented Across Major Casinos', 
 'Leading online casinos have implemented state-of-the-art security measures including advanced encryption, biometric verification, and AI-powered fraud detection. These improvements come in response to evolving cyber threats and regulatory requirements. Players can now enjoy enhanced protection of their personal and financial information while gaming online.',
 'Major security improvements protect players with advanced technology', 
 'Security', true),

('Mobile Gaming Revenue Surpasses Desktop for First Time', 
 'Industry reports show that mobile casino gaming has officially overtaken desktop gaming in terms of revenue generation. This shift reflects changing player preferences and improved mobile technology. Casino operators are investing heavily in mobile-optimized games and apps to meet this growing demand.',
 'Mobile gaming reaches new milestone in casino industry growth', 
 'Industry', true),

('Cryptocurrency Payments Gain Popularity in Online Casinos', 
 'Bitcoin, Ethereum, and other cryptocurrencies are becoming increasingly popular payment methods in online casinos. Players appreciate the enhanced privacy, faster transactions, and lower fees associated with crypto payments. Many casinos now offer special bonuses for cryptocurrency deposits.',
 'Digital currencies revolutionize casino payment methods', 
 'Industry', true),

('Responsible Gambling Tools See Increased Usage', 
 'New data shows a significant increase in the use of responsible gambling tools such as deposit limits, session timers, and self-exclusion options. This trend indicates growing awareness of responsible gaming practices among players and the effectiveness of casino-provided safety measures.',
 'Players increasingly utilize responsible gambling features for safer gaming', 
 'Security', true);

-- Insert sample forum posts with engaging content
INSERT INTO forum_posts (title, content, category) VALUES
('Best Strategies for Blackjack Beginners', 
 'I''ve been playing blackjack for a few months now and wanted to share some strategies that have helped me improve my game. Basic strategy is essential - always hit on 16 or less when dealer shows 7 or higher. Card counting isn''t necessary for casual players, but understanding when to double down can make a big difference. What strategies have worked for you?', 
 'Strategy'),

('Welcome New Players - Introduce Yourself!', 
 'This is a friendly space for new players to introduce themselves and ask questions. Whether you''re new to online casinos or just new to our community, we''re here to help! Share your favorite games, ask about bonuses, or just say hello. Our experienced members are always happy to share tips and advice.', 
 'General'),

('Bonus Hunting: Ethical or Not?', 
 'There''s been a lot of discussion about bonus hunting lately. Some say it''s a legitimate strategy to maximize value, while others argue it goes against the spirit of casino gaming. What''s your take? Is it ethical to sign up to multiple casinos just for their welcome bonuses? Let''s have a respectful discussion about this topic.', 
 'Bonuses'),

('Review: My Experience at Diamond Palace Casino', 
 'I''ve been playing at Diamond Palace for about 6 months now and wanted to share my honest review. The game selection is excellent, especially their live dealer section. Customer support has been responsive when I''ve needed help. The withdrawal process took about 3 days, which is reasonable. Overall, I''d rate it 4/5 stars. Has anyone else tried this casino?', 
 'Reviews'),

('Having Issues with Withdrawal - Need Advice', 
 'I''ve been waiting for my withdrawal for over a week now and customer support keeps giving me the runaround. They''re asking for additional verification documents even though my account was already verified. Has anyone experienced similar issues? What should I do next? Any advice would be appreciated.', 
 'Support'),

('Favorite Live Dealer Games Discussion', 
 'What are your favorite live dealer games and why? I''ve been really enjoying live baccarat lately - the atmosphere is great and the dealers are professional. Live roulette is also fun, especially the immersive versions with multiple camera angles. Would love to hear your recommendations!', 
 'General');

-- Insert sample reports
INSERT INTO reports (title, description, casino_name, user_email, status) VALUES
('Delayed Withdrawal Processing', 
 'I submitted a withdrawal request 10 days ago and it''s still pending. Customer support is not responding to my emails. The casino claims it takes 3-5 business days but it''s been much longer. I have provided all required verification documents.', 
 'Lucky Stars Casino', 
 'player1@email.com', 
 'pending'),

('Misleading Bonus Terms', 
 'The welcome bonus advertised 100 free spins, but I only received 50. When I contacted support, they said the terms changed but the website still shows the old offer. This seems misleading to new players.', 
 'Golden Spin Casino', 
 'player2@email.com', 
 'pending'),

('Game Malfunction During Big Win', 
 'I was playing a slot game and hit a big win, but the game froze and when I refreshed, the win was gone. Support claims there''s no record of the win, but I have a screenshot. This seems like a technical issue that cost me money.', 
 'Neon Nights Casino', 
 'player3@email.com', 
 'pending'),

('Account Closed Without Explanation', 
 'My account was suddenly closed without any explanation. I had a balance of $500 and was in the middle of meeting wagering requirements for a bonus. Customer support won''t give me a clear reason for the closure.', 
 'Cosmic Casino', 
 'player4@email.com', 
 'pending');
