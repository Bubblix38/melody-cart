import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart";
import { formatPreco } from "@/lib/packs";
import { CheckoutValidation } from "@/components/CheckoutValidation";
import { PaymentGateway } from "@/components/PaymentGateway";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { packImage } from "@/lib/pack-images";
import { ArrowLeft, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: "Finalizar Compra — TopDJ" }],
  }),
  component: Checkout,
});

function Checkout() {
  const { items, total } = useCart();
  const navigate = useNavigate();

  const [isValidated, setIsValidated] = useState(false);
  const [validatedTotal, setValidatedTotal] = useState(0);
  const [checkingSession, setCheckingSession] = useState(true);

  // Form states
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");

  // Compra precisa estar vinculada a uma conta para o download aparecer no perfil.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/login" });
        return;
      }
      setEmail(data.session.user.email ?? "");
      setNome(data.session.user.user_metadata?.full_name ?? "");
      setCheckingSession(false);
    });
  }, [navigate]);

  if (checkingSession) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Verificando sua conta...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold">Seu carrinho está vazio</h2>
        <p className="mt-2 text-muted-foreground">
          Adicione alguns packs antes de finalizar a compra.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Voltar para a Loja</Link>
        </Button>
      </div>
    );
  }

  const isFormValid = nome.trim() !== "" && email.includes("@");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/" })}
          className="mr-4 px-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-extrabold sm:text-4xl">
          Finalizar <span className="text-gradient">Compra</span>
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column - User details & Payment */}
        <div className="space-y-8">
          <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 text-xl font-bold">1. Seus Dados</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: DJ Alok"
                  disabled={isValidated}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail para Entrega</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Para onde enviaremos o link de download?"
                  disabled={isValidated}
                />
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <Lock className="mr-1 h-3 w-3" />
                  Garantimos a segurança dos seus dados.
                </p>
              </div>
            </div>
          </section>

          {isValidated && isFormValid && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <PaymentGateway items={items} amount={validatedTotal} nome={nome} email={email} />
            </section>
          )}
        </div>

        {/* Right Column - Cart Summary & Validation */}
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-muted/20 p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">Resumo do Pedido</h2>

            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 border-b border-border/50 pb-4 last:border-0 last:pb-0"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md">
                    <img
                      src={packImage(item.imagem_url, item.genero)}
                      alt={item.nome}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="font-semibold leading-tight">{item.nome}</span>
                    <span className="text-xs text-muted-foreground">{item.genero}</span>
                  </div>
                  <div className="text-right font-bold text-lg">{formatPreco(item.preco)}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-lg font-medium">Total</span>
              <span className="text-2xl font-extrabold text-gradient">{formatPreco(total)}</span>
            </div>
          </section>

          {!isValidated ? (
            <div className={!isFormValid ? "opacity-50 pointer-events-none" : ""}>
              <CheckoutValidation
                items={items}
                onValidated={(validItems, verifiedTotal) => {
                  setValidatedTotal(verifiedTotal);
                  setIsValidated(true);
                }}
                onCancel={() => navigate({ to: "/" })}
              />
              {!isFormValid && (
                <p className="text-center text-sm text-destructive mt-2">
                  Preencha seu nome e e-mail antes de prosseguir.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-center">
              <p className="text-sm font-bold text-green-500 mb-1">✓ Preços validados e travados</p>
              <p className="text-xs text-muted-foreground">
                Prossiga com o pagamento seguro ao lado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
