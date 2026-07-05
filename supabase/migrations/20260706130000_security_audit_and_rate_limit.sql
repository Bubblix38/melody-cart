-- ==============================================================================
-- Migration: Auditoria, Rate Limiting e Configuração de Admin
-- ==============================================================================

-- 1. Promover o email correto para Admin Mestre
-- Remove o antigo (se houver) e insere o correto
INSERT INTO public.user_roles (user_id, role, created_by)
SELECT id, 'admin', id
FROM auth.users
WHERE email = 'fullpacks@proton.me'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- 2. Tabela de Logs de Segurança (Auditoria)
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL, -- Ex: 'honeypot_triggered', 'login_failed', 'admin_access_denied', 'vpn_detected'
    ip_address TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_agent TEXT,
    geolocation JSONB, -- Armazena dados { country, city, is_vpn, isp }
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Políticas de RLS para security_logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Apenas Admins podem VER os logs de segurança
CREATE POLICY "Apenas admins podem ver logs" ON public.security_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );

-- Serviço anônimo/autenticado pode INSERIR logs (para capturar invasores sem login)
CREATE POLICY "Qualquer um pode inserir logs" ON public.security_logs
    FOR INSERT WITH CHECK (true);

-- 3. Tabela de Rate Limits (Anti-Brute Force)
CREATE TABLE IF NOT EXISTS public.rate_limits (
    ip_address TEXT NOT NULL,
    action TEXT NOT NULL,
    request_count INT DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (ip_address, action)
);

-- Função de alta performance para checar rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_ip TEXT, 
    p_action TEXT, 
    p_max_requests INT, 
    p_window_seconds INT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INT;
    v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Seleciona o limite atual com lock para evitar corrida (concurrency)
    SELECT request_count, window_start INTO v_count, v_window_start
    FROM public.rate_limits
    WHERE ip_address = p_ip AND action = p_action
    FOR UPDATE;

    -- Se não existe, cria o primeiro registro
    IF v_count IS NULL THEN
        INSERT INTO public.rate_limits (ip_address, action, request_count, window_start)
        VALUES (p_ip, p_action, 1, now());
        RETURN TRUE; -- Acesso permitido
    END IF;

    -- Se passou o tempo da janela, reseta o contador
    IF now() > (v_window_start + (p_window_seconds || ' seconds')::interval) THEN
        UPDATE public.rate_limits
        SET request_count = 1, window_start = now()
        WHERE ip_address = p_ip AND action = p_action;
        RETURN TRUE; -- Acesso permitido
    END IF;

    -- Se ainda está na janela de tempo, incrementa
    IF v_count < p_max_requests THEN
        UPDATE public.rate_limits
        SET request_count = request_count + 1
        WHERE ip_address = p_ip AND action = p_action;
        RETURN TRUE; -- Acesso permitido
    END IF;

    -- Se estourou o limite, nega acesso
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
