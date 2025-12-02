-- Crear enum para tipos de logros
CREATE TYPE public.achievement_type AS ENUM ('distance', 'territories', 'streak');

-- Tabla de logros disponibles
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  type achievement_type NOT NULL,
  icon text NOT NULL,
  requirement integer NOT NULL,
  points integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabla de logros desbloqueados por usuarios
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Habilitar RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Políticas para achievements (todos pueden ver)
CREATE POLICY "Los logros son visibles por todos"
ON public.achievements
FOR SELECT
USING (true);

-- Políticas para user_achievements
CREATE POLICY "Los usuarios pueden ver sus propios logros"
ON public.user_achievements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden desbloquear sus propios logros"
ON public.user_achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insertar logros predefinidos
INSERT INTO public.achievements (name, description, type, icon, requirement, points) VALUES
-- Distancia
('Primer Paso', 'Corre tu primer kilómetro', 'distance', '🏃', 1000, 10),
('Maratonista Novato', 'Acumula 10 km de distancia', 'distance', '🎽', 10000, 50),
('Corredor Dedicado', 'Acumula 50 km de distancia', 'distance', '💪', 50000, 100),
('Ultramaratonista', 'Acumula 100 km de distancia', 'distance', '🏆', 100000, 200),
('Leyenda del Asfalto', 'Acumula 500 km de distancia', 'distance', '👑', 500000, 500),

-- Territorios
('Conquistador Inicial', 'Conquista tu primer territorio', 'territories', '🚩', 1, 10),
('Explorador Urbano', 'Conquista 5 territorios', 'territories', '🗺️', 5, 50),
('Dominador de Barrio', 'Conquista 10 territorios', 'territories', '🏘️', 10, 100),
('Señor de la Ciudad', 'Conquista 25 territorios', 'territories', '🏙️', 25, 200),
('Imperio Urbano', 'Conquista 50 territorios', 'territories', '🌆', 50, 500),

-- Rachas
('Constante', 'Corre 3 días seguidos', 'streak', '🔥', 3, 25),
('Dedicado', 'Corre 7 días seguidos', 'streak', '⚡', 7, 75),
('Imparable', 'Corre 14 días seguidos', 'streak', '💫', 14, 150),
('Legendario', 'Corre 30 días seguidos', 'streak', '✨', 30, 300),
('Titán', 'Corre 60 días seguidos', 'streak', '🌟', 60, 600);

-- Función para calcular la racha actual de un usuario
CREATE OR REPLACE FUNCTION public.calculate_user_streak(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak integer := 0;
  v_current_date date;
  v_check_date date;
  v_has_run boolean;
BEGIN
  v_current_date := CURRENT_DATE;
  v_check_date := v_current_date;
  
  -- Verificar si corrió hoy o ayer para empezar la racha
  SELECT EXISTS(
    SELECT 1 FROM runs 
    WHERE user_id = p_user_id 
    AND DATE(created_at) IN (v_current_date, v_current_date - 1)
  ) INTO v_has_run;
  
  IF NOT v_has_run THEN
    RETURN 0;
  END IF;
  
  -- Si no corrió hoy, empezar desde ayer
  SELECT EXISTS(
    SELECT 1 FROM runs 
    WHERE user_id = p_user_id 
    AND DATE(created_at) = v_current_date
  ) INTO v_has_run;
  
  IF NOT v_has_run THEN
    v_check_date := v_current_date - 1;
  END IF;
  
  -- Contar días consecutivos hacia atrás
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM runs 
      WHERE user_id = p_user_id 
      AND DATE(created_at) = v_check_date
    ) INTO v_has_run;
    
    IF v_has_run THEN
      v_streak := v_streak + 1;
      v_check_date := v_check_date - 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_streak;
END;
$$;

-- Agregar columna current_streak a profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0;

-- Índices para mejorar rendimiento
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX idx_achievements_type ON public.achievements(type);
CREATE INDEX idx_runs_user_date ON public.runs(user_id, created_at);