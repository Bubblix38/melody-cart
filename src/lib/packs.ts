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

export type PackInput = {
  nome: string;
  genero: string;
  preco: number;
  descricao: string | null;
  imagem_url: string | null;
  arquivo_url: string | null;
  destaque: boolean;
};

// Tipos do banco ainda não regenerados; usamos cast controlado.
const db = supabase as unknown as {
  from: (t: string) => any;
};

export async function fetchPacks(): Promise<Pack[]> {
  const { data, error } = await db
    .from("packs")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Pack[];
}

export async function createPack(input: PackInput): Promise<Pack> {
  const { data, error } = await db.from("packs").insert(input).select().single();
  if (error) throw error;
  return data as Pack;
}

export async function updatePack(id: string, input: PackInput): Promise<Pack> {
  const { data, error } = await db
    .from("packs")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Pack;
}

export async function deletePack(id: string): Promise<void> {
  const { error } = await db.from("packs").delete().eq("id", id);
  if (error) throw error;
}

export const GENEROS = ["Pop", "Rock", "Sertanejo", "Eletrônica"] as const;

export function formatPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
