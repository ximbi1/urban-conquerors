-- Ensure territories table tracks the previous defender when a steal ocurre
ALTER TABLE public.territories
  ADD COLUMN IF NOT EXISTS last_defender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
