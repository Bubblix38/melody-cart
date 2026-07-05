import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export interface Pack {
  id: string;
  nome: string;
  genero: string;
  preco: number;
  descricao: string | null;
  imagem_url: string | null;
  arquivo_url: string | null;
  destaque: boolean;
  created_at: string;
  updated_at: string;
}

const ALLOWED_IMAGE_DOMAINS = ["supabase.co", "amazonaws.com", "cloudinary.com", "imgur.com"];

function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_IMAGE_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

const PackSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(200, "Nome muito longo"),
  genero: z.enum(["Nacionais", "Rock", "Sertanejo", "Eletrônica", "Funk"]),
  preco: z.number().positive("Preço deve ser maior que zero").multipleOf(0.01),
  descricao: z.string().max(1000, "Descrição muito longa").nullable().optional(),
  imagem_url: z
    .string()
    .url("URL inválida")
    .refine((url) => isValidImageUrl(url), "Domínio de imagem não permitido")
    .nullable()
    .optional()
    .or(z.literal("")),
  arquivo_url: z.string().url("URL de download inválida").nullable().optional().or(z.literal("")),
  destaque: z.boolean(),
});

export type PackInput = z.infer<typeof PackSchema>;

// Tipos do banco ainda não regenerados; usamos cast controlado.
const db = supabase as unknown as {
  from: (t: string) => any;
};

function sanitizeInput(input: unknown): PackInput {
  const validated = PackSchema.parse(input);
  return {
    ...validated,
    descricao: validated.descricao?.trim() || null,
    imagem_url: validated.imagem_url === "" ? null : validated.imagem_url,
    arquivo_url: validated.arquivo_url === "" ? null : validated.arquivo_url,
  };
}

export async function fetchPacks(): Promise<Pack[]> {
  const { data, error } = await db
    .from("packs")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Pack[];
}

export async function createPack(input: PackInput): Promise<Pack> {
  const sanitized = sanitizeInput(input);
  const { data, error } = await db.from("packs").insert(sanitized).select().single();
  if (error) throw new Error("Erro ao criar pack");
  return data as Pack;
}

export async function updatePack(id: string, input: PackInput): Promise<Pack> {
  const sanitized = sanitizeInput(input);
  const { data, error } = await db.from("packs").update(sanitized).eq("id", id).select().single();
  if (error) throw new Error("Erro ao atualizar pack");
  return data as Pack;
}

export async function deletePack(id: string): Promise<void> {
  const { error } = await db.from("packs").delete().eq("id", id);
  if (error) throw error;
}

const COVER_BUCKET = "capas-packs";
const ALLOWED_COVER_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const COVER_EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Faz upload de uma imagem de capa para o bucket público de Storage.
 * Escrita restrita a admins via política de RLS do próprio bucket.
 */
export async function uploadPackCover(file: File): Promise<string> {
  if (!ALLOWED_COVER_TYPES.includes(file.type)) {
    throw new Error("Formato não permitido. Use JPEG, PNG, WebP ou GIF.");
  }
  if (file.size > MAX_COVER_SIZE) {
    throw new Error("Imagem muito grande. Máximo 5MB.");
  }

  const fileExt = COVER_EXT_MAP[file.type];
  const filePath = `${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from(COVER_BUCKET).upload(filePath, file);
  if (uploadError) throw new Error("Erro ao enviar imagem: " + uploadError.message);

  const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export const GENEROS = ["Nacionais", "Rock", "Sertanejo", "Eletrônica", "Funk"] as const;

export function formatPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
