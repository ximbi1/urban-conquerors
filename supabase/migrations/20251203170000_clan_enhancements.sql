DROP POLICY IF EXISTS "Ver membresía" ON public.clan_members;
CREATE POLICY "Ver membresía" ON public.clan_members
  FOR SELECT
  USING (
    clan_id IN (
      SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Gestionar misiones de clan" ON public.clan_missions;
CREATE POLICY "Gestionar misiones de clan" ON public.clan_missions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.clan_members
      WHERE clan_members.clan_id = clan_missions.clan_id
        AND clan_members.user_id = auth.uid()
        AND clan_members.role IN ('leader','officer')
    )
  );

DROP POLICY IF EXISTS "Actualizar misiones de clan" ON public.clan_missions;
CREATE POLICY "Actualizar misiones de clan" ON public.clan_missions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.clan_members
      WHERE clan_members.clan_id = clan_missions.clan_id
        AND clan_members.user_id = auth.uid()
        AND clan_members.role IN ('leader','officer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.clan_members
      WHERE clan_members.clan_id = clan_missions.clan_id
        AND clan_members.user_id = auth.uid()
        AND clan_members.role IN ('leader','officer')
    )
  );

WITH config AS (
  SELECT * FROM (VALUES
    ('park', 3, 150, 0),
    ('fountain', 5, 0, 1),
    ('district', 2, 200, 0),
    ('territories', 10, 250, 0),
    ('points', 1200, 300, 0)
  ) AS t(mission_type, target_count, reward_points, reward_shields)
)
INSERT INTO public.clan_missions (clan_id, mission_type, target_count, reward_points, reward_shields)
SELECT c.id, config.mission_type, config.target_count, config.reward_points, config.reward_shields
FROM public.clans c
CROSS JOIN config
WHERE NOT EXISTS (
  SELECT 1 FROM public.clan_missions m
  WHERE m.clan_id = c.id AND m.mission_type = config.mission_type
);

INSERT INTO public.clan_feed (clan_id, user_id, event_type, payload)
SELECT c.id, c.founder_id, 'custom_update', jsonb_build_object('message', 'Nuevo objetivo colaborativo disponible')
FROM public.clans c
WHERE NOT EXISTS (
  SELECT 1 FROM public.clan_feed f WHERE f.clan_id = c.id
);
