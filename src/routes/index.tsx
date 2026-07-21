import { useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, queryOptions } from "@tanstack/react-query";
import { fetchPacks } from "@/lib/packs";
import { fetchTracks } from "@/lib/tracks";
import { useAudioPlayer, type PlayerTrack } from "@/lib/audio-player";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import React, { Suspense } from "react";
import { SpotifyTrackTable } from "@/components/SpotifyTrackTable";

const SpotifySidebar = React.lazy(() => import("@/components/SpotifySidebar").then(m => ({ default: m.SpotifySidebar })));
const SpotifyHero = React.lazy(() => import("@/components/SpotifyHero").then(m => ({ default: m.SpotifyHero })));
const SpotifyRightSidebar = React.lazy(() => import("@/components/SpotifyRightSidebar").then(m => ({ default: m.SpotifyRightSidebar })));

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

  useGSAP(() => {
    if (!containerRef.current) return;
    
    // Adicionando delay inicial para garantir renderização e "will-change" para aceleração de GPU
    const tl = gsap.timeline({ delay: 0.1 });
    
    // Animate sidebars sliding in
    tl.fromTo(".gsap-sidebar-left", 
      { x: -50, opacity: 0 }, 
      { x: 0, opacity: 1, duration: 0.5, ease: "power3.out", clearProps: "transform" }
    )
    .fromTo(".gsap-sidebar-right",
      { x: 50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, ease: "power3.out", clearProps: "transform" },
      "<" 
    )
    // Animate hero scaling/fading in
    .fromTo(".gsap-hero",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", clearProps: "transform" },
      "-=0.3"
    )
    // Animate track list fading up
    .fromTo(".gsap-tracks",
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", clearProps: "transform" },
      "-=0.4"
    );
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="h-[calc(100vh-56px)] w-full flex bg-transparent overflow-hidden p-2 gap-2 text-white font-sans selection:bg-spotify-green/30">
      
      {/* Barra Lateral Esquerda */}
      <div className="gsap-sidebar-left flex shrink-0 will-change-transform">
        <Suspense fallback={<div className="w-[280px] bg-black" />}>
          <SpotifySidebar />
        </Suspense>
      </div>

      {/* Área Central Principal */}
      <main className="flex-1 bg-spotify-base rounded-lg overflow-y-auto custom-scrollbar relative flex flex-col">
        <div className="gsap-hero will-change-transform">
          {spotlightPack && (
            <Suspense fallback={<div className="h-[250px] bg-white/5 animate-pulse" />}>
              <SpotifyHero 
                title={spotlightPack.nome || "FUNK COM ELETRÔNICA"}
                description={spotlightPack.descricao || "CLIQUE NO (+) PARA RECEBER MÚSICA NOVA TODA SEMANA — funk com música eletrônica, tech house e outras..."}
                imageUrl={spotlightPack.imagem_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&w=400&h=400&fit=crop"}
                creator={spotlightPack.dj || "TopDJ Records"}
                likes={Math.floor(Math.random() * 900 + 100).toString() + "k"}
                songsCount={tracks.length.toString()}
                duration="3h 30min"
                onPlay={handlePlayHero}
              />
            </Suspense>
          )}
        </div>

        <div className="gsap-tracks flex-1 w-full relative z-20 bg-gradient-to-b from-black/20 to-spotify-base will-change-transform">
          <SpotifyTrackTable tracks={tracks} pack={spotlightPack} />
        </div>
      </main>

      {/* Barra Lateral Direita */}
      <div className="gsap-sidebar-right flex shrink-0 will-change-transform">
        <Suspense fallback={<div className="w-[300px] bg-black" />}>
          <SpotifyRightSidebar pack={spotlightPack} />
        </Suspense>
      </div>

    </div>
  );
}
