import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Pack } from "@/lib/packs";

export interface CartItem {
  id: string;
  nome: string;
  preco: number;
  genero: string;
  imagem_url: string | null;
  quantidade: number;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  addItem: (pack: Pack) => void;
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
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  function addItem(pack: Pack) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === pack.id);
      if (existing) {
        return prev.map((i) =>
          i.id === pack.id ? { ...i, quantidade: i.quantidade + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          id: pack.id,
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

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function setQuantidade(id: string, quantidade: number) {
    if (quantidade <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantidade } : i)),
    );
  }

  function clear() {
    setItems([]);
  }

  const totalItens = useMemo(
    () => items.reduce((acc, i) => acc + i.quantidade, 0),
    [items],
  );
  const total = useMemo(
    () => items.reduce((acc, i) => acc + i.quantidade * i.preco, 0),
    [items],
  );

  const value: CartContextValue = {
    items,
    isOpen,
    setOpen,
    addItem,
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
