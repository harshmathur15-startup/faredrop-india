-- ============================================================
-- Travelbaby Marketplace: agent/creator roles + agent-posted packages
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- Roles for every auth user (default traveller). Agents/creators opt in.
CREATE TABLE IF NOT EXISTS profiles (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role             TEXT NOT NULL DEFAULT 'traveller'
                     CHECK (role IN ('traveller','agent','creator')),
  full_name        TEXT,
  phone            TEXT,
  -- agent fields
  agency_name      TEXT,
  agency_city      TEXT,
  -- creator fields
  instagram_handle TEXT,
  audience_size    INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Travel packages posted by agents. Hidden until Travel Baby (admin) verifies.
CREATE TABLE IF NOT EXISTS agent_packages (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  destination           TEXT NOT NULL,
  description           TEXT,
  price_per_person      INTEGER,          -- INR
  duration_days         INTEGER,
  start_date            DATE,
  end_date              DATE,
  inclusions            TEXT,
  image_url             TEXT,
  verification_status   TEXT NOT NULL DEFAULT 'pending'
                          CHECK (verification_status IN ('pending','verified','rejected')),
  visible_to_travellers BOOLEAN NOT NULL DEFAULT false,
  rejection_reason      TEXT,
  published_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_packages_agent ON agent_packages(agent_id);
CREATE INDEX IF NOT EXISTS agent_packages_verif ON agent_packages(verification_status);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_packages ENABLE ROW LEVEL SECURITY;

-- profiles: users manage only their own row
DROP POLICY IF EXISTS "own_profile_all" ON profiles;
CREATE POLICY "own_profile_all" ON profiles FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- agent_packages: agents manage only their own rows
DROP POLICY IF EXISTS "agent_own_packages" ON agent_packages;
CREATE POLICY "agent_own_packages" ON agent_packages FOR ALL
  USING (auth.uid() = agent_id) WITH CHECK (auth.uid() = agent_id);

-- agent_packages: anyone can read packages the admin published to travellers
DROP POLICY IF EXISTS "public_read_traveller_packages" ON agent_packages;
CREATE POLICY "public_read_traveller_packages" ON agent_packages FOR SELECT
  USING (verification_status = 'verified' AND visible_to_travellers = true);

-- Creator browse (verified) and admin verify/reject run through service-role
-- API routes, which bypass RLS.
