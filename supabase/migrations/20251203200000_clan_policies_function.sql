CREATE OR REPLACE FUNCTION public.is_member_of_clan(check_clan UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clan_members AS cm
    WHERE cm.clan_id = check_clan
      AND cm.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_member_of_clan(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_member_of_clan(UUID) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Ver membresía" ON public.clan_members;
CREATE POLICY "Ver membresía" ON public.clan_members
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    public.is_member_of_clan(clan_members.clan_id)
  );
