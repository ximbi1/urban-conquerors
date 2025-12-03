DROP POLICY IF EXISTS "Ver membresía" ON public.clan_members;
CREATE POLICY "Ver membresía" ON public.clan_members
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    clan_id IN (
      SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Salir del clan" ON public.clan_members;
CREATE POLICY "Salir del clan" ON public.clan_members
  FOR DELETE
  USING (auth.uid() = user_id);
