-- Bonuses random function with deterministic seed (default: current date)
-- Allows selecting active/featured bonuses in a stable "random" order

create or replace function public.bonuses_random(
  p_limit integer default 27,
  p_only_featured boolean default true,
  p_seed text default to_char(current_date, 'YYYYMMDD')
) returns setof public.bonuses
language sql
stable
as $$
  with base as (
    select *
    from public.bonuses
    where is_active = true
      and (not p_only_featured or coalesce(is_featured_home, false) = true)
  )
  select *
  from base
  order by md5((id::text || '-' || coalesce(p_seed, '')))
  limit p_limit;
$$;

-- Grant execute to anon/service roles if needed (PostgREST)
grant execute on function public.bonuses_random(integer, boolean, text) to anon, authenticated;


