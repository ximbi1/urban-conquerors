-- Extend territories table with protection/cooldown metadata and scoring fields
DO $$ BEGIN
  CREATE TYPE public.territory_status AS ENUM ('idle', 'protected', 'contested');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.territory_event_type AS ENUM ('conquest', 'steal', 'reinforce', 'defense');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.territory_event_result AS ENUM ('success', 'failed', 'neutral');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.territories
  ADD COLUMN IF NOT EXISTS protected_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cooldown_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_attacker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_defender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_attack_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS status territory_status NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS required_pace REAL,
  ADD COLUMN IF NOT EXISTS conquest_points INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS territories_status_idx ON public.territories(status);
CREATE INDEX IF NOT EXISTS territories_protected_until_idx ON public.territories(protected_until);

-- Track battle history
CREATE TABLE IF NOT EXISTS public.territory_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_id UUID NOT NULL REFERENCES public.territories(id) ON DELETE CASCADE,
  attacker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  defender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type territory_event_type NOT NULL,
  result territory_event_result NOT NULL DEFAULT 'neutral',
  overlap_ratio REAL,
  pace REAL,
  area REAL,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.territory_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Los eventos de territorio son visibles por todos" ON public.territory_events;
CREATE POLICY "Los eventos de territorio son visibles por todos"
ON public.territory_events FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Solo roles de servicio pueden registrar eventos" ON public.territory_events;
CREATE POLICY "Solo roles de servicio pueden registrar eventos"
ON public.territory_events FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS territory_events_territory_idx ON public.territory_events(territory_id);
CREATE INDEX IF NOT EXISTS territory_events_attacker_idx ON public.territory_events(attacker_id);
CREATE INDEX IF NOT EXISTS territory_events_created_idx ON public.territory_events(created_at DESC);
