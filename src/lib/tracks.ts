import { supabase } from "@/integrations/supabase/client";

export type Track = {
  id: string;
  pack_id: string;
  title: string;
  audio_url: string;
  download_url: string | null;
  price: number;
  duration: number | null;
  created_at: string;
};

export type TrackInput = Omit<Track, "id" | "created_at">;

export async function fetchTracks(packId?: string): Promise<Track[]> {
  let query = supabase.from("tracks" as any).select("*").order("created_at", { ascending: false });
  if (packId) {
    query = query.eq("pack_id", packId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as Track[];
}

export async function createTrack(input: TrackInput): Promise<Track> {
  const { data, error } = await supabase.from("tracks" as any).insert(input).select().single();
  if (error) throw error;
  return data as unknown as Track;
}

export async function updateTrack(id: string, input: Partial<TrackInput>): Promise<Track> {
  const { data, error } = await supabase.from("tracks" as any).update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as unknown as Track;
}

export async function deleteTrack(id: string): Promise<void> {
  const { error } = await supabase.from("tracks" as any).delete().eq("id", id);
  if (error) throw error;
}
