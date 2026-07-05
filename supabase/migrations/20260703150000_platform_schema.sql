-- Criação da tabela tracks
CREATE TABLE public.tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pack_id UUID REFERENCES public.packs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    download_url TEXT, -- Link do Google Drive
    price NUMERIC(10, 2) DEFAULT 0.50, -- Preço individual para o álbum customizado
    duration INTEGER, -- Em segundos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criação da tabela track_likes
CREATE TABLE public.track_likes (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, track_id)
);

-- Criação da tabela track_comments
CREATE TABLE public.track_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criação da tabela custom_albums
CREATE TABLE public.custom_albums (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criação da tabela custom_album_tracks
CREATE TABLE public.custom_album_tracks (
    custom_album_id UUID REFERENCES public.custom_albums(id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (custom_album_id, track_id)
);

-- Criação da tabela user_purchases
CREATE TABLE public.user_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('pack', 'custom_album')),
    item_id UUID NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    stripe_session_id TEXT
);

-- RLS Policies
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_album_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Políticas Básicas (Permitir leitura pública onde aplicável, escrita para usuários logados)

-- Tracks: visíveis por todos
CREATE POLICY "Tracks are viewable by everyone." ON public.tracks FOR SELECT USING (true);

-- Track Likes: visíveis por todos, inseridos pelo dono
CREATE POLICY "Track likes are viewable by everyone." ON public.track_likes FOR SELECT USING (true);
CREATE POLICY "Users can like tracks." ON public.track_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike tracks." ON public.track_likes FOR DELETE USING (auth.uid() = user_id);

-- Track Comments: visíveis por todos, inseridos pelo dono
CREATE POLICY "Comments are viewable by everyone." ON public.track_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert comments." ON public.track_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments." ON public.track_comments FOR DELETE USING (auth.uid() = user_id);

-- Custom Albums: lidos e escritos apenas pelo dono (privados como você solicitou)
CREATE POLICY "Users can manage own custom albums." ON public.custom_albums FOR ALL USING (auth.uid() = user_id);

-- Custom Album Tracks: lidos e escritos pelo dono do álbum (herdado pela lógica de app, mas garantindo aqui na RLS com subquery)
CREATE POLICY "Users can manage tracks in own custom albums." ON public.custom_album_tracks 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.custom_albums WHERE id = custom_album_tracks.custom_album_id AND user_id = auth.uid()
  )
);

-- User Purchases: Lidos apenas pelo dono, Inseridos via webhook/admin
CREATE POLICY "Users can view own purchases." ON public.user_purchases FOR SELECT USING (auth.uid() = user_id);
-- Insert via API (service role bypasses RLS).

