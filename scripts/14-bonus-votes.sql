-- Votes for bonuses: track Yes/No and prevent duplicate votes

alter table bonuses add column if not exists promo_code text;
alter table bonuses add column if not exists yes_count integer default 0;
alter table bonuses add column if not exists no_count integer default 0;

create table if not exists bonus_votes (
  id uuid default gen_random_uuid() primary key,
  bonus_id uuid references bonuses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  vote smallint check (vote in (1,-1)),
  created_at timestamptz default now(),
  unique(bonus_id, user_id)
);

alter table bonus_votes enable row level security;

create policy if not exists "Public can read bonus votes" on bonus_votes for select using (true);
create policy if not exists "Auth can insert bonus vote" on bonus_votes for insert with check (auth.uid() = user_id);
create policy if not exists "Owner can update bonus vote" on bonus_votes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "Owner can delete bonus vote" on bonus_votes for delete using (auth.uid() = user_id);

create or replace function fn_sync_bonus_vote_counters() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.vote = 1 then
      update bonuses set yes_count = yes_count + 1 where id = new.bonus_id;
    else
      update bonuses set no_count = no_count + 1 where id = new.bonus_id;
    end if;
  elsif tg_op = 'UPDATE' then
    if old.vote <> new.vote then
      if new.vote = 1 then
        update bonuses set yes_count = yes_count + 1, no_count = greatest(no_count - 1, 0) where id = new.bonus_id;
      else
        update bonuses set no_count = no_count + 1, yes_count = greatest(yes_count - 1, 0) where id = new.bonus_id;
      end if;
    end if;
  elsif tg_op = 'DELETE' then
    if old.vote = 1 then
      update bonuses set yes_count = greatest(yes_count - 1, 0) where id = old.bonus_id;
    else
      update bonuses set no_count = greatest(no_count - 1, 0) where id = old.bonus_id;
    end if;
  end if;
  return null;
end $$;

drop trigger if exists trg_sync_bonus_vote_counters_ins on bonus_votes;
drop trigger if exists trg_sync_bonus_vote_counters_upd on bonus_votes;
drop trigger if exists trg_sync_bonus_vote_counters_del on bonus_votes;

create trigger trg_sync_bonus_vote_counters_ins after insert on bonus_votes for each row execute function fn_sync_bonus_vote_counters();
create trigger trg_sync_bonus_vote_counters_upd after update on bonus_votes for each row execute function fn_sync_bonus_vote_counters();
create trigger trg_sync_bonus_vote_counters_del after delete on bonus_votes for each row execute function fn_sync_bonus_vote_counters();


