import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const checkoutSchema = z.object({
  nome: z.string().trim().min(1, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        quantidade: z.number().int().min(1).max(99),
      }),
    )
    .min(1, "Carrinho vazio")
    .max(50),
});

function getOrigin(): string {
  const origin = getRequestHeader("origin");
  if (origin) return origin.replace(/\/$/, "");
  const host = getRequestHeader("host");
  const proto = getRequestHeader("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/** Encode nested params into application/x-www-form-urlencoded for the Stripe API. */
function encodeForm(obj: Record<string, unknown>, prefix = ""): string[] {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        if (typeof v === "object" && v !== null) {
          parts.push(...encodeForm(v as Record<string, unknown>, `${name}[${i}]`));
        } else {
          parts.push(`${encodeURIComponent(`${name}[${i}]`)}=${encodeURIComponent(String(v))}`);
        }
      });
    } else if (typeof value === "object") {
      parts.push(...encodeForm(value as Record<string, unknown>, name));
    } else {
      parts.push(`${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts;
}

async function stripeRequest(path: string, method: "GET" | "POST", body?: Record<string, unknown>) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Pagamento indisponível: chave Stripe não configurada.");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body ? encodeForm(body).join("&") : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    console.error("[stripe]", json?.error?.message ?? json);
    throw new Error(json?.error?.message ?? "Erro ao processar pagamento.");
  }
  return json;
}

export const createCheckout = createServerFn({ method: "POST" })
  .inputValidator((data) => checkoutSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    // Authoritative pack data from DB (never trust client-supplied prices).
    const ids = data.items.map((i) => i.id);
    const { data: packs, error: packErr } = await db
      .from("packs")
      .select("id, nome, genero, preco, arquivo_url")
      .in("id", ids);
    if (packErr) throw new Error(packErr.message);
    if (!packs || packs.length === 0) throw new Error("Produtos não encontrados.");

    const linha = data.items
      .map((item) => {
        const pack = packs.find((p: any) => p.id === item.id);
        if (!pack) return null;
        return { pack, quantidade: item.quantidade };
      })
      .filter(Boolean) as { pack: any; quantidade: number }[];

    if (linha.length === 0) throw new Error("Produtos não encontrados.");

    const total = linha.reduce((acc, l) => acc + Number(l.pack.preco) * l.quantidade, 0);

    // Create pending order.
    const { data: pedido, error: pedErr } = await db
      .from("pedidos")
      .insert({ nome: data.nome, email: data.email, total, status: "pendente" })
      .select()
      .single();
    if (pedErr) throw new Error(pedErr.message);

    const itens = linha.map((l) => ({
      pedido_id: pedido.id,
      pack_id: l.pack.id,
      nome: l.pack.nome,
      genero: l.pack.genero,
      preco: Number(l.pack.preco),
      quantidade: l.quantidade,
      arquivo_url: l.pack.arquivo_url ?? null,
    }));
    const { error: itemErr } = await db.from("itens_pedido").insert(itens);
    if (itemErr) throw new Error(itemErr.message);

    const origin = getOrigin();
    const session = await stripeRequest("checkout/sessions", "POST", {
      mode: "payment",
      success_url: `${origin}/pedido/${pedido.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?compra=cancelada`,
      customer_email: data.email,
      client_reference_id: pedido.id,
      metadata: { pedido_id: pedido.id },
      line_items: linha.map((l) => ({
        quantity: l.quantidade,
        price_data: {
          currency: "brl",
          unit_amount: Math.round(Number(l.pack.preco) * 100),
          product_data: { name: l.pack.nome },
        },
      })),
    });

    await db.from("pedidos").update({ stripe_session_id: session.id }).eq("id", pedido.id);

    return { url: session.url as string };
  });

const idSchema = z.object({ id: z.string().uuid() });

export interface PedidoItem {
  id: string;
  nome: string;
  genero: string;
  preco: number;
  quantidade: number;
  arquivo_url: string | null;
}

export interface PedidoResult {
  id: string;
  nome: string;
  email: string;
  total: number;
  status: string;
  itens: PedidoItem[];
}

export const getPedido = createServerFn({ method: "GET" })
  .inputValidator((data) => idSchema.parse(data))
  .handler(async ({ data }): Promise<PedidoResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    const { data: pedido, error } = await db
      .from("pedidos")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !pedido) throw new Error("Pedido não encontrado.");

    let status = pedido.status as string;

    // Confirm payment with Stripe if still pending.
    if (status !== "pago" && pedido.stripe_session_id) {
      try {
        const session = await stripeRequest(
          `checkout/sessions/${pedido.stripe_session_id}`,
          "GET",
        );
        if (session.payment_status === "paid") {
          status = "pago";
          await db.from("pedidos").update({ status: "pago" }).eq("id", pedido.id);
        }
      } catch (e) {
        console.error("[getPedido] stripe verify failed", e);
      }
    }

    const { data: itens } = await db
      .from("itens_pedido")
      .select("id, nome, genero, preco, quantidade, arquivo_url")
      .eq("pedido_id", pedido.id);

    const pago = status === "pago";
    return {
      id: pedido.id,
      nome: pedido.nome,
      email: pedido.email,
      total: Number(pedido.total),
      status,
      itens: (itens ?? []).map((i: any) => ({
        id: i.id,
        nome: i.nome,
        genero: i.genero,
        preco: Number(i.preco),
        quantidade: i.quantidade,
        // Only reveal download links once paid.
        arquivo_url: pago ? (i.arquivo_url ?? null) : null,
      })),
    };
  });
