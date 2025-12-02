-- Habilitar réplica completa para la tabla territories (necesario para realtime)
ALTER TABLE public.territories REPLICA IDENTITY FULL;

-- Añadir la tabla territories a la publicación de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.territories;