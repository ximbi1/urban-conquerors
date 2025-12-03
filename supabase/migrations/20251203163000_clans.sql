DO $$
BEGIN
  CREATE TYPE public.clan_role AS ENUM ('leader','officer','member');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.clans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  founder_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emblem_url TEXT,
  banner_color TEXT DEFAULT '#2563eb',
  total_points INTEGER NOT NULL DEFAULT 0,
  territories_controlled INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clan_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role clan_role NOT NULL DEFAULT 'member',
  contribution_points INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.clan_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clan_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  mission_type TEXT NOT NULL CHECK (mission_type IN ('park','fountain','district','territories','points')),
  target_count INTEGER NOT NULL DEFAULT 1,
  current_progress INTEGER NOT NULL DEFAULT 0,
  reward_points INTEGER NOT NULL DEFAULT 0,
  reward_shields INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver clanes" ON public.clans;
CREATE POLICY "Ver clanes" ON public.clans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Administrar propio clan" ON public.clans;
CREATE POLICY "Administrar propio clan" ON public.clans
  FOR UPDATE USING (auth.uid() = founder_id);

DROP POLICY IF EXISTS "Ver membresía" ON public.clan_members;
CREATE POLICY "Ver membresía" ON public.clan_members
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gestionar membresía" ON public.clan_members;
CREATE POLICY "Gestionar membresía" ON public.clan_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Actualizar membresía" ON public.clan_members;
CREATE POLICY "Actualizar membresía" ON public.clan_members
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Ver feed de clan" ON public.clan_feed;
CREATE POLICY "Ver feed de clan" ON public.clan_feed
  FOR SELECT USING (
    clan_id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Escribir feed" ON public.clan_feed;
CREATE POLICY "Escribir feed" ON public.clan_feed
  FOR INSERT WITH CHECK (
    clan_id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Ver misiones de clan" ON public.clan_missions;
CREATE POLICY "Ver misiones de clan" ON public.clan_missions
  FOR SELECT USING (
    clan_id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid())
  );

INSERT INTO public.clans (name, description, founder_id, banner_color)
SELECT 'Ciudadanos Alfa', 'Primer clan de prueba para coordinar conquistas.', id, '#9333ea'
FROM public.profiles
ORDER BY created_at
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.clan_members (clan_id, user_id, role)
SELECT c.id, c.founder_id, 'leader'
FROM public.clans c
ON CONFLICT (user_id) DO NOTHING;
