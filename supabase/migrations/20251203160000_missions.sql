DO $$
BEGIN
  ALTER TYPE public.shield_source ADD VALUE IF NOT EXISTS 'mission';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Missions table for dynamic POI-based missions
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  mission_type TEXT NOT NULL CHECK (mission_type IN ('park','fountain','district')),
  target_count INTEGER NOT NULL DEFAULT 1,
  reward_points INTEGER NOT NULL DEFAULT 0,
  reward_shields INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mission_id, user_id)
);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Misiones visibles" ON public.missions;
CREATE POLICY "Misiones visibles" ON public.missions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Ver progreso de misiones" ON public.mission_progress;
CREATE POLICY "Ver progreso de misiones"
ON public.mission_progress FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Actualizar progreso de misiones" ON public.mission_progress;
CREATE POLICY "Actualizar progreso de misiones"
ON public.mission_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Modificar progreso de misiones"
ON public.mission_progress FOR UPDATE
USING (auth.uid() = user_id);

INSERT INTO public.missions (title, description, mission_type, target_count, reward_points, reward_shields, start_date, end_date)
VALUES
  ('Conquista parques urbanos', 'Captura 3 territorios etiquetados como parque durante la semana.', 'park', 3, 150, 0, now(), now() + interval '7 days'),
  ('Ruta de hidratación', 'Visita 5 fuentes diferentes mientras corres por la ciudad.', 'fountain', 5, 0, 1, now(), now() + interval '7 days'),
  ('Dominio de barrios', 'Completa 2 barrios completos para demostrar tu control.', 'district', 2, 200, 0, now(), now() + interval '7 days')
ON CONFLICT DO NOTHING;
