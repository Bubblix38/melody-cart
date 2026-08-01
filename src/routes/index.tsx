import { useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchPacks, type Pack } from "@/lib/packs";
import { fetchTracks, type Track } from "@/lib/tracks";
import { useAudioPlayer, type PlayerTrack } from "@/lib/audio-player";
import { SpotifyTrackTable } from "@/components/SpotifyTrackTable";
import { cacheAudio } from "@/lib/offline-storage";
import { toast } from "sonner";

import { SpotifySidebar } from "@/components/SpotifySidebar";
import { SpotifyHero } from "@/components/SpotifyHero";
import { SpotifyRightSidebar } from "@/components/SpotifyRightSidebar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TopDJ — Descubra e Compre os Melhores Álbuns" },
      { name: "description", content: "Loja de packs de música TopDJ: encontre lançamentos e sucessos. Estilo Spotify Desktop oficial." },
    ],
  }),
  component: Index,
  errorComponent: () => {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-white" role="alert">
        <p>Não foi possível carregar as músicas.</p>
      </div>
    );
  },
});

const DEFAULT_SPOTLIGHT_PACK: Pack = {
  id: "p1",
  nome: "BRASILIAN ELECTRONIC 2026",
  descricao: "baile house • brazilian bass • ginga beats • and everything in between",
  dj: "saint hills",
  preco: 4.99,
  imagem_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&w=600&h=600&fit=crop",
  genero: "Brazilian Bass",
  destaque: true,
  created_at: "2026-06-02",
};

function Index() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { data: packs = [DEFAULT_SPOTLIGHT_PACK] } = useQuery({
    queryKey: ["packs"],
    queryFn: fetchPacks,
  });

  const spotlightPack = packs.find((p) => p.destaque) || packs[0] || DEFAULT_SPOTLIGHT_PACK;

  const { data: tracks = [] } = useQuery({
    queryKey: ["tracks", spotlightPack?.id],
    queryFn: () => fetchTracks(spotlightPack?.id),
    enabled: !!spotlightPack?.id,
  });

  const { play } = useAudioPlayer();

  const handlePlayHero = () => {
    const activeTracks: Track[] = tracks.length > 0 ? tracks : [
      { id: "t1", title: "poposão", audio_url: "", pack_id: "p1", bpm: 130, key: "Am", created_at: "2025-05-23" },
      { id: "t2", title: "157 🅴", audio_url: "", pack_id: "p1", bpm: 132, key: "Fm", created_at: "2024-12-15" },
    ];
    
    const queue: PlayerTrack[] = activeTracks.map((t) => ({
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
    <div ref={containerRef} className="w-full flex-1 flex flex-col relative z-10 font-sans selection:bg-[#1fdf64]/30 select-none">
      <div>
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
      </div>

      <div className="flex-1 w-full relative z-20 bg-[#121212] p-4">
        <SpotifyTrackTable tracks={tracks} pack={spotlightPack} />
      </div>
    </div>
  );
}
