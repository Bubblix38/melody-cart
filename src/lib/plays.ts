import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Hash SHA-256 via Web Crypto API (disponível em Node e em runtimes edge, como Cloudflare Workers). */
async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Registra 1 audição de uma faixa. Regra: 1 play por IP único por faixa —
 * a mesma pessoa pode ouvir de novo, mas só conta na primeira vez por IP.
 * O IP nunca é salvo em texto puro, só seu hash (SHA-256 + salt do servidor).
 */
export const registerPlayFn = createServerFn({ method: "POST" })
  .validator((data: { trackId: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest();
    const ip =
      request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request?.headers.get("x-real-ip") ||
      "unknown";

    const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "topdj-play-salt";
    const ipHash = await sha256(`${ip}:${salt}`);

    const sbAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // Constraint UNIQUE(track_id, ip_hash) garante 1 contagem por IP único;
    // tentativas repetidas do mesmo IP são ignoradas silenciosamente.
    const { error } = await sbAdmin
      .from("track_plays")
      .insert({ track_id: data.trackId, ip_hash: ipHash })
      .select()
      .maybeSingle();

    if (error && error.code !== "23505") {
      // 23505 = unique_violation (IP já contou essa faixa) — não é erro real.
      console.error("Erro ao registrar play:", error);
    }

    return { ok: true };
  });

export interface PackWithPlays {
  pack_id: string;
  play_count: number;
}

/** Busca a contagem agregada de audições por álbum (soma de todas as faixas). */
export async function getPackPlayCounts(): Promise<Record<string, number>> {
  const db = supabase as unknown as { from: (t: string) => any };
  const { data, error } = await db.from("pack_play_counts").select("pack_id, play_count");
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.pack_id] = row.play_count;
  }
  return counts;
}

/** Busca a contagem agregada de audições por faixa. */
export async function getTrackPlayCounts(trackIds: string[]): Promise<Record<string, number>> {
  if (trackIds.length === 0) return {};
  const db = supabase as unknown as { from: (t: string) => any };
  const { data, error } = await db
    .from("track_play_counts")
    .select("track_id, play_count")
    .in("track_id", trackIds);
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.track_id] = row.play_count;
  }
  return counts;
}
