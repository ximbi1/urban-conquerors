DROP POLICY IF EXISTS "Crear clanes" ON public.clans;
CREATE POLICY "Crear clanes" ON public.clans
  FOR INSERT
  WITH CHECK (auth.uid() = founder_id);

CREATE TABLE IF NOT EXISTS public.run_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL DEFAULT 'cheer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, user_id)
);

ALTER TABLE public.run_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver reacciones" ON public.run_reactions;
CREATE POLICY "Ver reacciones" ON public.run_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Agregar reacciones" ON public.run_reactions;
CREATE POLICY "Agregar reacciones" ON public.run_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Eliminar reacciones" ON public.run_reactions;
CREATE POLICY "Eliminar reacciones" ON public.run_reactions
  FOR DELETE USING (auth.uid() = user_id);
