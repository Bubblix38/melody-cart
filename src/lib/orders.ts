import { supabase } from "@/integrations/supabase/client";

export interface OrderDownload {
  pedidoId: string;
  comprado_em: string;
  nome: string;
  tipo: "pack" | "track";
  url: string | null;
}

/**
 * Lista os downloads liberados para o usuário logado: apenas itens de
 * pedidos com status "pago". Usado na seção "Meus Álbuns" do perfil.
 */
export async function getUserDownloads(): Promise<OrderDownload[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return [];

  const db = supabase as unknown as { from: (t: string) => any };

  const { data, error } = await db
    .from("pedidos")
    .select(
      "id, created_at, status, itens_pedido ( pack_id, track_id, packs ( nome, arquivo_url ), tracks ( title, download_url ) )",
    )
    .eq("user_id", session.user.id)
    .eq("status", "pago")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const downloads: OrderDownload[] = [];
  for (const pedido of data ?? []) {
    for (const item of pedido.itens_pedido ?? []) {
      if (item.track_id && item.tracks) {
        downloads.push({
          pedidoId: pedido.id,
          comprado_em: pedido.created_at,
          nome: item.tracks.title,
          tipo: "track",
          url: item.tracks.download_url ?? null,
        });
      } else if (item.pack_id && item.packs) {
        downloads.push({
          pedidoId: pedido.id,
          comprado_em: pedido.created_at,
          nome: item.packs.nome,
          tipo: "pack",
          url: item.packs.arquivo_url ?? null,
        });
      }
    }
  }

  return downloads;
}
