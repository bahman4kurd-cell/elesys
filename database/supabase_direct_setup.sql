-- Run once in Supabase → SQL Editor.
-- Shared state row for the frontend (Supabase-direct mode, no separate API server).

CREATE TABLE IF NOT EXISTS public.app_state (
  instance_slug TEXT PRIMARY KEY,
  db_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

-- Remove the permissive template policy if it was added from the dashboard.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.app_state;

-- Only signed-in staff accounts (created in Authentication → Users) can read/write.
DROP POLICY IF EXISTS "app_state_select_authenticated" ON public.app_state;
CREATE POLICY "app_state_select_authenticated"
  ON public.app_state FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "app_state_insert_authenticated" ON public.app_state;
CREATE POLICY "app_state_insert_authenticated"
  ON public.app_state FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "app_state_update_authenticated" ON public.app_state;
CREATE POLICY "app_state_update_authenticated"
  ON public.app_state FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Anonymous visitors get nothing.
REVOKE ALL ON public.app_state FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.app_state TO authenticated;
