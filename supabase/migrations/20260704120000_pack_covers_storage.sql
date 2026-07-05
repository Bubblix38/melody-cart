-- Bucket de Storage para capas de packs (álbuns)
-- Leitura pública (qualquer visitante vê a capa), escrita restrita a admins.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'capas-packs',
  'capas-packs',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública das capas
CREATE POLICY "Capas de packs são públicas para leitura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'capas-packs');

-- Apenas admins podem enviar capas
CREATE POLICY "Admins podem enviar capas de packs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'capas-packs'
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Apenas admins podem atualizar capas
CREATE POLICY "Admins podem atualizar capas de packs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'capas-packs'
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Apenas admins podem excluir capas
CREATE POLICY "Admins podem excluir capas de packs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'capas-packs'
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
