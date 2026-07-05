import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Pack } from "@/lib/packs";
import type { Track } from "@/lib/tracks";
import { setSecureItem, getSecureItem, removeSecureItem } from "@/lib/secure-storage";
import { refreshCartPrices } from "@/lib/price-protection";

export interface CartItem {
  /** Para itens do tipo "pack", id do pack. Para "track", id da própria faixa. */
  id: string;
  tipo: "pack" | "track";
  nome: string;
  preco: number;
  genero: string;
  imagem_url: string | null;
  quantidade: number;
  /** Preenchido apenas quando tipo === "track": id do pack ao qual a faixa pertence. */
  packId?: string;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  addItem: (pack: Pack) => void;
  addTrack: (track: Track, packInfo: { genero: string; imagem_url: string | null }) => void;
  removeItem: (id: string) => void;
  setQuantidade: (id: string, quantidade: number) => void;
  clear: () => void;
  totalItens: number;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "topdj-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const items = await getSecureItem<CartItem[]>(STORAGE_KEY, []);
        // Atualizar preços com valores do banco de dados
        const refreshedItems = await refreshCartPrices(items);
        setItems(refreshedItems);
      } catch {
        /* ignore */
      }
    };
    loadCart();
  }, []);

  useEffect(() => {
    const saveCart = async () => {
      try {
        await setSecureItem(STORAGE_KEY, items);
      } catch {
        /* ignore */
      }
    };
    saveCart();
  }, [items]);

  function addItem(pack: Pack) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === pack.id && i.tipo === "pack");
      if (existing) {
        return prev.map((i) =>
          i.id === pack.id && i.tipo === "pack" ? { ...i, quantidade: i.quantidade + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          id: pack.id,
          tipo: "pack",
          nome: pack.nome,
          preco: pack.preco,
          genero: pack.genero,
          imagem_url: pack.imagem_url,
          quantidade: 1,
        },
      ];
    });
    setOpen(true);
  }

  function addTrack(track: Track, packInfo: { genero: string; imagem_url: string | null }) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === track.id && i.tipo === "track");
      if (existing) {
        return prev.map((i) =>
          i.id === track.id && i.tipo === "track" ? { ...i, quantidade: i.quantidade + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          id: track.id,
          tipo: "track",
          nome: track.title,
          preco: track.price,
          genero: packInfo.genero,
          imagem_url: packInfo.imagem_url,
          quantidade: 1,
          packId: track.pack_id,
        },
      ];
    });
    setOpen(true);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function setQuantidade(id: string, quantidade: number) {
    if (quantidade <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantidade } : i)));
  }
  // Nota: ids são UUIDs gerados pelo banco, então colisão entre pack e track é
  // praticamente impossível; usar apenas "id" aqui mantém a API simples.

  function clear() {
    setItems([]);
  }

  const totalItens = useMemo(() => items.reduce((acc, i) => acc + i.quantidade, 0), [items]);
  const total = useMemo(() => items.reduce((acc, i) => acc + i.quantidade * i.preco, 0), [items]);

  const value: CartContextValue = {
    items,
    isOpen,
    setOpen,
    addItem,
    addTrack,
    removeItem,
    setQuantidade,
    clear,
    totalItens,
    total,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}
