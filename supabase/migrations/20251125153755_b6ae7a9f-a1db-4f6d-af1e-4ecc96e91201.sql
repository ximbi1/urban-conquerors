-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'achievement_unlocked', 'territory_stolen', 'challenge_completed')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID, -- ID del objeto relacionado (friend request, achievement, territory, etc)
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Los usuarios pueden ver sus propias notificaciones"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias notificaciones"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar notificaciones"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Índice para mejorar performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;