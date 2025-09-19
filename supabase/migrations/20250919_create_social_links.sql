-- Create table for social media links
create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null, -- e.g., 'facebook', 'telegram', 'whatsapp'
  url text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Basic index for ordering
create index if not exists social_links_sort_order_idx on public.social_links(sort_order);
create index if not exists social_links_is_active_idx on public.social_links(is_active);

-- Trigger to update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tg_social_links_updated_at on public.social_links;
create trigger tg_social_links_updated_at
before update on public.social_links
for each row execute function public.set_updated_at();

-- RLS policies (allow read to anon for active links, write to authenticated admins using admin_users table)
alter table public.social_links enable row level security;

-- Read policy: allow everyone to read only active links
create policy social_links_read_active
on public.social_links
for select
to anon, authenticated
using (is_active = true);

-- Write policies: authenticated users with claim 'role' in ('admin','super_admin')
drop policy if exists social_links_admin_insert on public.social_links;
create policy social_links_admin_insert
on public.social_links
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
      and au.role in ('admin','super_admin')
  )
);

drop policy if exists social_links_admin_update on public.social_links;
create policy social_links_admin_update
on public.social_links
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
      and au.role in ('admin','super_admin')
  )
)
with check (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
      and au.role in ('admin','super_admin')
  )
);

drop policy if exists social_links_admin_delete on public.social_links;
create policy social_links_admin_delete
on public.social_links
for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
      and au.role in ('admin','super_admin')
  )
);


