-- Agregar columnas de temporadas y ligas a profiles
ALTER TABLE profiles 
ADD COLUMN season_points INTEGER DEFAULT 0,
ADD COLUMN historical_points INTEGER DEFAULT 0,
ADD COLUMN current_league TEXT DEFAULT 'bronze',
ADD COLUMN previous_league TEXT;

-- Migrar puntos actuales a historical_points
UPDATE profiles SET historical_points = total_points;

-- Crear tabla de temporadas
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de resultados de temporada
CREATE TABLE season_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  final_points INTEGER NOT NULL DEFAULT 0,
  final_league TEXT NOT NULL,
  final_rank INTEGER NOT NULL,
  territories_conquered INTEGER DEFAULT 0,
  total_distance REAL DEFAULT 0,
  rewards_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, season_id)
);

-- Habilitar RLS
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_results ENABLE ROW LEVEL SECURITY;

-- Políticas para seasons (visibles para todos)
CREATE POLICY "Las temporadas son visibles por todos"
ON seasons FOR SELECT
USING (true);

-- Políticas para season_results
CREATE POLICY "Los resultados son visibles por todos"
ON season_results FOR SELECT
USING (true);

CREATE POLICY "Los usuarios pueden ver sus propios resultados"
ON season_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Crear primera temporada activa (20 días desde hoy)
INSERT INTO seasons (name, start_date, end_date, active)
VALUES (
  'Temporada 1',
  now(),
  now() + interval '20 days',
  true
);