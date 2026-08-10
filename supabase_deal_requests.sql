-- "Can't find your deal?" request form submissions
-- Run once in Supabase dashboard → SQL Editor → New query → Run

CREATE TABLE IF NOT EXISTS deal_requests (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid,                        -- null for signed-out visitors
  email              text NOT NULL,
  name               text,

  departure_month    text NOT NULL,               -- e.g. "September 2026"
  trip_scope         text NOT NULL,               -- 'Domestic' | 'International'
  trip_duration_days int,                         -- null for one-way / flexible
  origin_city        text,
  dest_city          text NOT NULL,
  dest_country       text NOT NULL,
  trip_type          text NOT NULL,               -- 'One way' | 'Round trip'
  notes              text,

  status             text DEFAULT 'new',          -- new | in_progress | fulfilled | closed
  created_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dr_created ON deal_requests (created_at);
CREATE INDEX IF NOT EXISTS idx_dr_status  ON deal_requests (status);
CREATE INDEX IF NOT EXISTS idx_dr_user    ON deal_requests (user_id);
