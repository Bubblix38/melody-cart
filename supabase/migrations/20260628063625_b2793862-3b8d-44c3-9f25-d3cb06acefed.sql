CREATE TABLE public.packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  genero TEXT NOT NULL DEFAULT 'Pop',
  preco NUMERIC(10,2) NOT NULL DEFAULT 0,
  descricao TEXT,
  imagem_url TEXT,
  destaque BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.packs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packs TO authenticated;
GRANT ALL ON public.packs TO service_role;

ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode ver os packs" ON public.packs FOR SELECT USING (true);
CREATE POLICY "Qualquer um pode criar packs" ON public.packs FOR INSERT WITH CHECK (true);
CREATE POLICY "Qualquer um pode editar packs" ON public.packs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Qualquer um pode excluir packs" ON public.packs FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_packs_updated_at BEFORE UPDATE ON public.packs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();