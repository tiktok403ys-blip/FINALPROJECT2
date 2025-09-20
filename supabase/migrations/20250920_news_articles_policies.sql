-- RLS for news_articles
alter table if exists public.news_articles enable row level security;

-- Public can read only published articles
drop policy if exists news_articles_public_read on public.news_articles;
create policy news_articles_public_read
on public.news_articles
for select
to anon, authenticated
using (status = 'published');

-- Admin CRUD based on admin_users membership
drop policy if exists news_articles_admin_insert on public.news_articles;
create policy news_articles_admin_insert
on public.news_articles
for insert
to authenticated
with check (
  exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
      and au.role in ('admin','super_admin')
  )
);

drop policy if exists news_articles_admin_update on public.news_articles;
create policy news_articles_admin_update
on public.news_articles
for update
to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
      and au.role in ('admin','super_admin')
  )
)
with check (
  exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
      and au.role in ('admin','super_admin')
  )
);

drop policy if exists news_articles_admin_delete on public.news_articles;
create policy news_articles_admin_delete
on public.news_articles
for delete
to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
      and au.role in ('admin','super_admin')
  )
);


