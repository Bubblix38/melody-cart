import { useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, queryOptions } from "@tanstack/react-query";
import { fetchPacks } from "@/lib/packs";
import { fetchTracks } from "@/lib/tracks";
import { useAudioPlayer, type PlayerTrack } from "@/lib/audio-player";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
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
      { name: "description", content: "Loja de packs de música TopDJ: encontre lançamentos e sucessos. Estilo Spotify." },
    ],
  }),
  loader: ({ context }) => (context as any).queryClient.ensureQueryData(packsQuery),
  component: Index,
  errorComponent: ({ error }) => {
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
      artist: spotlightPack?.dj || "TopDJ Oficial",
      audioUrl: t.audio_url,
      coverUrl: spotlightPack?.imagem_url || "",
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
    // Recarregar a página ou disparar evento para atualizar as setinhas verdes na tabela?
    // O react vai atualizar as setinhas verdes quando o estado isCached re-renderizar
  };

  // Removido GSAP de opacity 0 que travava o carregamento do conteúdo central em alguns navegadores

  return (
    <div ref={containerRef} className="h-[calc(100vh-56px)] w-full flex bg-black md:bg-transparent overflow-x-hidden md:overflow-hidden md:p-2 md:gap-2 text-white font-sans selection:bg-spotify-green/30">
      
      {/* Barra Lateral Esquerda */}
      <div className="hidden lg:flex gsap-sidebar-left shrink-0 will-change-transform">
        <SpotifySidebar />
      </div>

      {/* Área Central Principal */}
      <main className="flex-1 min-w-0 bg-[#121212] md:rounded-lg overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col relative z-10 w-full">
        <div className="gsap-hero will-change-transform">
          {spotlightPack && (
            <SpotifyHero 
              title={spotlightPack.nome || "FUNK COM ELETRÔNICA"}
              description={spotlightPack.descricao || "CLIQUE NO (+) PARA RECEBER MÚSICA NOVA TODA SEMANA — funk com música eletrônica, tech house e outras..."}
              imageUrl={spotlightPack.imagem_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&w=400&h=400&fit=crop"}
              creator={spotlightPack.dj || "TopDJ Records"}
              likes={Math.floor(Math.random() * 900 + 100).toString() + "k"}
              songsCount={tracks.length.toString()}
              duration="3h 30min"
              onPlay={handlePlayHero}
              onDownload={handleDownloadPack}
            />
          )}
        </div>

        <div className="gsap-tracks flex-1 w-full relative z-20 bg-transparent md:bg-gradient-to-b from-black/20 to-spotify-base will-change-transform">
          <SpotifyTrackTable tracks={tracks} pack={spotlightPack} />
        </div>
      </main>

      {/* Barra Lateral Direita */}
      <div className="hidden xl:flex gsap-sidebar-right shrink-0 will-change-transform">
        <SpotifyRightSidebar pack={spotlightPack} />
      </div>

    </div>
  );
}
