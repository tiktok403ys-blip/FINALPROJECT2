-- Trigger HTTP webhook on new pending player review

create or replace function fn_notify_new_player_review()
returns trigger language plpgsql as $$
declare
  v_url text := current_setting('app.webhook_player_review_url', true);
begin
  if new.is_approved = false and v_url is not null and v_url <> '' then
    perform
      net.http_post(
        url := v_url,
        headers := jsonb_build_object('x-webhook-secret', current_setting('app.webhook_secret', true)),
        body := jsonb_build_object(
          'id', new.id,
          'casino_id', new.casino_id,
          'user_id', new.user_id,
          'reviewer_name', new.reviewer_name,
          'title', new.title,
          'content', new.content,
          'rating', new.rating,
          'created_at', new.created_at
        )
      );
  end if;
  return null;
end $$;

drop trigger if exists trg_notify_new_player_review on player_reviews;
create trigger trg_notify_new_player_review
after insert on player_reviews
for each row execute function fn_notify_new_player_review();

-- To configure at runtime:
-- select set_config('app.webhook_player_review_url', 'https://YOUR_DOMAIN/api/webhooks/player-review?secret=YOUR_SECRET', false);
-- select set_config('app.webhook_secret', 'YOUR_SECRET', false);


