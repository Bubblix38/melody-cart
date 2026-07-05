import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Radio, Share2 } from "lucide-react";
import { fetchPacks, GENEROS } from "@/lib/packs";
import { SoundCloudHero } from "@/components/SoundCloudHero";
import { TrackRowSoundCloud } from "@/components/TrackRowSoundCloud";
import { SoundCloudSidebar } from "@/components/SoundCloudSidebar";
import { PopularRanking } from "@/components/PopularRanking";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const packsQuery = queryOptions({
  queryKey: ["packs"],
  queryFn: fetchPacks,
});

type HomeSearch = { aba?: string; genero?: string };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => ({
    aba: typeof search.aba === "string" ? search.aba : undefined,
    genero: typeof search.genero === "string" ? search.genero : undefined,
  }),
  head: () => ({
    meta: [
      { title: "TopDJ — Descubra e Compre os Melhores Álbuns" },
      {
        name: "description",
        content:
          "Loja de packs de música TopDJ: encontre lançamentos e sucessos de Nacionais, Rock, Sertanejo e Eletrônica. Pagamento seguro.",
      },
    ],
  }),
  loader: ({ context }) => (context as any).queryClient.ensureQueryData(packsQuery),
  component: Index,
  errorComponent: ({ error }) => {
    if (import.meta.env.DEV) {
      console.error("Erro ao carregar packs:", error);
    }
    const sbUrl = import.meta.env.VITE_SUPABASE_URL || "undefined";
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center" role="alert">
        <p className="text-muted-foreground text-white/60">Não foi possível carregar os packs.</p>
        <p className="mt-2 text-xs text-red-400 font-mono">{String(error)}</p>
        <p className="mt-4 text-xs text-white/40 font-mono">
          URL: {sbUrl} <br/>
          (If URL is missing https:// or has typos, it will cause Failed to fetch)
        </p>
      </div>
    );
  },
});

const TABS = [
  { id: "todas", label: "Todas" },
  { id: "populares", label: "Faixas populares" },
  { id: "albuns", label: "Álbuns" },
] as const;

function Index() {
  const { data: packs } = useSuspenseQuery(packsQuery);
  const { aba, genero } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const abaAtiva = aba ?? "todas";

  function setAba(novaAba: string) {
    navigate({ search: (prev) => ({ ...prev, aba: novaAba === "todas" ? undefined : novaAba }) });
  }

  function setGenero(g?: string) {
    navigate({ search: (prev) => ({ ...prev, genero: g }) });
  }

  // Logic to find a good spotlight pack
  const packsFiltrados = genero ? packs.filter((p) => p.genero === genero) : packs;
  const spotlightPack = packsFiltrados.find((p) => p.destaque) || packsFiltrados[0];
  const recentPacks = packsFiltrados.filter((p) => p.id !== spotlightPack?.id);

  return (
    <div className="min-h-screen text-white selection:bg-primary/30">
      {/* Profile Hero Section */}
      <SoundCloudHero />

      {/* Sticky Navigation Tabs Bar */}
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-md pt-4 max-w-[1440px] mx-auto px-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 md:gap-10 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAba(tab.id)}
                className={cn(
                  "pb-4 border-b-2 font-bold text-base md:text-lg whitespace-nowrap transition-all",
                  abaAtiva === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-white/40 hover:text-white font-medium",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="pb-4 hidden md:flex items-center gap-4">
            <Button variant="secondary" className="px-6 h-9 font-bold rounded-sm bg-white text-black hover:bg-white/90 shadow-lg">Estação</Button>
            <Button variant="outline" className="px-6 h-9 border-white/20 text-white font-bold rounded-sm hover:bg-white/5 transition-all">Compartilhar</Button>
          </div>
        </div>
      </div>

      {abaAtiva === "populares" ? (
        /* Aba Faixas Populares: ranking real de mais ouvidas */
        <main className="max-w-4xl mx-auto px-4 md:px-6 py-10">
          <PopularRanking showHeader={false} />
        </main>
      ) : (
        /* Main Content Layout */
        <main className="max-w-[1440px] mx-auto px-4 md:px-6 py-10 grid grid-cols-12 gap-8 md:gap-10">

          {/* Main Feed Column */}
          <div className="col-span-12 lg:col-span-8 space-y-10">

            {/* Filtro por gênero (trazido da Biblioteca) */}
            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
              <GenreChip active={!genero} onClick={() => setGenero(undefined)}>
                Todos os gêneros
              </GenreChip>
              {GENEROS.map((g) => (
                <GenreChip key={g} active={genero === g} onClick={() => setGenero(g)}>
                  {g}
                </GenreChip>
              ))}
            </div>

            {/* Featured Spotlight Track */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-white tracking-tight">Destaques</h2>
                <button className="text-sm font-semibold text-white/40 hover:text-primary transition-colors">Editar Destaques</button>
              </div>

              {spotlightPack ? (
                <TrackRowSoundCloud pack={spotlightPack} variant="spotlight" />
              ) : (
                <div className="p-12 border border-dashed border-white/10 rounded-xl text-center text-white/20 font-bold uppercase tracking-widest">
                  Nenhum destaque disponível
                </div>
              )}
            </section>

            {/* Recent Uploads List */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl font-bold text-white tracking-tight">Recente</h2>
                <a href="#" className="text-sm font-semibold text-white/40 hover:text-white transition-colors">Ver histórico</a>
              </div>

              <div className="space-y-8">
                {recentPacks.length > 0 ? (
                  recentPacks.map((pack) => (
                    <TrackRowSoundCloud key={pack.id} pack={pack} variant="regular" />
                  ))
                ) : (
                  <div className="py-20 text-center text-white/20 font-bold uppercase tracking-widest">
                    Nenhuma faixa recente encontrada
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Column */}
          <SoundCloudSidebar />

        </main>
      )}

      {/* Mobile Station/Share buttons */}
      <div className="md:hidden fixed bottom-20 right-4 flex flex-col gap-2 z-40">
        <Button size="icon" className="rounded-full bg-white text-black shadow-2xl"><Radio className="h-5 w-5" /></Button>
        <Button size="icon" variant="outline" className="rounded-full bg-background/80 backdrop-blur-md border-white/20 text-white shadow-2xl"><Share2 className="h-5 w-5" /></Button>
      </div>
    </div>
  );
}

function GenreChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm font-bold rounded-full transition-all border",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "text-white/50 border-white/10 hover:text-white hover:border-white/30",
      )}
    >
      {children}
    </button>
  );
}
