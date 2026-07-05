/**
 * Proteção contra manipulação de preços
 * Garante que o preço sempre venha do banco de dados, não do frontend
 */

import { supabase } from "@/integrations/supabase/client";

export interface PriceValidationResult {
  isValid: boolean;
  actualPrice: number;
  cartTotal: number;
  manipulatedItems: string[];
}

/**
 * Valida todos os preços do carrinho contra o banco de dados
 * Retorna quais itens tiveram preço manipulado
 */
export async function validateCartPrices(
  cartItems: Array<{
    id: string;
    tipo: "pack" | "track";
    nome: string;
    preco: number;
    quantidade: number;
  }>,
): Promise<PriceValidationResult> {
  try {
    const packItems = cartItems.filter((i) => i.tipo === "pack");
    const trackItems = cartItems.filter((i) => i.tipo === "track");

    const [packsResult, tracksResult] = await Promise.all([
      packItems.length > 0
        ? supabase.from("packs").select("id, nome, preco").in("id", packItems.map((i) => i.id))
        : Promise.resolve({ data: [], error: null }),
      trackItems.length > 0
        ? supabase
            .from("tracks" as any)
            .select("id, title, price")
            .in("id", trackItems.map((i) => i.id))
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (packsResult.error || tracksResult.error) {
      console.error("Erro ao validar preços:", packsResult.error || tracksResult.error);
      return {
        isValid: false,
        actualPrice: 0,
        cartTotal: 0,
        manipulatedItems: ["Erro ao validar preços"],
      };
    }

    const priceMap = new Map<string, { nome: string; preco: number }>();
    (packsResult.data ?? []).forEach((pack: any) =>
      priceMap.set(pack.id, { nome: pack.nome, preco: Number(pack.preco) }),
    );
    (tracksResult.data ?? []).forEach((track: any) =>
      priceMap.set(track.id, { nome: track.title, preco: Number(track.price) }),
    );

    // Validar cada item do carrinho
    const manipulatedItems: string[] = [];
    let actualTotal = 0;

    for (const cartItem of cartItems) {
      const dbPrice = priceMap.get(cartItem.id);

      if (!dbPrice) {
        manipulatedItems.push(`${cartItem.nome} (não encontrado no banco)`);
        continue;
      }

      const expectedPrice = dbPrice.preco;
      const cartPrice = Number(cartItem.preco);

      // Verificar se o preço foi manipulado (diferença maior que 1 centavo)
      if (Math.abs(expectedPrice - cartPrice) > 0.01) {
        manipulatedItems.push(
          `${cartItem.nome}: R$ ${cartPrice.toFixed(2)} → R$ ${expectedPrice.toFixed(2)}`,
        );
      }

      // Usar preço do banco para o total
      actualTotal += expectedPrice * cartItem.quantidade;
    }

    return {
      isValid: manipulatedItems.length === 0,
      actualPrice: actualTotal,
      cartTotal: actualTotal,
      manipulatedItems,
    };
  } catch (error) {
    console.error("Erro na validação de preços:", error);
    return {
      isValid: false,
      actualPrice: 0,
      cartTotal: 0,
      manipulatedItems: ["Erro interno na validação"],
    };
  }
}

interface RefreshableCartItem {
  id: string;
  tipo: "pack" | "track";
  nome: string;
  preco: number;
  quantidade: number;
  genero?: string;
  imagem_url?: string | null;
  packId?: string;
}

/**
 * Atualiza o carrinho com preços corretos do banco de dados.
 * Suporta tanto itens do tipo "pack" (álbum) quanto "track" (faixa individual).
 */
export async function refreshCartPrices<T extends RefreshableCartItem>(
  cartItems: T[],
): Promise<T[]> {
  try {
    const packItems = cartItems.filter((i) => i.tipo === "pack");
    const trackItems = cartItems.filter((i) => i.tipo === "track");

    const [packsResult, tracksResult] = await Promise.all([
      packItems.length > 0
        ? supabase
            .from("packs")
            .select("id, preco, genero, imagem_url")
            .in("id", packItems.map((i) => i.id))
        : Promise.resolve({ data: [], error: null }),
      trackItems.length > 0
        ? supabase.from("tracks" as any).select("id, price").in(
            "id",
            trackItems.map((i) => i.id),
          )
        : Promise.resolve({ data: [], error: null }),
    ]);

    const packPriceMap = new Map(
      (packsResult.data ?? []).map((pack: any) => [
        pack.id,
        { preco: Number(pack.preco), genero: pack.genero, imagem_url: pack.imagem_url },
      ]),
    );
    const trackPriceMap = new Map(
      (tracksResult.data ?? []).map((track: any) => [track.id, Number(track.price)]),
    );

    return cartItems.map((item) => {
      if (item.tipo === "track") {
        const dbPrice = trackPriceMap.get(item.id);
        return {
          ...item,
          preco: dbPrice ?? item.preco,
          genero: item.genero || "Nacionais",
          imagem_url: item.imagem_url ?? null,
        };
      }
      const dbData = packPriceMap.get(item.id);
      return {
        ...item,
        preco: dbData?.preco ?? item.preco,
        genero: dbData?.genero || item.genero || "Nacionais",
        imagem_url: dbData?.imagem_url ?? item.imagem_url ?? null,
      };
    });
  } catch (error) {
    console.error("Erro ao atualizar preços:", error);
    return cartItems;
  }
}

/**
 * Hook para monitorar manipulação de preços
 */
export function usePriceProtection() {
  const checkForManipulation = async (
    cartItems: Array<{ id: string; tipo: "pack" | "track"; nome: string; preco: number; quantidade: number }>,
  ): Promise<boolean> => {
    const result = await validateCartPrices(cartItems);

    if (!result.isValid && result.manipulatedItems.length > 0) {
      console.warn("⚠️ Manipulação de preço detectada:", result.manipulatedItems);

      // Em produção, você pode:
      // 1. Logar a tentativa de manipulação
      // 2. Alertar o usuário
      // 3. Bloquear a compra
      // 4. Enviar notificação para o admin

      return true; // Manipulação detectada
    }

    return false;
  };

  return {
    validateCartPrices,
    refreshCartPrices,
    checkForManipulation,
  };
}
