import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Minus, Plus, ShoppingBag, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { useCart } from "@/lib/cart";
import { formatPreco } from "@/lib/packs";
import { packImage } from "@/lib/pack-images";
import { createCheckout } from "@/lib/checkout.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const buyerSchema = z.object({
  nome: z.string().trim().min(1, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
});

export function CartDrawer() {
  const { isOpen, setOpen, items, removeItem, setQuantidade, total } = useCart();
  const checkout = useServerFn(createCheckout);

  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  function close() {
    setOpen(false);
    setTimeout(() => setStep("cart"), 300);
  }

  async function finalizar(e: React.FormEvent) {
    e.preventDefault();
    const parsed = buyerSchema.safeParse({ nome, email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const result = await checkout({
        data: {
          nome: parsed.data.nome,
          email: parsed.data.email,
          items: items.map((i) => ({ id: i.id, quantidade: i.quantidade })),
        },
      });
      // Redirect to Stripe Checkout (Pix / card).
      window.location.assign(result.url);
    } catch (err) {
      toast.error("Não foi possível iniciar o pagamento", {
        description: err instanceof Error ? err.message : undefined,
      });
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                {step === "checkout" ? (
                  <>
                    <button
                      onClick={() => setStep("cart")}
                      aria-label="Voltar ao carrinho"
                      className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    Dados do comprador
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Seu Carrinho
                  </>
                )}
              </h2>
              <button
                onClick={close}
                aria-label="Fechar carrinho"
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {step === "cart" ? (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {items.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        Seu carrinho está vazio.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {items.map((item) => (
                        <li
                          key={item.id}
                          className="flex gap-3 rounded-xl border border-border bg-card p-3"
                        >
                          <img
                            src={packImage(item.imagem_url, item.genero)}
                            alt={item.nome}
                            loading="lazy"
                            width={64}
                            height={64}
                            className="h-16 w-16 shrink-0 rounded-lg object-cover"
                          />
                          <div className="flex flex-1 flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold leading-tight">
                                {item.nome}
                              </p>
                              <button
                                onClick={() => removeItem(item.id)}
                                aria-label="Remover item"
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground">{item.genero}</p>
                            <div className="mt-auto flex items-center justify-between">
                              <div className="flex items-center gap-1 rounded-lg border border-border">
                                <button
                                  onClick={() =>
                                    setQuantidade(item.id, item.quantidade - 1)
                                  }
                                  aria-label="Diminuir"
                                  className="flex h-7 w-7 items-center justify-center hover:bg-muted"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-6 text-center text-sm font-semibold">
                                  {item.quantidade}
                                </span>
                                <button
                                  onClick={() =>
                                    setQuantidade(item.id, item.quantidade + 1)
                                  }
                                  aria-label="Aumentar"
                                  className="flex h-7 w-7 items-center justify-center hover:bg-muted"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <span className="text-sm font-bold">
                                {formatPreco(item.preco * item.quantidade)}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {items.length > 0 && (
                  <div className="border-t border-border px-5 py-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="text-2xl font-extrabold text-gradient">
                        {formatPreco(total)}
                      </span>
                    </div>
                    <Button
                      onClick={() => setStep("checkout")}
                      className="h-12 w-full bg-[image:var(--gradient-primary)] text-base font-bold text-primary-foreground hover:opacity-90"
                    >
                      Finalizar Compra
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={finalizar} className="flex flex-1 flex-col">
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <p className="mb-4 text-sm text-muted-foreground">
                    Informe seus dados para receber o pedido e os links de download.
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="buyer-nome">Nome completo</Label>
                      <Input
                        id="buyer-nome"
                        required
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Seu nome"
                        autoComplete="name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="buyer-email">E-mail</Label>
                      <Input
                        id="buyer-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="voce@email.com"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2 rounded-xl border border-border bg-card p-3 text-sm">
                    {items.map((item) => (
                      <li key={item.id} className="flex justify-between gap-2">
                        <span className="text-muted-foreground">
                          {item.nome}
                          {item.quantidade > 1 ? ` ×${item.quantidade}` : ""}
                        </span>
                        <span className="font-semibold">
                          {formatPreco(item.preco * item.quantidade)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-border px-5 py-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-2xl font-extrabold text-gradient">
                      {formatPreco(total)}
                    </span>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full bg-[image:var(--gradient-primary)] text-base font-bold text-primary-foreground hover:opacity-90"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Redirecionando...
                      </>
                    ) : (
                      "Ir para o pagamento"
                    )}
                  </Button>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Pagamento seguro via Stripe (Pix ou cartão).
                  </p>
                </div>
              </form>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}