import { supabase } from "@/integrations/supabase/client";

export interface Comentario {
  id: string;
  pack_id: string;
  texto: string;
  autor: string;
  created_at: string;
}

export interface Curtida {
  id: string;
  pack_id: string;
  created_at: string;
}

// Comentários
export async function getComments(packId: string): Promise<Comentario[]> {
  // Ignoramos temporariamente tipagem estrita aqui se as tabelas ainda não estiverem regeneradas
  const db = supabase as unknown as { from: (t: string) => any };

  const { data, error } = await db
    .from("comentarios")
    .select("*")
    .eq("pack_id", packId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Comentario[];
}

export async function addComment(
  packId: string,
  texto: string,
  autor: string,
): Promise<Comentario> {
  if (!texto || texto.trim().length === 0) throw new Error("Texto obrigatório");
  if (texto.length > 500) throw new Error("Texto muito longo (máx 500 caracteres)");

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuário não logado");

  const db = supabase as unknown as { from: (t: string) => any };

  const { data, error } = await db
    .from("comentarios")
    .insert({
      pack_id: packId,
      texto: texto.trim(),
      autor: autor || "Anônimo",
      user_id: session.user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Comentario;
}

// Curtidas
export async function getLikesCount(packId: string): Promise<number> {
  const db = supabase as unknown as { from: (t: string) => any };

  const { count, error } = await db
    .from("curtidas")
    .select("*", { count: "exact", head: true })
    .eq("pack_id", packId);

  if (error) throw error;
  return count ?? 0;
}

export async function addLike(packId: string): Promise<string> {
  const db = supabase as unknown as { from: (t: string) => any };

  const { data, error } = await db
    .from("curtidas")
    .insert({ pack_id: packId })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

// Favoritos (Perfil)
export async function getSavedTrackIds(): Promise<string[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return [];

  const db = supabase as unknown as { from: (t: string) => any };
  const { data, error } = await db
    .from("musicas_salvas")
    .select("pack_id")
    .eq("user_id", session.user.id);

  if (error) throw error;
  return data.map((row: any) => row.pack_id);
}

export async function saveTrack(packId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuário não logado");

  const db = supabase as unknown as { from: (t: string) => any };
  const { error } = await db
    .from("musicas_salvas")
    .insert({ user_id: session.user.id, pack_id: packId });

  if (error) throw error;
}

export async function unsaveTrack(packId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuário não logado");

  const db = supabase as unknown as { from: (t: string) => any };
  const { error } = await db
    .from("musicas_salvas")
    .delete()
    .eq("user_id", session.user.id)
    .eq("pack_id", packId);

  if (error) throw error;
}

// ============================================================
// Curtidas por faixa (track_likes)
// ============================================================
export async function getTrackLikesCount(trackId: string): Promise<number> {
  const db = supabase as unknown as { from: (t: string) => any };
  const { count, error } = await db
    .from("track_likes")
    .select("*", { count: "exact", head: true })
    .eq("track_id", trackId);

  if (error) throw error;
  return count ?? 0;
}

export async function hasUserLikedTrack(trackId: string): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return false;

  const db = supabase as unknown as { from: (t: string) => any };
  const { data, error } = await db
    .from("track_likes")
    .select("track_id")
    .eq("track_id", trackId)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function likeTrack(trackId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuário não logado");

  const db = supabase as unknown as { from: (t: string) => any };
  const { error } = await db
    .from("track_likes")
    .insert({ track_id: trackId, user_id: session.user.id });

  if (error) throw error;
}

export async function unlikeTrack(trackId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuário não logado");

  const db = supabase as unknown as { from: (t: string) => any };
  const { error } = await db
    .from("track_likes")
    .delete()
    .eq("track_id", trackId)
    .eq("user_id", session.user.id);

  if (error) throw error;
}

// ============================================================
// Repost por faixa (track_reposts) — cria um atalho no perfil
// ============================================================
export interface RepostedTrack {
  track_id: string;
  created_at: string;
  tracks: {
    id: string;
    title: string;
    audio_url: string;
    pack_id: string;
    packs: { nome: string; imagem_url: string | null; genero: string } | null;
  } | null;
}

export async function getTrackRepostsCount(trackId: string): Promise<number> {
  const db = supabase as unknown as { from: (t: string) => any };
  const { count, error } = await db
    .from("track_reposts")
    .select("*", { count: "exact", head: true })
    .eq("track_id", trackId);

  if (error) throw error;
  return count ?? 0;
}

export async function hasUserRepostedTrack(trackId: string): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return false;

  const db = supabase as unknown as { from: (t: string) => any };
  const { data, error } = await db
    .from("track_reposts")
    .select("track_id")
    .eq("track_id", trackId)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function repostTrack(trackId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuário não logado");

  const db = supabase as unknown as { from: (t: string) => any };
  const { error } = await db
    .from("track_reposts")
    .insert({ track_id: trackId, user_id: session.user.id });

  if (error) throw error;
}

export async function removeRepostTrack(trackId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuário não logado");

  const db = supabase as unknown as { from: (t: string) => any };
  const { error } = await db
    .from("track_reposts")
    .delete()
    .eq("track_id", trackId)
    .eq("user_id", session.user.id);

  if (error) throw error;
}

/** Lista as faixas repostadas pelo usuário logado, mais recentes primeiro. */
export async function getUserReposts(): Promise<RepostedTrack[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return [];

  const db = supabase as unknown as { from: (t: string) => any };
  const { data, error } = await db
    .from("track_reposts")
    .select("track_id, created_at, tracks ( id, title, audio_url, pack_id, packs ( nome, imagem_url, genero ) )")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as RepostedTrack[];
}

// ============================================================
// Versões em lote (evitam N+1 requisições ao renderizar listas
// grandes de faixas, como um álbum inteiro).
// ============================================================
export async function getTrackLikesCountsBulk(
  trackIds: string[],
): Promise<Record<string, number>> {
  if (trackIds.length === 0) return {};
  const db = supabase as unknown as { from: (t: string) => any };
  const { data, error } = await db.from("track_likes").select("track_id").in("track_id", trackIds);
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.track_id] = (counts[row.track_id] ?? 0) + 1;
  }
  return counts;
}

export async function getUserLikedTrackIdsBulk(trackIds: string[]): Promise<Set<string>> {
  if (trackIds.length === 0) return new Set();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return new Set();

  const db = supabase as unknown as { from: (t: string) => any };
  const { data, error } = await db
    .from("track_likes")
    .select("track_id")
    .eq("user_id", session.user.id)
    .in("track_id", trackIds);
  if (error) throw error;

  return new Set((data ?? []).map((row: any) => row.track_id));
}

export async function getTrackRepostsCountsBulk(
  trackIds: string[],
): Promise<Record<string, number>> {
  if (trackIds.length === 0) return {};
  const db = supabase as unknown as { from: (t: string) => any };
  const { data, error } = await db
    .from("track_reposts")
    .select("track_id")
    .in("track_id", trackIds);
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.track_id] = (counts[row.track_id] ?? 0) + 1;
  }
  return counts;
}

