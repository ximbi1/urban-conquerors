-- Añadir columna para participantes de Liga Social (territorios colaborativos)
ALTER TABLE public.territories 
ADD COLUMN IF NOT EXISTS social_participants uuid[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_social boolean DEFAULT false;

-- Comentarios descriptivos
COMMENT ON COLUMN public.territories.social_participants IS 'Lista de user_ids que han participado en conquistar este territorio colaborativo de Liga Social';
COMMENT ON COLUMN public.territories.is_social IS 'Indica si este territorio pertenece al modo Liga Social (colaborativo)';