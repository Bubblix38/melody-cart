import React, { useState, useEffect } from "react";
import { Clock, Play, Pause, Heart, MoreVertical, ArrowDownToLine, CheckCircle2 } from "lucide-react";
import { Pack } from "@/lib/packs";
import { Track } from "@/lib/tracks";
import { useAudioPlayer, type PlayerTrack } from "@/lib/audio-player";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserLikedTrackIdsBulk, likeTrack, unlikeTrack } from "@/lib/social";
import { cn } from "@/lib/utils";
import { cacheAudio, isAudioCached } from "@/lib/offline-storage";

function TrackDuration({ track, fallbackDuration }: { track: Track; fallbackDuration?: string }) {
  const [duration, setDuration] = useState<number | null>(track.duration);

  useEffect(() => {
    if (track.duration) return;
    const audio = new Audio(track.audio_url);
    const onLoadedMetadata = () => {
      if (audio.duration && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.src = "";
    };
  }, [track]);

  if (fallbackDuration) return <span>{fallbackDuration}</span>;
  if (!duration) return <span>2:42</span>;
  
  return (
    <span>
      {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
    </span>
  );
}

interface SpotifyTrackTableProps {
  tracks: Track[];
  pack: Pack;
}

const DEFAULT_DEMO_TRACKS: Track[] = [
  { id: "t1", title: "poposão", audio_url: "", pack_id: "p1", bpm: 130, key: "Am", created_at: "2025-05-23" },
  { id: "t2", title: "157 🅴", audio_url: "", pack_id: "p1", bpm: 132, key: "Fm", created_at: "2024-12-15" },
  { id: "t3", title: "CHEGOU 3 🅴", audio_url: "", pack_id: "p1", bpm: 128, key: "Gm", created_at: "2024-12-15" },
  { id: "t4", title: "Brazilian - Radio Edit", audio_url: "", pack_id: "p1", bpm: 126, key: "Dm", created_at: "2026-06-02" },
  { id: "t5", title: "Brazilian Sky 🅴", audio_url: "", pack_id: "p1", bpm: 130, key: "Em", created_at: "2026-05-28" },
  { id: "t6", title: "feel like (ooh)", audio_url: "", pack_id: "p1", bpm: 124, key: "Bm", created_at: "2025-10-03" },
  { id: "t7", title: "Chapéu - Wealstarcks Remix", audio_url: "", pack_id: "p1", bpm: 134, key: "Cm", created_at: "2026-06-02" },
  { id: "t8", title: "Craque", audio_url: "", pack_id: "p1", bpm: 128, key: "Fm", created_at: "2026-06-02" },
  { id: "t9", title: "Praia", audio_url: "", pack_id: "p1", bpm: 125, key: "Am", created_at: "2026-06-02" },
  { id: "t10", title: "Mas, Que Nada / Oba, Lá Vem Ela", audio_url: "", pack_id: "p1", bpm: 132, key: "Dm", created_at: "2026-03-08" },
];

const ARTISTS_MAP: Record<string, string> = {
  t1: "saint hills",
  t2: "Bronka, Q-Rush",
  t3: "shonci, Mc Magrinho",
  t4: "Gramophonedzie",
  t5: "Demm Deep, Junes UB",
  t6: "saint hills",
  t7: "Ron Puma, Wealstarcks",
  t8: "VHOOR",
  t9: "Ron Puma",
  t10: "Syon Trio",
};

const ALBUMS_MAP: Record<string, string> = {
  t1: "poposão",
  t2: "Electric Baile",
  t3: "CHEGOU 3",
  t4: "Brazillian",
  t5: "Tracks of the Blue S...",
  t6: "feel like (ooh)",
  t7: "Chapéu",
  t8: "BRAZILLIAN BOOGIE",
  t9: "Praia",
  t10: "Pack de Verão, Vol. 2",
};

const DATES_MAP: Record<string, string> = {
  t1: "23 de mai. de 2025",
  t2: "15 de dez. de 2024",
  t3: "15 de dez. de 2024",
  t4: "2 de jun. de 2026",
  t5: "28 de mai. de 2026",
  t6: "3 de out. de 2025",
  t7: "2 de jun. de 2026",
  t8: "2 de jun. de 2026",
  t9: "2 de jun. de 2026",
  t10: "8 de mar. de 2026",
};

const DURATIONS_MAP: Record<string, string> = {
  t1: "1:47",
  t2: "2:55",
  t3: "2:39",
  t4: "2:39",
  t5: "3:19",
  t6: "2:15",
  t7: "2:40",
  t8: "2:27",
  t9: "3:13",
  t10: "2:42",
};

export function SpotifyTrackTable({ tracks = [], pack }: SpotifyTrackTableProps) {
  const displayTracks = tracks.length > 0 ? tracks : DEFAULT_DEMO_TRACKS;
  const { play, toggle, current, isPlaying } = useAudioPlayer();
  const queryClient = useQueryClient();

  const trackIds = displayTracks.map(t => t.id);
  const { data: likedTrackIds = new Set<string>() } = useQuery({
    queryKey: ["likedTracksBulk", trackIds],
    queryFn: () => getUserLikedTrackIdsBulk(trackIds),
    enabled: trackIds.length > 0,
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ trackId, isLiked }: { trackId: string; isLiked: boolean }) => {
      if (isLiked) {
        await unlikeTrack(trackId);
      } else {
        await likeTrack(trackId);
      }
      return { trackId, isLiked: !isLiked };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["likedTracksBulk", trackIds], (old: Set<string> | undefined) => {
        const newSet = new Set(old || []);
        if (data.isLiked) {
          newSet.add(data.trackId);
        } else {
          newSet.delete(data.trackId);
        }
        return newSet;
      });
      queryClient.setQueryData(["likedTrack", data.trackId], data.isLiked);
    }
  });

  const handleToggleLike = (trackId: string, isLiked: boolean) => {
    toggleLikeMutation.mutate({ trackId, isLiked });
  };

  const queue: PlayerTrack[] = displayTracks.map((t) => ({
    id: t.id,
    title: t.title,
    artist: ARTISTS_MAP[t.id] || pack?.dj || "saint hills",
    audioUrl: t.audio_url,
    coverUrl: pack?.imagem_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&w=200&h=200&fit=crop",
  }));

  const handlePlay = (track: Track) => {
    const playerTrack = queue.find((t) => t.id === track.id) || {
      id: track.id,
      title: track.title,
      artist: ARTISTS_MAP[track.id] || pack?.dj || "saint hills",
      audioUrl: track.audio_url,
      coverUrl: pack?.imagem_url || "",
    };
    play(playerTrack, queue);
  };

  return (
    <div className="w-full text-[#b3b3b3] pb-24 select-none px-4 md:px-8 font-sans">
      {/* Table Header Row (Spotify Official Columns: #, Título, Álbum, Adicionada em, Clock icon) */}
      <div className="grid grid-cols-[32px_5fr_4fr_3fr_60px] items-center gap-4 px-4 py-2 border-b border-white/10 text-xs font-bold text-[#b3b3b3] uppercase tracking-wider sticky top-0 bg-[#121212] z-30 mb-2">
        <div className="text-center font-normal">#</div>
        <div className="hover:text-white cursor-pointer">Título</div>
        <div className="hidden md:block hover:text-white cursor-pointer">Álbum</div>
        <div className="hidden lg:block hover:text-white cursor-pointer">Adicionada em</div>
        <div className="flex justify-end pr-2"><Clock className="w-4 h-4" /></div>
      </div>

      {/* Table Rows */}
      <div className="flex flex-col gap-0.5">
        {displayTracks.map((track, index) => {
          const isActive = current?.id === track.id;
          const isLiked = likedTrackIds.has(track.id);
          const artistName = ARTISTS_MAP[track.id] || pack?.dj || "saint hills";
          const albumName = ALBUMS_MAP[track.id] || pack?.nome || "BRASILIAN ELECTRONIC 2026";
          const dateAdded = DATES_MAP[track.id] || "2 de jun. de 2026";
          const trackTime = DURATIONS_MAP[track.id];

          return (
            <div 
              key={track.id}
              onDoubleClick={() => handlePlay(track)}
              className={cn(
                "group grid grid-cols-[32px_5fr_4fr_3fr_60px] items-center gap-4 px-4 py-2 hover:bg-white/10 rounded-md cursor-default transition-colors text-sm font-medium",
                isActive && "bg-white/10"
              )}
            >
              {/* Number / Play button */}
              <div className="flex items-center justify-center font-normal text-[#b3b3b3]">
                {isActive && isPlaying ? (
                  <button onClick={toggle} className="text-[#1fdf64]">
                    <Pause fill="currentColor" className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <span className={cn("group-hover:hidden", isActive ? "text-[#1fdf64] font-bold" : "")}>
                      {index + 1}
                    </span>
                    <button onClick={() => handlePlay(track)} className="hidden group-hover:block text-white">
                      <Play fill="currentColor" className="w-4 h-4 ml-0.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Título Column: Title in bold white + Artist below in gray (Spotify Official Layout) */}
              <div className="flex flex-col overflow-hidden pr-2">
                <span className={cn("truncate font-bold text-sm", isActive ? "text-[#1fdf64]" : "text-white")}>
                  {track.title}
                </span>
                <span className="truncate text-xs text-[#b3b3b3] group-hover:text-white transition-colors cursor-pointer mt-0.5 font-normal">
                  {artistName}
                </span>
              </div>

              {/* Álbum */}
              <div className="hidden md:flex items-center overflow-hidden">
                <span className="text-xs text-[#b3b3b3] truncate group-hover:text-white transition-colors cursor-pointer">
                  {albumName}
                </span>
              </div>

              {/* Date Added */}
              <div className="hidden lg:flex items-center overflow-hidden">
                <span className="text-xs text-[#b3b3b3] truncate">
                  {dateAdded}
                </span>
              </div>

              {/* Duration & Like Actions */}
              <div className="flex items-center justify-end gap-3 text-xs text-[#b3b3b3] pr-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleToggleLike(track.id, isLiked); }}
                  className={cn(
                    "cursor-pointer",
                    isLiked ? "text-[#1fdf64]" : "opacity-0 group-hover:opacity-100 text-[#b3b3b3] hover:text-white"
                  )}
                >
                  <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                </button>

                <div className="w-10 text-right font-normal">
                  <TrackDuration track={track} fallbackDuration={trackTime} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
