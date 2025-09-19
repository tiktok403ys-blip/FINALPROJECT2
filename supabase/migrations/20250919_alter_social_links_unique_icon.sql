-- Ensure unique icon per social link for upsert
do $$ begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'social_links_icon_key'
  ) then
    alter table public.social_links add constraint social_links_icon_key unique (icon);
  end if;
end $$;