export async function getUserRepostedTrackIdsBulk(trackIds: string[]): Promise<Set<string>> {
  if (trackIds.length === 0) return new Set();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return new Set();

  const db = supabase as unknown as { from: (t: string) => any };
  const { data, error } = await db
    .from("track_reposts")
    .select("track_id")
    .eq("user_id", session.user.id)
    .in("track_id", trackIds);
  if (error) throw error;

  return new Set((data ?? []).map((row: any) => row.track_id));
}

// ============================================================
// Comentários ancorados na waveform de uma faixa (track_comments)
// Cada comentário fica marcado no segundo exato da música em que
// foi publicado, estilo SoundCloud.
// ============================================================
export interface TrackComment {
  id: string;
  track_id: string;
  user_id: string;
  content: string;
  position_ratio: number;
  created_at: string;
  autor: string;
  avatar_url: string | null;
}

/** Busca os comentários de uma faixa, já com nome/avatar de quem comentou. */
export async function getTrackComments(trackId: string): Promise<TrackComment[]> {
  const db = supabase as unknown as { from: (t: string) => any };
  const { data, error } = await db
    .from("track_comments")
    .select("id, track_id, user_id, content, position_ratio, created_at")
    .eq("track_id", trackId)
    .order("position_ratio", { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Busca os perfis de quem comentou em uma segunda consulta (evita depender
  // de uma foreign key configurada no schema cache do PostgREST).
  const userIds = Array.from(new Set(data.map((c: any) => c.user_id).filter(Boolean)));
  const profileMap = new Map<string, { apelido: string | null; nome_completo: string | null; avatar_url: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from("perfis")
      .select("id, apelido, nome_completo, avatar_url")
      .in("id", userIds);

    for (const p of profiles ?? []) {
      profileMap.set(p.id, p);
    }
  }

  return data.map((c: any) => {
    const profile = profileMap.get(c.user_id);
    return {
      ...c,
      autor: profile?.apelido || profile?.nome_completo || "Membro TopDJ",
      avatar_url: profile?.avatar_url ?? null,
    };
  });
}

/** Publica um comentário ancorado num ponto relativo (0 a 1) da faixa. */
export async function addTrackComment(
  trackId: string,
  content: string,
  positionRatio: number,
): Promise<void> {
  const text = content.trim();
  if (!text) throw new Error("Comentário vazio");
  if (text.length > 30) throw new Error("Comentário muito longo (máx 30 caracteres)");

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuário não logado");

  const db = supabase as unknown as { from: (t: string) => any };
  const { error } = await db.from("track_comments").insert({
    track_id: trackId,
    user_id: session.user.id,
    content: text,
    position_ratio: Math.min(1, Math.max(0, positionRatio)),
  });

  if (error) throw error;
}

export async function deleteTrackComment(commentId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuário não logado");

  const db = supabase as unknown as { from: (t: string) => any };
  const { error } = await db
    .from("track_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", session.user.id);

  if (error) throw error;
}
