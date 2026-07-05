import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { formatPreco } from "@/lib/packs";
import { packImage } from "@/lib/pack-images";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

export function CartDrawer() {
  const { isOpen, setOpen, items, removeItem, setQuantidade, total, clear } = useCart();

  const navigate = useNavigate();

  function finalizar() {
    setOpen(false);
    navigate({ to: "/checkout" });
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
            onClick={() => setOpen(false)}
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
                <ShoppingBag className="h-5 w-5 text-primary" />
                Seu Carrinho
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar carrinho"
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
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
                          <p className="text-sm font-semibold leading-tight">{item.nome}</p>
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
                              onClick={() => setQuantidade(item.id, item.quantidade - 1)}
                              aria-label="Diminuir"
                              className="flex h-7 w-7 items-center justify-center hover:bg-muted"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold">
                              {item.quantidade}
                            </span>
                            <button
                              onClick={() => setQuantidade(item.id, item.quantidade + 1)}
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
                  onClick={finalizar}
                  className="h-12 w-full bg-[image:var(--gradient-primary)] text-base font-bold text-primary-foreground hover:opacity-90"
                >
                  Finalizar Compra
                </Button>
                <button
                  onClick={clear}
                  className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground"
                >
                  Esvaziar carrinho
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
