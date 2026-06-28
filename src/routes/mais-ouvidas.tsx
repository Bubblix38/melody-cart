import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { fetchPacks, formatPreco } from "@/lib/packs";
import { packImage } from "@/lib/pack-images";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";

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
  const { data: packs } = useSuspenseQuery(packsQuery);
  const { addItem } = useCart();
  const ranking = [...packs]
    .sort((a, b) => Number(b.destaque) - Number(a.destaque) || b.preco - a.preco)
    .slice(0, 10);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground">
          <Trophy className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold">Mais Ouvidas</h1>
          <p className="text-muted-foreground">Os packs em alta na TopDJ.</p>
        </div>
      </div>

      <ol className="mt-8 space-y-3">
        {ranking.map((pack, i) => (
          <li
            key={pack.id}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]"
          >
            <span className="w-8 shrink-0 text-center text-2xl font-extrabold text-gradient">
              {i + 1}
            </span>
            <img
              src={packImage(pack.imagem_url, pack.genero)}
              alt={pack.nome}
              loading="lazy"
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{pack.nome}</p>
              <p className="text-sm text-muted-foreground">{pack.genero}</p>
            </div>
            <span className="hidden font-bold sm:block">{formatPreco(pack.preco)}</span>
            <Button
              size="sm"
              onClick={() => addItem(pack)}
              className="bg-[image:var(--gradient-primary)] font-semibold text-primary-foreground hover:opacity-90"
            >
              Comprar
            </Button>
          </li>
        ))}
      </ol>
    </div>
  );
}
