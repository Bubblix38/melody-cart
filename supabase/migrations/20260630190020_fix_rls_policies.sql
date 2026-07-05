-- 1. Corrige a vulnerabilidade de spoofing na criação de comentários
DROP POLICY IF EXISTS "Autenticados podem criar comentários" ON public.comentarios;
CREATE POLICY "Autenticados podem criar comentários" ON public.comentarios 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Corrige a vulnerabilidade de spoofing nas curtidas
DROP POLICY IF EXISTS "Autenticados podem curtir" ON public.curtidas;
CREATE POLICY "Autenticados podem curtir" ON public.curtidas 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Permite que administradores possam ler a lista inteira de roles e gerenciar usuários
DROP POLICY IF EXISTS "Admins podem ver todos os roles" ON public.user_roles;
CREATE POLICY "Admins podem ver todos os roles" ON public.user_roles 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
