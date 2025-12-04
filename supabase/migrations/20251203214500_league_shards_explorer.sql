ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS league_shard TEXT DEFAULT 'bronze-1',
  ADD COLUMN IF NOT EXISTS explorer_mode BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS social_league BOOLEAN DEFAULT false;

ALTER TABLE public.territories
  ADD COLUMN IF NOT EXISTS league_shard TEXT;

ALTER TABLE public.runs
  ADD COLUMN IF NOT EXISTS league_shard TEXT;

CREATE TABLE IF NOT EXISTS public.explorer_territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  path JSONB NOT NULL,
  distance NUMERIC NOT NULL DEFAULT 0,
  duration NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB
);

ALTER TABLE public.explorer_territories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ver exploraciones" ON public.explorer_territories;
CREATE POLICY "Ver exploraciones" ON public.explorer_territories
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Crear exploraciones" ON public.explorer_territories;
CREATE POLICY "Crear exploraciones" ON public.explorer_territories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

UPDATE public.territories SET league_shard = (SELECT league_shard FROM public.profiles WHERE id = public.territories.user_id) WHERE league_shard IS NULL;
UPDATE public.runs SET league_shard = (SELECT league_shard FROM public.profiles WHERE id = public.runs.user_id) WHERE league_shard IS NULL;
