import { useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, queryOptions } from "@tanstack/react-query";
import { fetchPacks } from "@/lib/packs";
import { fetchTracks } from "@/lib/tracks";
import { useAudioPlayer, type PlayerTrack } from "@/lib/audio-player";
import { SpotifyTrackTable } from "@/components/SpotifyTrackTable";
import { cacheAudio } from "@/lib/offline-storage";
import { toast } from "sonner";

import { SpotifySidebar } from "@/components/SpotifySidebar";
import { SpotifyHero } from "@/components/SpotifyHero";
import { SpotifyRightSidebar } from "@/components/SpotifyRightSidebar";

const packsQuery = queryOptions({
  queryKey: ["packs"],
  queryFn: fetchPacks,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TopDJ — Descubra e Compre os Melhores Álbuns" },
      { name: "description", content: "Loja de packs de música TopDJ: encontre lançamentos e sucessos. Estilo Spotify Desktop." },
    ],
  }),
  loader: ({ context }) => (context as any).queryClient.ensureQueryData(packsQuery),
  component: Index,
  errorComponent: () => {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-white" role="alert">
        <p>Não foi possível carregar as músicas.</p>
      </div>
    );
  },
});

function Index() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { data: packs } = useSuspenseQuery(packsQuery);
  const spotlightPack = packs.find((p) => p.destaque) || packs[0];

  const { data: tracks = [] } = useQuery({
    queryKey: ["tracks", spotlightPack?.id],
    queryFn: () => fetchTracks(spotlightPack?.id),
    enabled: !!spotlightPack?.id,
  });

  const { play } = useAudioPlayer();

  const handlePlayHero = () => {
    if (tracks.length === 0) return;
    const queue: PlayerTrack[] = tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: spotlightPack?.dj || "saint hills",
      audioUrl: t.audio_url,
      coverUrl: spotlightPack?.imagem_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&w=600&h=600&fit=crop",
    }));
    play(queue[0], queue);
  };

  const handleDownloadPack = async () => {
    if (tracks.length === 0) return;
    toast.loading(`Baixando álbum para modo offline...`, { id: 'download-pack' });
    let count = 0;
    for (const track of tracks) {
      const success = await cacheAudio(track.audio_url);
      if (success) count++;
    }
    toast.success(`Álbum salvo offline! (${count} faixas)`, { id: 'download-pack' });
  };

  return (
    <div ref={containerRef} className="h-[calc(100vh-144px)] mt-16 w-full flex bg-black overflow-hidden p-2 gap-2 text-white font-sans selection:bg-[#1fdf64]/30 select-none">
      
      {/* 1. Left Sidebar: Sua Biblioteca */}
      <div className="hidden lg:flex shrink-0">
        <SpotifySidebar />
      </div>

      {/* 2. Center Panel: Hero Banner & Track Table */}
      <main className="flex-1 min-w-0 bg-[#121212] rounded-lg overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col relative z-10 w-full">
        <div>
          {spotlightPack && (
            <SpotifyHero 
              title={spotlightPack.nome || "BRASILIAN ELECTRONIC 2026"}
              description={spotlightPack.descricao || "baile house • brazilian bass • ginga beats • and everything in between"}
              imageUrl={spotlightPack.imagem_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&w=600&h=600&fit=crop"}
              creator={spotlightPack.dj || "saint hills"}
              likes="6.832"
              songsCount={tracks.length > 0 ? tracks.length.toString() : "174"}
              duration="7h 30min"
              onPlay={handlePlayHero}
              onDownload={handleDownloadPack}
            />
          )}
        </div>

        <div className="flex-1 w-full relative z-20 bg-[#121212]">
          <SpotifyTrackTable tracks={tracks} pack={spotlightPack} />
        </div>
      </main>

      {/* 3. Right Sidebar: Espresso (Remix) & Sobre o Artista */}
      <div className="hidden xl:flex shrink-0">
        <SpotifyRightSidebar pack={spotlightPack} />
      </div>

    </div>
  );
}
