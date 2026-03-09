
CREATE TABLE public.visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  corretor TEXT NOT NULL,
  equipe TEXT NOT NULL,
  cliente TEXT NOT NULL,
  data_visita DATE NOT NULL,
  mes TEXT NOT NULL,
  ano TEXT NOT NULL,
  valor_medio NUMERIC NOT NULL DEFAULT 0,
  setores TEXT NOT NULL DEFAULT '',
  cidades TEXT NOT NULL DEFAULT '',
  feedback TEXT NOT NULL DEFAULT '',
  foto_url TEXT DEFAULT '',
  foto_storage_path TEXT DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error')),
  sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own visits"
  ON public.visits FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own visits"
  ON public.visits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can read all visits"
  ON public.visits FOR SELECT TO authenticated
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.visits;
