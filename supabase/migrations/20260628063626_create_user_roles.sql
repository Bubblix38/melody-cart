-- Tabela de roles/permissoes de usuario
-- CRITICO: Apenas admins podem modificar esta tabela

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Garantir que cada usuario tenha apenas uma role
  UNIQUE(user_id)
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- POLITICAS DE SEGURANCA (CRITICO!)

-- 1. Usuarios podem ver apenas sua propria role
CREATE POLICY "Usuarios veem propria role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Apenas admins podem inserir roles
CREATE POLICY "Apenas admins podem criar roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    -- Verificar se o usuario que esta criando eh admin
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- 3. Apenas admins podem atualizar roles
CREATE POLICY "Apenas admins podem atualizar roles"
  ON public.user_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- 4. Apenas admins podem deletar roles
CREATE POLICY "Apenas admins podem deletar roles"
  ON public.user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_roles_updated_at();

-- Funcao segura para verificar se usuario eh admin
-- Esta funcao pode ser chamada do frontend sem risco de escalacao
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Funcao para criar primeiro admin (APENAS para setup inicial)
-- ATENCAO: Esta funcao deve ser removida apos criar o primeiro admin
CREATE OR REPLACE FUNCTION public.create_first_admin(admin_email TEXT)
RETURNS VOID AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Verificar se ja existe algum admin
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'Ja existe um admin. Use a interface administrativa.';
  END IF;

  -- Buscar user_id pelo email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario nao encontrado: %', admin_email;
  END IF;

  -- Criar role de admin
  INSERT INTO public.user_roles (user_id, role, created_by)
  VALUES (admin_user_id, 'admin', admin_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Conceder permissoes
GRANT SELECT ON public.user_roles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Conceder permissoes nas funcoes
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_first_admin(TEXT) TO service_role;

-- IMPORTANTE: Revogar permissoes de modificacao de usuarios comuns
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;

-- Log de seguranca
INSERT INTO public.user_roles (user_id, role, created_by)
SELECT id, 'admin', id
FROM auth.users
WHERE email = 'admin@topdj.com.br'  -- SUBSTITUIR PELO EMAIL DO ADMIN
ON CONFLICT (user_id) DO NOTHING;