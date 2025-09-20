-- Seed example categories and news articles (table: public.news_articles)
-- Run this SQL in Supabase SQL Editor if needed.

insert into public.news_articles (title, content, excerpt, featured_image, author, category, tags, status, is_featured, published_at)
values
  (
    'Singapore Regulator Updates Online Gambling Rules',
    'The Gambling Regulatory Authority (GRA) announced updates to the online gambling framework, focusing on player protection, AML compliance, and platform transparency. Operators must implement stronger KYC and responsible gambling tools by Q1 next year.',
    'GRA announces updates to the online gambling framework focusing on player protection and compliance.',
    '',
    'GuruSingapore Newsroom',
    'Regulations',
    array['regulation','singapore','compliance'],
    'published',
    true,
    now()
  ),
  (
    'Top Slots Providers Announce New RNG Certifications',
    'Several leading slots providers announced new certifications for their RNG systems after independent audits. The move aims to increase trust and fairness across popular titles in Southeast Asia.',
    'Leading slots providers receive new RNG certifications following independent audits.',
    '',
    'GuruSingapore Editorial',
    'Technology',
    array['rng','audit','slots'],
    'published',
    false,
    now() - interval '1 day'
  ),
  (
    'Exclusive Deposit Bonuses for New Players in December',
    'Several licensed casinos have announced exclusive December promotions including cashback, free spins, and deposit matches. Terms apply; always read wagering requirements.',
    'Exclusive December promotions: cashback, free spins, and deposit matches.',
    '',
    'Promotions Team',
    'Promotions',
    array['bonus','cashback','free-spins'],
    'published',
    false,
    now() - interval '2 days'
  );


