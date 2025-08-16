-- Extend bonuses table with detailed fields used by public cards
alter table public.bonuses
  add column if not exists promo_code text,
  add column if not exists is_exclusive boolean default false,
  add column if not exists is_no_deposit boolean default false,
  add column if not exists wagering_x int,
  add column if not exists free_spins int,
  add column if not exists free_spin_value numeric,
  add column if not exists max_bet numeric,
  add column if not exists expiry_days int,
  add column if not exists terms text,
  add column if not exists how_to_get text,
  add column if not exists image_url text;


