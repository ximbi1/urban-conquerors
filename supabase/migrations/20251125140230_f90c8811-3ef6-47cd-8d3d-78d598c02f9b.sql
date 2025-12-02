-- Crear tabla de perfiles de usuario con información adicional
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  color TEXT NOT NULL DEFAULT '#8b5cf6',
  total_points INTEGER NOT NULL DEFAULT 0,
  total_territories INTEGER NOT NULL DEFAULT 0,
  total_distance REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 500)
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles: todos pueden ver perfiles, solo el usuario puede editar el suyo
CREATE POLICY "Los perfiles son visibles por todos"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden insertar su propio perfil"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Crear tabla de territorios
CREATE TABLE public.territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coordinates JSONB NOT NULL,
  area REAL NOT NULL,
  perimeter REAL NOT NULL,
  avg_pace REAL NOT NULL,
  points INTEGER NOT NULL,
  conquered BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS en territories
ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para territories: todos pueden ver, solo el dueño puede modificar
CREATE POLICY "Los territorios son visibles por todos"
  ON public.territories
  FOR SELECT
  USING (true);

CREATE POLICY "Los usuarios pueden crear sus propios territorios"
  ON public.territories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios territorios"
  ON public.territories
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios territorios"
  ON public.territories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Crear tabla de carreras/runs
CREATE TABLE public.runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  path JSONB NOT NULL,
  distance REAL NOT NULL,
  duration INTEGER NOT NULL,
  avg_pace REAL NOT NULL,
  territories_conquered INTEGER NOT NULL DEFAULT 0,
  territories_stolen INTEGER NOT NULL DEFAULT 0,
  territories_lost INTEGER NOT NULL DEFAULT 0,
  points_gained INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS en runs
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para runs: solo el usuario puede ver y crear sus runs
CREATE POLICY "Los usuarios pueden ver sus propias carreras"
  ON public.runs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propias carreras"
  ON public.runs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Función para actualizar el timestamp updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_territories_updated_at
  BEFORE UPDATE ON public.territories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para crear perfil automáticamente cuando un usuario se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  random_color TEXT;
  username_from_email TEXT;
BEGIN
  -- Generar un color aleatorio
  random_color := '#' || lpad(to_hex((random() * 16777215)::int), 6, '0');
  
  -- Extraer nombre de usuario del email (parte antes del @)
  username_from_email := split_part(NEW.email, '@', 1);
  
  -- Asegurar que el username es único añadiendo números si es necesario
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = username_from_email) LOOP
    username_from_email := split_part(NEW.email, '@', 1) || floor(random() * 10000)::text;
  END LOOP;
  
  -- Insertar perfil con datos del metadata o valores por defecto
  INSERT INTO public.profiles (id, username, avatar_url, bio, color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', username_from_email),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'bio',
    random_color
  );
  
  RETURN NEW;
END;
$$;

-- Trigger para crear perfil automáticamente al registrarse
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Crear bucket de storage para avatares
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Políticas RLS para el bucket de avatares
CREATE POLICY "Los avatares son visibles públicamente"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Los usuarios pueden subir sus propios avatares"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Los usuarios pueden actualizar sus propios avatares"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Los usuarios pueden eliminar sus propios avatares"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );