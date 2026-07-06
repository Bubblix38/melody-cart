-- 1. Fix overly-permissive (always true) write policies on packs (SUPA_rls_policy_always_true)
DROP POLICY IF EXISTS "Qualquer um pode criar packs" ON public.packs;
DROP POLICY IF EXISTS "Qualquer um pode editar packs" ON public.packs;
DROP POLICY IF EXISTS "Qualquer um pode excluir packs" ON public.packs;

CREATE POLICY "Apenas admins podem criar packs"
  ON public.packs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem editar packs"
  ON public.packs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem excluir packs"
  ON public.packs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Add scoped (admin-only) policies for pedidos (pedidos_no_select_policy)
CREATE POLICY "Admins podem ver pedidos"
  ON public.pedidos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar pedidos"
  ON public.pedidos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem excluir pedidos"
  ON public.pedidos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Add scoped (admin-only) policies for itens_pedido (itens_pedido_no_select_policy)
CREATE POLICY "Admins podem ver itens de pedido"
  ON public.itens_pedido FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem excluir itens de pedido"
  ON public.itens_pedido FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Restrict direct execution of SECURITY DEFINER functions from API roles
--    (SUPA_authenticated_security_definer_function_executable)
--    has_role stays usable inside RLS policies (evaluated by the DB), but is not
--    directly callable via the API by anon/authenticated.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;