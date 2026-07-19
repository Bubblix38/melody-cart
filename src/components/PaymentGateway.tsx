import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import type { CartItem } from "@/lib/cart";
import { createPaymentIntentFn } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : Promise.resolve(null);

export function PaymentGateway({
  items,
  amount,
  nome,
  email,
}: {
  items: CartItem[];
  amount: number;
  nome: string;
  email: string;
}) {
  const [clientSecret, setClientSecret] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function start() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      createPaymentIntentFn({
        data: {
          items: items.map((i) => ({ id: i.id, tipo: i.tipo, quantidade: i.quantidade })),
          nome,
          email,
          accessToken: session?.access_token,
        },
      })
        .then((data) => {
          if (!data || !data.clientSecret) {
            setErrorMsg("Erro ao processar pagamento");
            toast.error("Erro ao processar pagamento");
            return;
          }
          setClientSecret(data.clientSecret);
        })
        .catch((err) => {
          console.error(err);
          setErrorMsg(err.message || "Erro ao conectar com o servidor.");
        });
    }
    start();
  }, [items, amount]);

  const appearance = {
    theme: "night" as const,
    variables: {
      colorPrimary: "#f97316", // Orange
      colorBackground: "#09090b", // Zinc-950
      colorText: "#ffffff",
      colorDanger: "#ef4444",
      fontFamily: "Inter, system-ui, sans-serif",
    },
  };

  return (
    <div className="w-full rounded-xl border border-border bg-card p-4 sm:p-6 shadow-[var(--shadow-card)]">
      <h3 className="mb-4 text-xl font-bold">Pagamento Seguro</h3>
      {errorMsg ? (
        <div className="flex flex-col h-32 items-center justify-center text-destructive text-center gap-2">
          <p className="font-bold">Falha ao carregar o pagamento.</p>
          <p className="text-sm opacity-80">{errorMsg}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Dica: Tente reiniciar o servidor de desenvolvimento.
          </p>
        </div>
      ) : !stripePublicKey ? (
        <div className="flex flex-col h-32 items-center justify-center text-destructive text-center gap-2">
          <p className="font-bold">Chave pública do Stripe ausente.</p>
          <p className="text-sm opacity-80">Configure VITE_STRIPE_PUBLIC_KEY no seu ambiente.</p>
        </div>
      ) : !clientSecret ? (
        <div className="flex h-32 items-center justify-center text-muted-foreground">
          Carregando ambiente seguro...
        </div>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
          <CheckoutForm nome={nome} email={email} />
        </Elements>
      )}
    </div>
  );
}

function CheckoutForm({ nome, email }: { nome: string; email: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError("");

    if (!stripe || !elements) return;
    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/sucesso`,
        receipt_email: email,
        payment_method_data: {
          billing_details: {
            name: nome,
            email: email,
          },
        },
      },
    });

    if (error) {
      setCheckoutError(error.message || "Ocorreu um erro inesperado.");
      toast.error(error.message || "Ocorreu um erro inesperado.");
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <PaymentElement options={{ layout: "tabs" }} />
      {checkoutError && (
        <div className="text-sm font-semibold text-destructive text-center">{checkoutError}</div>
      )}
      <Button
        disabled={isLoading || !stripe || !elements}
        type="submit"
        size="lg"
        className="w-full bg-[image:var(--gradient-primary)] text-lg font-bold shadow-[var(--shadow-glow)]"
      >
        {isLoading ? "Processando..." : "Pagar Agora"}
      </Button>
    </form>
  );
}
