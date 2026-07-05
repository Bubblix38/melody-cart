import { createFileRoute } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { fetchPacks } from "@/lib/packs";
import { PopularRanking } from "@/components/PopularRanking";

const packsQuery = queryOptions({
  queryKey: ["packs"],
  queryFn: fetchPacks,
});

export const Route = createFileRoute("/mais-ouvidas")({
  head: () => ({
    meta: [
      { title: "Mais Ouvidas — Ranking TopDJ" },
      {
        name: "description",
        content:
          "Confira o ranking dos packs de música mais ouvidos da TopDJ e leve os hits do momento.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(packsQuery),
  component: MaisOuvidas,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center" role="alert">
      <p className="text-muted-foreground">Não foi possível carregar o ranking.</p>
      <p className="mt-2 text-xs text-muted-foreground">{error.message}</p>
    </div>
  ),
});

function MaisOuvidas() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <PopularRanking />
    </div>
  );
}
