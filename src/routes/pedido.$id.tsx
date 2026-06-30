import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { CheckCircle2, Clock, Download, Loader2, ArrowRight } from "lucide-react";
import { getPedido } from "@/lib/checkout.functions";
import { formatPreco } from "@/lib/packs";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pedido/$id")({
  head: () => ({
    meta: [
      { title: "Seu Pedido | TopDJ" },
      { name: "description", content: "Detalhes e download do seu pedido na TopDJ." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PedidoPage,
});

function PedidoPage() {
  const { id } = Route.useParams();
  const fetchPedido = useServerFn(getPedido);
  const { clear } = useCart();

  const { data: pedido, isLoading, error } = useQuery({
    queryKey: ["pedido", id],
    queryFn: () => fetchPedido({ data: { id } }),
    // Pix payments confirm asynchronously — keep polling while pending.
    refetchInterval: (q) => (q.state.data?.status === "pago" ? false : 4000),
  });

  const pago = pedido?.status === "pago";

  useEffect(() => {
    if (pago) clear();
  }, [pago, clear]);

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando seu pedido...</p>
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Pedido não encontrado</h1>
        <p className="mt-2 text-muted-foreground">
          Verifique o link ou volte para a loja.
        </p>
        <Button asChild className="mt-6">
          <Link to="/loja">Ir para a loja</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="flex flex-col items-center text-center">
          {pago ? (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.55_0.13_150)]/15 text-[oklch(0.5_0.15_150)]">
              <CheckCircle2 className="h-8 w-8" />
            </span>
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Clock className="h-8 w-8" />
            </span>
          )}
          <h1 className="mt-4 text-2xl font-extrabold">
            {pago ? "Pagamento confirmado!" : "Aguardando pagamento"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {pago
              ? `Obrigado, ${pedido.nome}! Seus downloads estão liberados abaixo.`
              : "Assim que o pagamento for confirmado (Pix pode levar alguns instantes), os downloads aparecerão aqui automaticamente."}
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {pedido.itens.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
            >
              <div>
                <p className="font-semibold">
                  {item.nome}
                  {item.quantidade > 1 ? ` ×${item.quantidade}` : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.genero} · {formatPreco(item.preco * item.quantidade)}
                </p>
              </div>
              {pago ? (
                item.arquivo_url ? (
                  <Button asChild size="sm" className="font-semibold">
                    <a href={item.arquivo_url} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-1 h-4 w-4" />
                      Baixar
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Download em breve por e-mail
                  </span>
                )
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-extrabold text-gradient">
            {formatPreco(pedido.total)}
          </span>
        </div>

        <div className="mt-8 flex justify-center">
          <Button asChild variant="outline" className="font-semibold">
            <Link to="/loja">
              Continuar comprando
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
