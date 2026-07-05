-- Corrige bug: a tabela "tracks" só tinha política de leitura (SELECT).
-- Não existia nenhuma política que permitisse INSERT/UPDATE/DELETE,
-- então toda tentativa de cadastrar faixas (mesmo por admin) era
-- silenciosamente bloqueada pelo RLS.

-- Garantir que o papel "authenticated" tenha permissão de escrita na tabela
-- (o RLS abaixo restringe quem de fato pode usar isso a admins).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tracks TO authenticated;
GRANT SELECT ON public.tracks TO anon;

-- Apenas admins podem criar faixas
CREATE POLICY "Admins podem criar faixas" ON public.tracks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Apenas admins podem editar faixas
CREATE POLICY "Admins podem editar faixas" ON public.tracks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Apenas admins podem excluir faixas
CREATE POLICY "Admins podem excluir faixas" ON public.tracks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
