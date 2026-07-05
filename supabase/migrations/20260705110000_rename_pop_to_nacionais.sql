-- Renomeia o gênero "Pop" para "Nacionais" em todo o catálogo.

-- Atualiza os packs já cadastrados com gênero "Pop"
UPDATE public.packs SET genero = 'Nacionais' WHERE genero = 'Pop';

-- Atualiza o valor padrão da coluna para novos packs
ALTER TABLE public.packs ALTER COLUMN genero SET DEFAULT 'Nacionais';
