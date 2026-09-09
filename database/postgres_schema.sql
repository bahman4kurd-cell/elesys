-- PostgreSQL schema for Election Results System
-- Designed for online scale, while matching the current local app data model.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Theme and language choices from the app.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_theme') THEN
    CREATE TYPE app_theme AS ENUM ('dark', 'light', 'gray', 'government');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_language') THEN
    CREATE TYPE app_language AS ENUM ('ckb', 'kmr', 'ar', 'en');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'election_category') THEN
    CREATE TYPE election_category AS ENUM ('kurdistan', 'iraq', 'provincial', 'custom');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chart_type') THEN
    CREATE TYPE chart_type AS ENUM ('pie', 'donut', 'bar', 'line', 'area');
  END IF;
END $$;

-- Optional multi-tenant root for future online hosting.
CREATE TABLE IF NOT EXISTS app_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_settings (
  instance_id UUID PRIMARY KEY REFERENCES app_instances(id) ON DELETE CASCADE,
  use_kurdish_numerals BOOLEAN NOT NULL DEFAULT FALSE,
  auto_save_interval_ms INTEGER NOT NULL DEFAULT 30000 CHECK (auto_save_interval_ms >= 0),
  app_name TEXT NOT NULL,
  theme app_theme NOT NULL DEFAULT 'government',
  language app_language NOT NULL DEFAULT 'ckb',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Accounts for online login (replace single local credential style).
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES app_instances(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (instance_id, username)
);

CREATE TABLE IF NOT EXISTS election_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES app_instances(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category election_category NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 3000),
  date_str TEXT,
  notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (instance_id, external_id)
);

CREATE TABLE IF NOT EXISTS election_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES election_rounds(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (round_id, external_id)
);

CREATE TABLE IF NOT EXISTS election_subtabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES election_branches(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  total_cast_votes INTEGER NOT NULL DEFAULT 0 CHECK (total_cast_votes >= 0),
  burned_votes INTEGER NOT NULL DEFAULT 0 CHECK (burned_votes >= 0),
  valid_votes INTEGER NOT NULL DEFAULT 0 CHECK (valid_votes >= 0),
  auto_calc_valid_votes BOOLEAN NOT NULL DEFAULT TRUE,
  selected_chart_type chart_type NOT NULL DEFAULT 'bar',
  notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (branch_id, external_id)
);

CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES app_instances(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color VARCHAR(16) NOT NULL,
  text_color VARCHAR(16),
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (instance_id, external_id)
);

CREATE TABLE IF NOT EXISTS subtab_party_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtab_id UUID NOT NULL REFERENCES election_subtabs(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
  votes INTEGER NOT NULL DEFAULT 0 CHECK (votes >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subtab_id, party_id)
);

-- UI state table to keep dashboard and active selections in sync per instance/user.
CREATE TABLE IF NOT EXISTS ui_state (
  instance_id UUID PRIMARY KEY REFERENCES app_instances(id) ON DELETE CASCADE,
  active_round_external_id TEXT DEFAULT 'dashboard',
  active_branch_external_id TEXT,
  active_subtab_external_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Full frontend state snapshot for online sync (keeps existing UI model intact).
CREATE TABLE IF NOT EXISTS app_state_snapshots (
  instance_id UUID PRIMARY KEY REFERENCES app_instances(id) ON DELETE CASCADE,
  db_data JSONB NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- High-value indexes for common filters and dashboard queries.
CREATE INDEX IF NOT EXISTS idx_rounds_instance_order ON election_rounds(instance_id, display_order);
CREATE INDEX IF NOT EXISTS idx_rounds_year ON election_rounds(year);
CREATE INDEX IF NOT EXISTS idx_branches_round_order ON election_branches(round_id, display_order);
CREATE INDEX IF NOT EXISTS idx_subtabs_branch_order ON election_subtabs(branch_id, display_order);
CREATE INDEX IF NOT EXISTS idx_votes_subtab ON subtab_party_votes(subtab_id);
CREATE INDEX IF NOT EXISTS idx_votes_party ON subtab_party_votes(party_id);
CREATE INDEX IF NOT EXISTS idx_parties_instance_custom ON parties(instance_id, is_custom);

-- Updated-at trigger helper.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_app_instances_updated_at ON app_instances;
CREATE TRIGGER trg_app_instances_updated_at
BEFORE UPDATE ON app_instances
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON app_settings;
CREATE TRIGGER trg_app_settings_updated_at
BEFORE UPDATE ON app_settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_app_users_updated_at ON app_users;
CREATE TRIGGER trg_app_users_updated_at
BEFORE UPDATE ON app_users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_election_rounds_updated_at ON election_rounds;
CREATE TRIGGER trg_election_rounds_updated_at
BEFORE UPDATE ON election_rounds
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_election_branches_updated_at ON election_branches;
CREATE TRIGGER trg_election_branches_updated_at
BEFORE UPDATE ON election_branches
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_election_subtabs_updated_at ON election_subtabs;
CREATE TRIGGER trg_election_subtabs_updated_at
BEFORE UPDATE ON election_subtabs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_parties_updated_at ON parties;
CREATE TRIGGER trg_parties_updated_at
BEFORE UPDATE ON parties
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_subtab_party_votes_updated_at ON subtab_party_votes;
CREATE TRIGGER trg_subtab_party_votes_updated_at
BEFORE UPDATE ON subtab_party_votes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_ui_state_updated_at ON ui_state;
CREATE TRIGGER trg_ui_state_updated_at
BEFORE UPDATE ON ui_state
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_app_state_snapshots_updated_at ON app_state_snapshots;
CREATE TRIGGER trg_app_state_snapshots_updated_at
BEFORE UPDATE ON app_state_snapshots
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Fast dashboard aggregate view.
CREATE OR REPLACE VIEW v_dashboard_party_summary AS
SELECT
  r.instance_id,
  r.id AS round_id,
  r.external_id AS round_external_id,
  r.title AS round_title,
  b.id AS branch_id,
  b.external_id AS branch_external_id,
  b.name AS branch_name,
  s.id AS subtab_id,
  s.external_id AS subtab_external_id,
  s.name AS subtab_name,
  p.id AS party_id,
  p.external_id AS party_external_id,
  p.name AS party_name,
  p.color AS party_color,
  v.votes,
  s.valid_votes,
  CASE WHEN s.valid_votes > 0 THEN (v.votes::NUMERIC / s.valid_votes::NUMERIC) * 100 ELSE 0 END AS percentage
FROM subtab_party_votes v
JOIN election_subtabs s ON s.id = v.subtab_id
JOIN election_branches b ON b.id = s.branch_id
JOIN election_rounds r ON r.id = b.round_id
JOIN parties p ON p.id = v.party_id;

COMMIT;
