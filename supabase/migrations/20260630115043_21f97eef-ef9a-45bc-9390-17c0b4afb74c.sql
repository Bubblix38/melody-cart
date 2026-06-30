-- Add download link field to packs (digital product delivery)
ALTER TABLE public.packs ADD COLUMN IF NOT EXISTS arquivo_url text;

-- Orders table
CREATE TABLE public.pedidos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  email text NOT NULL,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente',
  stripe_session_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.pedidos TO service_role;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: orders are only managed server-side via service role.

-- Order items table
CREATE TABLE public.itens_pedido (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  pack_id uuid REFERENCES public.packs(id) ON DELETE SET NULL,
  nome text NOT NULL,
  genero text NOT NULL DEFAULT 'Pop',
  preco numeric NOT NULL DEFAULT 0,
  quantidade integer NOT NULL DEFAULT 1,
  arquivo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.itens_pedido TO service_role;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: order items are only managed server-side via service role.

-- updated_at trigger for pedidos
CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_itens_pedido_pedido_id ON public.itens_pedido(pedido_id);