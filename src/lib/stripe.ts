import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

type CheckoutItem = { id: string; tipo: "pack" | "track"; quantidade: number };

export const createPaymentIntentFn = createServerFn({ method: "POST" })
  .validator(
    (data: { items: CheckoutItem[]; email: string; nome: string; accessToken?: string }) => data,
  )
  .handler(async ({ data }) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2024-04-10" as any,
    });

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Configuração do Supabase ausente no servidor (apiKey/URL)");
    }

    const sb = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Identifica o usuário logado (se houver) a partir do token enviado pelo
    // cliente, para vincular a compra ao perfil e liberar o download depois.
    let userId: string | null = null;
    if (data.accessToken) {
      const { data: userData } = await sb.auth.getUser(data.accessToken);
      userId = userData?.user?.id ?? null;
    }

    try {
      if (!Array.isArray(data.items) || data.items.length === 0) {
        throw new Error("Carrinho vazio");
      }

      const packItems = data.items.filter((i) => i.tipo === "pack");
      const trackItems = data.items.filter((i) => i.tipo === "track");

      const [packsResult, tracksResult] = await Promise.all([
        packItems.length > 0
          ? sb.from("packs").select("id, preco").in("id", packItems.map((i) => i.id))
          : Promise.resolve({ data: [], error: null }),
        trackItems.length > 0
          ? sb.from("tracks").select("id, price").in("id", trackItems.map((i) => i.id))
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (packsResult.error || tracksResult.error) throw new Error("Erro ao validar carrinho");

      const priceMap = new Map<string, number>();
      (packsResult.data ?? []).forEach((p: any) => priceMap.set(p.id, Number(p.preco)));
      (tracksResult.data ?? []).forEach((t: any) => priceMap.set(t.id, Number(t.price)));

      let total = 0;
      for (const item of data.items) {
        const price = priceMap.get(item.id);
        if (price === undefined) throw new Error(`Item inválido: ${item.id}`);
        total += price * (item.quantidade || 1);
      }

      const amount = Math.round(total * 100);
      if (amount <= 0) throw new Error("Valor inválido");
      if (amount < 200) {
        throw new Error("O valor mínimo para pagamento (exigido pelo Stripe) é de R$ 2,00. Adicione mais itens ao carrinho.");
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "brl",
        automatic_payment_methods: { enabled: true },
        metadata: { userId: userId ?? "anonymous", validatedAmount: amount.toString() },
      });

      const sbAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: pedido, error: pedidoError } = await sbAdmin.from("pedidos").insert({
        email_cliente: data.email,
        nome_cliente: data.nome,
        valor_total: total,
        status: "pendente",
        stripe_payment_intent_id: paymentIntent.id,
        user_id: userId,
      }).select().single();

      if (pedidoError || !pedido) {
        console.error("Erro ao salvar pedido:", pedidoError);
        throw new Error("Erro ao registrar pedido.");
      }

      // Inserir itens (pack ou track, conforme o tipo)
      const itens = data.items.map((item) => ({
        pedido_id: pedido.id,
        pack_id: item.tipo === "pack" ? item.id : null,
        track_id: item.tipo === "track" ? item.id : null,
        quantidade: item.quantidade,
        preco_unitario: priceMap.get(item.id) || 0,
      }));

      await sbAdmin.from("itens_pedido").insert(itens);

      return { clientSecret: paymentIntent.client_secret };
    } catch (error: unknown) {
      console.error("Stripe error:", error);
      throw new Error(
        error instanceof Error ? error.message || "Erro no pagamento" : "Erro no pagamento",
      );
    }
  });

export const verifyPaymentFn = createServerFn({ method: "POST" })
  .validator((data: { paymentIntentId: string }) => data)
  .handler(async ({ data }) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2024-04-10" as any,
    });

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) throw new Error("Configuração do Supabase ausente no servidor");

    const sbAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    try {
      // 1. Pegar o status do pagamento no Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(data.paymentIntentId);
      
      // 2. Se estiver pago, atualizar o banco de dados
      if (paymentIntent.status === "succeeded") {
        await sbAdmin
          .from("pedidos")
          .update({ status: "pago" })
          .eq("stripe_payment_intent_id", data.paymentIntentId);
      } else {
        return { success: false, status: paymentIntent.status, downloads: [] };
      }

      // 3. Pegar os arquivos (packs comprados)
      const { data: pedido } = await sbAdmin
        .from("pedidos")
        .select("id")
        .eq("stripe_payment_intent_id", data.paymentIntentId)
        .single();
        
      if (!pedido) throw new Error("Pedido não encontrado");

      const { data: itens } = await sbAdmin
        .from("itens_pedido")
        .select(
          "pack_id, track_id, packs ( nome, arquivo_url ), tracks ( title, download_url )",
        )
        .eq("pedido_id", pedido.id);

      const downloads =
        itens?.map((item: any) => {
          if (item.track_id && item.tracks) {
            return {
              nome: item.tracks.title,
              url: item.tracks.download_url || "Link ainda não disponível",
            };
          }
          return {
            nome: item.packs?.nome ?? "Item",
            url: item.packs?.arquivo_url || "Link ainda não disponível",
          };
        }) || [];

      return { success: true, status: paymentIntent.status, downloads };
    } catch (error: unknown) {
      console.error("Verify payment error:", error);
      throw new Error("Erro ao verificar pagamento");
    }
  });
