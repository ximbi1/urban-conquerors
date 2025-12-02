-- Tabla de amistades
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Tabla de desafíos semanales
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('distance', 'territories', 'points')),
  target_value INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reward_points INTEGER NOT NULL DEFAULT 100,
  icon TEXT NOT NULL DEFAULT '🏆',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de participaciones en desafíos
CREATE TABLE IF NOT EXISTS public.challenge_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participations ENABLE ROW LEVEL SECURITY;

-- Políticas para friendships
CREATE POLICY "Los usuarios pueden ver sus propias amistades"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Los usuarios pueden crear solicitudes de amistad"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar solicitudes recibidas"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = friend_id);

CREATE POLICY "Los usuarios pueden eliminar sus propias amistades"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Políticas para challenges
CREATE POLICY "Los desafíos son visibles por todos"
  ON public.challenges FOR SELECT
  USING (true);

-- Políticas para challenge_participations
CREATE POLICY "Los usuarios pueden ver sus propias participaciones"
  ON public.challenge_participations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propias participaciones"
  ON public.challenge_participations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias participaciones"
  ON public.challenge_participations FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at en friendships
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para actualizar updated_at en challenge_participations
CREATE TRIGGER update_challenge_participations_updated_at
  BEFORE UPDATE ON public.challenge_participations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON public.challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_user ON public.challenge_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_challenge ON public.challenge_participations(challenge_id);

-- Insertar algunos desafíos de ejemplo
INSERT INTO public.challenges (name, description, type, target_value, start_date, end_date, reward_points, icon) VALUES
  ('Maratón Semanal', 'Corre 50km durante esta semana', 'distance', 50000, NOW(), NOW() + INTERVAL '7 days', 200, '🏃'),
  ('Conquistador', 'Conquista 10 territorios esta semana', 'territories', 10, NOW(), NOW() + INTERVAL '7 days', 150, '🏰'),
  ('Rey de Puntos', 'Acumula 500 puntos esta semana', 'points', 500, NOW(), NOW() + INTERVAL '7 days', 250, '👑');