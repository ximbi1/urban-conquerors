-- Permitir que los usuarios eliminen sus propias notificaciones
CREATE POLICY "Los usuarios pueden eliminar sus propias notificaciones"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);