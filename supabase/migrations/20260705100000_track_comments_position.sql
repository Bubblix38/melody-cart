-- Adiciona a posição relativa (0 a 1) em que o comentário foi feito na
-- faixa, para ancorar o comentário num ponto específico da waveform
-- (estilo SoundCloud). Usamos uma razão em vez de segundos absolutos para
-- não depender da duração da faixa estar cadastrada no banco.
ALTER TABLE public.track_comments
  ADD COLUMN IF NOT EXISTS position_ratio NUMERIC(6, 5) NOT NULL DEFAULT 0
    CHECK (position_ratio >= 0 AND position_ratio <= 1);

-- Corrige GRANTs que faltavam nesta tabela (mesmo padrão de bug já visto em
-- outras tabelas: RLS policy existe, mas sem GRANT a tabela fica inacessível).
GRANT SELECT ON public.track_comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.track_comments TO authenticated;
GRANT ALL ON public.track_comments TO service_role;

CREATE INDEX IF NOT EXISTS idx_track_comments_track_id ON public.track_comments(track_id);
