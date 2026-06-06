-- Run this in your Supabase SQL editor

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  origin_iata text not null,
  dest_iata text not null,
  origin_city text not null,
  dest_city text not null,
  airline text not null,
  normal_price numeric not null,
  deal_price numeric not null,
  currency text not null default 'INR',
  validity_start date not null,
  validity_end date not null,
  source_url text not null,
  image_url text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'expired')),
  published_at timestamptz,
  curator_note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  signup_date timestamptz not null default now(),
  confirmed boolean not null default false,
  source text,
  last_active_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists deal_events (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  subscriber_id uuid references subscribers(id) on delete set null,
  event_type text not null check (event_type in ('sent', 'opened', 'clicked', 'booked_redirect', 'share_clicked')),
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists deals_status_published_at on deals (status, published_at desc);
create index if not exists deal_events_deal_id on deal_events (deal_id);
create index if not exists deal_events_subscriber_id on deal_events (subscriber_id);

-- RLS
alter table deals enable row level security;
alter table subscribers enable row level security;
alter table deal_events enable row level security;

-- Allow anyone to read published deals
drop policy if exists "Public can read published deals" on deals;
create policy "Public can read published deals" on deals for select using (status = 'published');
