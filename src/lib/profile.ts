import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  apelido: string | null;
  nome_completo: string | null;
  cidade: string | null;
  estado: string | null;
  avatar_url: string | null;
  banner_url: string | null;
}

export async function getProfile(): Promise<UserProfile | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const db = supabase as unknown as { from: (t: string) => any };
  const { data, error } = await db
    .from("perfis")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar perfil:", error);
    return null;
  }

  return data;
}

export async function updateProfile(profileData: Partial<UserProfile>): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Não autenticado");

  const db = supabase as unknown as { from: (t: string) => any };
  const { error } = await db.from("perfis").upsert({
    id: session.user.id,
    ...profileData,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function uploadImage(file: File, bucket: "avatars" | "banners"): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Não autenticado");

  // Validar tipo de arquivo
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Formato não permitido. Use JPEG, PNG, WebP ou GIF.");
  }

  // Validar tamanho (máx 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("Imagem muito grande. Máximo 5MB.");
  }

  // Sanitizar extensão
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const fileExt = extMap[file.type];
  const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return data.publicUrl;
}
