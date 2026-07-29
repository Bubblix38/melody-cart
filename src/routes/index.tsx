import { useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, queryOptions } from "@tanstack/react-query";
import { fetchPacks } from "@/lib/packs";
import { fetchTracks } from "@/lib/tracks";
import { SoundCloudHero } from "@/components/SoundCloudHero";
import { PopularRanking } from "@/components/PopularRanking";
import { TrackList } from "@/components/TrackList";
import { SoundCloudSidebar } from "@/components/SoundCloudSidebar";

const packsQuery = queryOptions({
  queryKey: ["packs"],
  queryFn: fetchPacks,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TopDJ — Descubra e Compre os Melhores Álbuns" },
      { name: "description", content: "Loja de packs de música TopDJ: encontre lançamentos e sucessos em DJ Packs." },
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

  return (
    <div ref={containerRef} className="w-full text-white font-sans">
      
      {/* Hero Banner TopDJ Original */}
      <SoundCloudHero />

      {/* Main Content Grid for Desktop */}
      <div className="max-w-[1440px] mx-auto px-6 py-8 flex gap-8">
        
        {/* Left / Center Area: Popular Ranking & Track Catalog */}
        <div className="flex-1 min-w-0 flex flex-col gap-10">
          
          {/* Packs Mais Tocados / Ranking */}
          <PopularRanking showHeader={true} />

          {/* Catálogo de Músicas */}
          <div className="mt-4">
            <h2 className="text-2xl font-extrabold mb-4 flex items-center gap-2">
              <span className="text-primary">✦</span> Catálogo do Álbum
            </h2>
            <TrackList tracks={tracks} pack={spotlightPack} />
          </div>

        </div>

        {/* Right Sidebar for Desktop */}
        <div className="hidden xl:block w-80 shrink-0">
          <SoundCloudSidebar pack={spotlightPack} />
        </div>

      </div>

    </div>
  );
}
