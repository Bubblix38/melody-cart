import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Pack } from "@/lib/packs";
import { formatPreco } from "@/lib/packs";
import { packImage } from "@/lib/pack-images";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";

export function PackCard({ pack }: { pack: Pack }) {
  const { addItem } = useCart();

  function handleAdd() {
    addItem(pack);
    toast.success(`${pack.nome} adicionado ao carrinho`);
  }

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={packImage(pack.imagem_url, pack.genero)}
          alt={pack.nome}
          loading="lazy"
          width={768}
          height={768}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-background/85 px-3 py-1 text-xs font-semibold backdrop-blur">
          {pack.genero}
        </span>
        {pack.destaque && (
          <span className="absolute right-3 top-3 rounded-full bg-[image:var(--gradient-primary)] px-3 py-1 text-xs font-bold text-primary-foreground">
            Destaque
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-bold leading-tight">{pack.nome}</h3>
          {pack.descricao && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {pack.descricao}
            </p>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-xl font-extrabold text-gradient">
            {formatPreco(pack.preco)}
          </span>
          <Button
            onClick={handleAdd}
            size="sm"
            className="bg-[image:var(--gradient-primary)] font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="mr-1 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
