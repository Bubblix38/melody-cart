import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { fetchPacks, GENEROS } from "@/lib/packs";
import { PackCard } from "@/components/PackCard";
import { cn } from "@/lib/utils";

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
          "Explore todos os packs de música da TopDJ por gênero: Pop, Rock, Sertanejo e Eletrônica. Adicione ao carrinho e finalize.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(packsQuery),
  component: Loja,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center" role="alert">
      <p className="text-muted-foreground">Não foi possível carregar os packs.</p>
      <p className="mt-2 text-xs text-muted-foreground">{error.message}</p>
    </div>
  ),
});

function Loja() {
  const { data: packs } = useSuspenseQuery(packsQuery);
  const { genero } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const filtrados = genero
    ? packs.filter((p) => p.genero === genero)
    : packs;

  function setGenero(g?: string) {
    navigate({ search: { genero: g } });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold sm:text-4xl">
        Loja de <span className="text-gradient">Álbuns</span>
      </h1>
      <p className="mt-2 text-muted-foreground">
        Escolha seu pack favorito e adicione ao carrinho.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterChip active={!genero} onClick={() => setGenero(undefined)}>
          Todos
        </FilterChip>
        {GENEROS.map((g) => (
          <FilterChip key={g} active={genero === g} onClick={() => setGenero(g)}>
            {g}
          </FilterChip>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">
          Nenhum pack encontrado para este gênero.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtrados.map((pack) => (
            <PackCard key={pack.id} pack={pack} />
          ))}
        </div>
      )}
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
        "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
        active
          ? "border-transparent bg-[image:var(--gradient-primary)] text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
