-- ============================================================
-- 1. Curtidas por faixa (track_likes já existia, mas sem GRANT
--    explícito — mesmo bug já corrigido antes na tabela "tracks").
-- ============================================================
GRANT SELECT, INSERT, DELETE ON public.track_likes TO authenticated;
GRANT SELECT ON public.track_likes TO anon;

-- ============================================================
-- 2. Repost por faixa: cria um "atalho" da faixa no perfil de
--    quem repostou (visível para qualquer visitante do perfil).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.track_reposts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, track_id)
);

ALTER TABLE public.track_reposts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.track_reposts TO authenticated;
GRANT SELECT ON public.track_reposts TO anon;

CREATE POLICY "Reposts são visíveis por todos" ON public.track_reposts
  FOR SELECT USING (true);

CREATE POLICY "Usuário pode repostar" ON public.track_reposts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário pode remover próprio repost" ON public.track_reposts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 3. Tabelas de pedido/itens de pedido.
--    Gap real encontrado: o código de checkout (lib/stripe.ts) já
--    lê/escreve nessas tabelas, mas elas nunca existiram em nenhuma
--    migration — o que provavelmente quebra o checkout em produção.
--    Criadas aqui como base para permitir compra de faixa individual
--    ou álbum completo. Escrita restrita ao service_role (usado
--    pelo servidor no processamento do pagamento).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_cliente TEXT NOT NULL,
  nome_cliente TEXT NOT NULL,
  valor_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  stripe_payment_intent_id TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.itens_pedido (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES public.packs(id) ON DELETE SET NULL,
  track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (pack_id IS NOT NULL OR track_id IS NOT NULL)
);

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;

-- Usuário logado pode ver seu próprio histórico de pedidos e downloads liberados.
CREATE POLICY "Usuário vê os próprios pedidos" ON public.pedidos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuário vê os próprios itens de pedido" ON public.itens_pedido
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.pedidos WHERE id = itens_pedido.pedido_id AND user_id = auth.uid())
  );

GRANT SELECT ON public.pedidos TO authenticated;
GRANT SELECT ON public.itens_pedido TO authenticated;
GRANT ALL ON public.pedidos TO service_role;
GRANT ALL ON public.itens_pedido TO service_role;

CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido_id ON public.itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_user_id ON public.pedidos(user_id);
