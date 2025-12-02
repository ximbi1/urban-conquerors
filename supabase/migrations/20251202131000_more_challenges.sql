-- Seed additional weekly challenges for upcoming weeks
WITH base_week AS (
  SELECT date_trunc('week', NOW())::date AS week_start
), schedules AS (
  SELECT week_start + ((i + 1) * INTERVAL '7 days') AS start_date
  FROM base_week, generate_series(0, 7) AS s(i)
)
INSERT INTO public.challenges (name, description, type, target_value, start_date, end_date, reward_points, icon)
SELECT name, description, type, target_value, start_date, start_date + INTERVAL '7 days', reward_points, icon
FROM (
  VALUES
    ('Sprint Matutino', 'Completa 15 km antes del fin de semana.', 'distance', 15000, 120, '🌅'),
    ('Defensor de Barrios', 'Evita perder territorios y conquista 5 nuevos.', 'territories', 5, 180, '🛡️'),
    ('Rey del Rush', 'Suma 800 puntos en una semana.', 'points', 800, 250, '⚡'),
    ('Noche de Patrulla', 'Corre 4 veces en diferentes días.', 'distance', 40000, 160, '🌃'),
    ('Ofensiva Total', 'Conquista 12 territorios en 7 días.', 'territories', 12, 220, '🔥'),
    ('Temporada de Experiencia', 'Acumula 1200 puntos durante la semana.', 'points', 1200, 300, '🎯'),
    ('Resistencia Urbana', 'Corre 60 km en 7 días.', 'distance', 60000, 300, '🏅'),
    ('Maestro de Distritos', 'Conquista 20 territorios en una semana.', 'territories', 20, 350, '🏙️')
) AS templates(name, description, type, target_value, reward_points, icon)
JOIN schedules ON true
ON CONFLICT DO NOTHING;
