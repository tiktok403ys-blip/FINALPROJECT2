-- Optional custom texts per bonus section (overrides defaults on public page)
alter table public.bonuses
  add column if not exists play_now_text text,
  add column if not exists wagering_text text,
  add column if not exists value_text text,
  add column if not exists max_bet_text text,
  add column if not exists expiry_text text;


