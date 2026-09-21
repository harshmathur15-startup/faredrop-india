-- Enable Row Level Security across all public tables (security hardening).
--
-- WHY: the anon key is public (it ships in the browser bundle by design). Any
-- table WITHOUT RLS is therefore readable/writable by anyone on the internet via
-- the Supabase REST API (e.g. GET /rest/v1/subscribers?select=* with the anon
-- key). Every server route in this app uses the SERVICE-ROLE key, which BYPASSES
-- RLS -- so enabling RLS with no policy locks out the public without breaking the
-- app. Only two tables are read with the anon key and need explicit policies:
--   * deals            -> public storefront, read by anon on /deal/[id] pages
--   * user_preferences -> each signed-in user reads/writes ONLY their own row
--
-- Idempotent: safe to re-run. Verify afterwards with:
--   select tablename, rowsecurity from pg_tables where schemaname='public';

-- ---- Default-deny: server-only tables (PII, money, entitlements, flight data) ----
alter table public.subscribers        enable row level security;
alter table public.profiles           enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.waitlist           enable row level security;
alter table public.deal_requests      enable row level security;
alter table public.agent_packages     enable row level security;
alter table public.flight_alerts      enable row level security;
alter table public.deal_candidates    enable row level security;
alter table public.flight_itineraries enable row level security;
alter table public.price_history      enable row level security;
alter table public.route_prices       enable row level security;
alter table public.explore_cache      enable row level security;

-- ---- Explicit allow: deals (public read) ----
alter table public.deals enable row level security;
drop policy if exists "public read deals" on public.deals;
create policy "public read deals" on public.deals
  for select using (true);

-- ---- Explicit allow: user_preferences (own row only) ----
alter table public.user_preferences enable row level security;
drop policy if exists "own prefs select" on public.user_preferences;
drop policy if exists "own prefs insert" on public.user_preferences;
drop policy if exists "own prefs update" on public.user_preferences;
create policy "own prefs select" on public.user_preferences
  for select using (auth.uid() = user_id);
create policy "own prefs insert" on public.user_preferences
  for insert with check (auth.uid() = user_id);
create policy "own prefs update" on public.user_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
