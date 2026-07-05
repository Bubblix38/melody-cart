-- ============================================================
-- Contagem real de audições, para o ranking "Mais Ouvidas".
-- Regra: 1 play por IP único por faixa (mesma pessoa pode ouvir de
-- novo, mas só conta uma vez por IP — via UNIQUE(track_id, ip_hash)).
-- O IP nunca é guardado em texto puro, apenas seu hash SHA-256.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.track_plays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (track_id, ip_hash)
);

ALTER TABLE public.track_plays ENABLE ROW LEVEL SECURITY;

-- Tabela bruta fica travada: só o backend (service_role) escreve nela.
-- Ninguém (nem usuário logado) tem policy de leitura/escrita direta —
-- os dados agregados são expostos só através das views abaixo.
GRANT ALL ON public.track_plays TO service_role;

CREATE INDEX IF NOT EXISTS idx_track_plays_track_id ON public.track_plays(track_id);

-- View agregada por faixa (não expõe ip_hash, só a contagem).
CREATE OR REPLACE VIEW public.track_play_counts AS
SELECT track_id, count(*)::int AS play_count
FROM public.track_plays
GROUP BY track_id;

-- View agregada por álbum (soma as audições de todas as faixas do pack).
CREATE OR REPLACE VIEW public.pack_play_counts AS
SELECT t.pack_id, count(tp.*)::int AS play_count
FROM public.track_plays tp
JOIN public.tracks t ON t.id = tp.track_id
GROUP BY t.pack_id;

-- As views são criadas pelo papel de migração (com BYPASSRLS), então
-- consultas a elas não passam pela RLS da tabela bruta — só expõem os
-- números agregados, nunca o ip_hash individual.
GRANT SELECT ON public.track_play_counts TO anon, authenticated;
GRANT SELECT ON public.pack_play_counts TO anon, authenticated;
