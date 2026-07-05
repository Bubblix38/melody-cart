-- Fix RLS security: drop permissive policy, align schema, fix grants

-- 1. Remove permissive policy that leaked all roles to any authenticated user
DROP POLICY IF EXISTS "Autenticados podem ver roles" ON public.user_roles;

-- 2. Align user_roles schema with intended structure (migration 2 tried to add these
--    but used CREATE TABLE IF NOT EXISTS, so they were silently skipped when the
--    table already existed from migration 1)
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 3. Ensure updated_at trigger exists and is wired up
CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_roles_updated_at();

-- 4. Revoke EXECUTE on is_admin from anon to prevent admin enumeration
REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM anon;
