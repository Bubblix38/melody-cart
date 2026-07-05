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

-- Tabela de roles de usuário para controle de admin
CREATE TABLE public.user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.packs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packs TO authenticated;
GRANT ALL ON public.packs TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Packs: qualquer um pode VER
CREATE POLICY "Público pode ver packs" ON public.packs FOR SELECT USING (true);

-- Packs: apenas admins podem criar/editar/excluir
CREATE POLICY "Admins podem criar packs" ON public.packs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins podem editar packs" ON public.packs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins podem excluir packs" ON public.packs FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- user_roles: qualquer autenticado pode VER (útil pra checagem),
-- mas apenas service_role pode modificar
CREATE POLICY "Autenticados podem ver roles" ON public.user_roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Apenas service_role pode modificar roles" ON public.user_roles FOR ALL USING (false);

-- Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS public.perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  apelido TEXT,
  nome_completo TEXT,
  cidade TEXT,
  estado TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.perfis TO authenticated;
GRANT ALL ON public.perfis TO service_role;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário pode ver próprio perfil" ON public.perfis FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuário pode criar próprio perfil" ON public.perfis FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Usuário pode editar próprio perfil" ON public.perfis FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Tabela de comentários
CREATE TABLE IF NOT EXISTS public.comentarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  texto TEXT NOT NULL,
  autor TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.comentarios TO anon;
GRANT SELECT, INSERT ON public.comentarios TO authenticated;
GRANT ALL ON public.comentarios TO service_role;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver comentários" ON public.comentarios FOR SELECT USING (true);
CREATE POLICY "Autenticados podem criar comentários" ON public.comentarios FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Tabela de curtidas
CREATE TABLE IF NOT EXISTS public.curtidas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.curtidas TO anon;
GRANT SELECT, INSERT ON public.curtidas TO authenticated;
GRANT ALL ON public.curtidas TO service_role;
ALTER TABLE public.curtidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver curtidas" ON public.curtidas FOR SELECT USING (true);
CREATE POLICY "Autenticados podem curtir" ON public.curtidas FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Tabela de músicas salvas (favoritos)
CREATE TABLE IF NOT EXISTS public.musicas_salvas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, pack_id)
);

GRANT SELECT, INSERT, DELETE ON public.musicas_salvas TO authenticated;
GRANT ALL ON public.musicas_salvas TO service_role;
ALTER TABLE public.musicas_salvas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário pode ver suas músicas salvas" ON public.musicas_salvas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuário pode salvar música" ON public.musicas_salvas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário pode remover música salva" ON public.musicas_salvas FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_packs_updated_at BEFORE UPDATE ON public.packs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_perfis_updated_at BEFORE UPDATE ON public.perfis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();