-- Permitir que las carreras sean visibles por todos los usuarios (para el feed de actividad)
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

-- Política existente (usuarios ven sus propias carreras) ya la gestiona Supabase, añadimos una nueva más permisiva
CREATE POLICY "Las carreras son visibles por todos"
ON public.runs
FOR SELECT
USING (true);