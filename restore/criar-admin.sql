-- ============================================================
-- TopDJ — Script de Configuração de Admin
-- Execute no SQL Editor do Supabase APÓS a migration principal
-- ============================================================

-- 1. DESCOBRIR SEU USER_ID (rode primeiro)
--    Vá em Authentication > Users no painel do Supabase
--    Copie o UUID do seu usuário
--    OU execute:
SELECT id, email FROM auth.users;

-- 2. CRIAR SEU PERFIL (substitua SEU_UUID)
INSERT INTO public.user_roles (user_id, role)
VALUES ('SEU_UUID-AQUI', 'admin');

-- 3. VERIFICAR SE FOI CRIADO
SELECT * FROM public.user_roles WHERE role = 'admin';
