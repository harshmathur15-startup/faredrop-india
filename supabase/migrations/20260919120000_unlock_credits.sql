-- Phase 1: Unlock-credits economy
-- Free (signed-up, unpaid) users get 3 unlock credits per calendar month (IST),
-- reset-to-3 "use it or lose it". Each unlock spends 1 credit and PERMANENTLY
-- reveals that deal for the user (recorded in deal_unlocks, survives monthly reset).
-- Paid users (silver/gold) bypass credits entirely (enforced in the app).

------------------------------------------------------------------------
-- 1. Credit balance + period on the existing per-user table
------------------------------------------------------------------------
alter table public.user_preferences
  add column if not exists unlock_credits int  not null default 3,
  add column if not exists credits_period  text not null default to_char(now() at time zone 'Asia/Kolkata', 'YYYY-MM');

------------------------------------------------------------------------
-- 2. Permanent record of which deals a user has unlocked
------------------------------------------------------------------------
create table if not exists public.deal_unlocks (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  deal_id     uuid        not null references public.deals(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, deal_id)
);

alter table public.deal_unlocks enable row level security;

-- Users may read their own unlocks. Inserts happen only via the SECURITY DEFINER
-- RPC below (so there is deliberately no INSERT policy for clients).
drop policy if exists deal_unlocks_own_select on public.deal_unlocks;
create policy deal_unlocks_own_select on public.deal_unlocks
  for select using (auth.uid() = user_id);

------------------------------------------------------------------------
-- 3. Atomic unlock: applies monthly reset, checks balance, records unlock
------------------------------------------------------------------------
create or replace function public.unlock_deal(p_deal_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_month   text := to_char(now() at time zone 'Asia/Kolkata', 'YYYY-MM');
  v_credits int;
  v_period  text;
  v_exists  boolean;
begin
  if v_user is null then
    return json_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  -- Load (and lock) this user's balance; create the row if it doesn't exist yet.
  select unlock_credits, credits_period into v_credits, v_period
    from user_preferences where user_id = v_user for update;

  if not found then
    insert into user_preferences (user_id, unlock_credits, credits_period)
      values (v_user, 3, v_month)
      on conflict (user_id) do update set unlock_credits = user_preferences.unlock_credits
      returning unlock_credits, credits_period into v_credits, v_period;
  end if;

  -- Monthly reset-to-3 (use it or lose it).
  if v_period is distinct from v_month then
    v_credits := 3;
    update user_preferences set unlock_credits = 3, credits_period = v_month where user_id = v_user;
  end if;

  -- Already unlocked → no charge (idempotent).
  select true into v_exists from deal_unlocks where user_id = v_user and deal_id = p_deal_id;
  if v_exists then
    return json_build_object('ok', true, 'already', true, 'credits', v_credits);
  end if;

  if v_credits <= 0 then
    return json_build_object('ok', false, 'reason', 'no_credits', 'credits', 0);
  end if;

  insert into deal_unlocks (user_id, deal_id) values (v_user, p_deal_id)
    on conflict do nothing;
  update user_preferences set unlock_credits = unlock_credits - 1 where user_id = v_user;

  return json_build_object('ok', true, 'credits', v_credits - 1);
end;
$$;

grant execute on function public.unlock_deal(uuid) to authenticated;

------------------------------------------------------------------------
-- 4. Read state: effective balance (lazy monthly reset, no write) + unlocked ids
------------------------------------------------------------------------
create or replace function public.get_unlock_state()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_month   text := to_char(now() at time zone 'Asia/Kolkata', 'YYYY-MM');
  v_credits int;
  v_period  text;
  v_ids     uuid[];
begin
  if v_user is null then
    return json_build_object('credits', 0, 'unlocked', '[]'::json);
  end if;

  select unlock_credits, credits_period into v_credits, v_period
    from user_preferences where user_id = v_user;
  if not found then v_credits := 3; v_period := v_month; end if;

  -- Effective balance if a new month has started (actual write happens on next unlock).
  if v_period is distinct from v_month then v_credits := 3; end if;

  select coalesce(array_agg(deal_id), '{}') into v_ids
    from deal_unlocks where user_id = v_user;

  return json_build_object('credits', v_credits, 'unlocked', to_json(v_ids));
end;
$$;

grant execute on function public.get_unlock_state() to authenticated;
