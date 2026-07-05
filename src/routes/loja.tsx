import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { fetchPacks, GENEROS } from "@/lib/packs";
import { TrackRow } from "@/components/TrackRow";
import { cn } from "@/lib/utils";
import { popImg, rockImg } from "@/lib/pack-images";

const packsQuery = queryOptions({
  queryKey: ["packs"],
  queryFn: fetchPacks,
});

type LojaSearch = { genero?: string };

export const Route = createFileRoute("/loja")({
  validateSearch: (search: Record<string, unknown>): LojaSearch => ({
    genero: typeof search.genero === "string" ? search.genero : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Loja de Álbuns — TopDJ" },
      {
        name: "description",
        content:
          "Explore todos os packs de música da TopDJ por gênero: Nacionais, Rock, Sertanejo e Eletrônica. Adicione ao carrinho e finalize.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(packsQuery),
  component: Loja,
  errorComponent: ({ error }) => {
    // Log do erro completo apenas em desenvolvimento
    if (import.meta.env.DEV) {
      console.error("Erro ao carregar packs:", error);
    }
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center" role="alert">
        <p className="text-muted-foreground">Não foi possível carregar os packs.</p>
        {import.meta.env.DEV && (
          <p className="mt-2 text-xs text-muted-foreground">{error.message}</p>
        )}
      </div>
    );
  },
});

function Loja() {
  const { data: packs } = useSuspenseQuery(packsQuery);
  const { genero } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const filtrados = genero ? packs.filter((p) => p.genero === genero) : packs;

  function setGenero(g?: string) {
    navigate({ search: { genero: g } });
  }

  // Get a fallback image for the banner based on genre
  const getBannerImg = (g?: string) => {
    if (g === "Rock") return rockImg;
    return popImg;
  };

  return (
    <div className="mx-auto max-w-7xl pb-12">
      {genero ? (
        /* SOUNDCLOUD STYLE HERO BANNERS */
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-muted sm:rounded-b-2xl shadow-lg">
          {/* Banner Background */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${getBannerImg(genero)})` }}
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Content inside Banner */}
          <div className="absolute bottom-0 left-0 flex w-full flex-col sm:flex-row items-center sm:items-end p-6 gap-6">
            {/* Avatar */}
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-background shadow-2xl">
              <img src={getBannerImg(genero)} alt={genero} className="h-full w-full object-cover" />
            </div>

            {/* Text details */}
            <div className="mb-2 text-center sm:text-left">
              <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                {genero} Hits
              </h1>
              <p className="mt-1 text-lg font-medium text-white/80 drop-shadow">
                O melhor canal de {genero}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 pt-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            Loja de <span className="text-gradient">Álbuns</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Escolha seu pack favorito e adicione ao carrinho.
          </p>
        </div>
      )}

      {/* Tabs / Filter Chips */}
      <div className="mt-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2 border-b border-border pb-4">
          <FilterChip active={!genero} onClick={() => setGenero(undefined)}>
            Todas as faixas
          </FilterChip>
          {GENEROS.map((g) => (
            <FilterChip key={g} active={genero === g} onClick={() => setGenero(g)}>
              {g}
            </FilterChip>
          ))}
        </div>

        {filtrados.length === 0 ? (
          <p className="mt-16 text-center text-muted-foreground">
            Nenhum pack encontrado para esta categoria.
          </p>
        ) : (
          <div className="mt-8 flex flex-col gap-6 max-w-4xl">
            {filtrados.map((pack) => (
              <TrackRow key={pack.id} pack={pack} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({
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
        "px-4 py-2 text-sm font-bold transition-all relative",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      {active && (
        <span className="absolute bottom-[-17px] left-0 right-0 h-1 bg-[image:var(--gradient-primary)] rounded-t-md" />
      )}
    </button>
  );
}
