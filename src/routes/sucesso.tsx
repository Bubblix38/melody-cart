import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle, Download, Home, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { verifyPaymentFn } from "@/lib/stripe";

export const Route = createFileRoute("/sucesso")({
  component: Sucesso,
});

function Sucesso() {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "pending">("loading");
  const [downloads, setDownloads] = useState<Array<{nome: string, url: string}>>([]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentIntentId = searchParams.get("payment_intent");

    if (!paymentIntentId) {
      setStatus("error");
      return;
    }

    verifyPaymentFn({ data: { paymentIntentId } })
      .then((res) => {
        if (res.success && res.status === "succeeded") {
          setDownloads(res.downloads);
          setStatus("success");
        } else if (res.status === "processing") {
          setStatus("pending");
        } else {
          setStatus("error");
        }
      })
      .catch((err) => {
        console.error(err);
        setStatus("error");
      });
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <Loader2 className="mb-6 h-16 w-16 animate-spin text-muted-foreground" />
        <h1 className="text-2xl font-bold">Verificando seu pagamento...</h1>
        <p className="mt-2 text-muted-foreground">Aguarde um instante, estamos liberando seus arquivos.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <XCircle className="mb-6 h-20 w-20 text-destructive" />
        <h1 className="text-3xl font-bold">Algo deu errado</h1>
        <p className="mt-2 text-muted-foreground">Não foi possível confirmar o pagamento. Se você já pagou, entre em contato com o suporte.</p>
        <Button size="lg" className="mt-6 h-12" asChild>
          <Link to="/">Voltar para a Loja</Link>
        </Button>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <Loader2 className="mb-6 h-20 w-20 animate-spin text-blue-500" />
        <h1 className="text-3xl font-bold">Pagamento em Processamento</h1>
        <p className="mt-2 text-muted-foreground">Seu pagamento está sendo processado. Você receberá um e-mail com os downloads assim que for aprovado.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center py-12">
      <CheckCircle className="mb-6 h-24 w-24 text-green-500" />
      <h1 className="text-4xl font-extrabold sm:text-5xl">
        Pagamento <span className="text-gradient">Aprovado!</span>
      </h1>
      <p className="mt-4 max-w-lg text-lg text-muted-foreground">
        Muito obrigado pela sua compra! Os seus álbuns já estão disponíveis para download imediato.
      </p>

      <div className="mt-8 w-full max-w-2xl text-left bg-card rounded-xl border p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Seus Downloads:</h2>
        <div className="space-y-4">
          {downloads.length > 0 ? (
            downloads.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 border">
                <span className="font-semibold text-lg">{item.nome}</span>
                <Button size="default" className="gap-2 font-bold shrink-0" asChild>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" /> Baixar
                  </a>
                </Button>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground italic">Nenhum arquivo disponível ainda. Entre em contato com o suporte.</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Button size="lg" variant="outline" className="h-14 gap-2 text-lg" asChild>
          <Link to="/">
            <Home className="h-5 w-5" />
            Voltar para a Loja
          </Link>
        </Button>
      </div>
    </div>
  );
}
