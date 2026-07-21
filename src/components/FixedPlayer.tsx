import {
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  Music2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAudioPlayer } from "@/lib/audio-player";
import { Waveform } from "@/components/Waveform";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hasUserLikedTrack, likeTrack, unlikeTrack } from "@/lib/social";

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function FixedPlayer() {
  const {
    current,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    isRepeat,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
  } = useAudioPlayer();

  const queryClient = useQueryClient();
  const trackId = current?.id;

  const { data: isLiked = false } = useQuery({
    queryKey: ["likedTrack", trackId],
    queryFn: async () => {
      if (!trackId) return false;
      return await hasUserLikedTrack(trackId);
    },
    enabled: !!trackId,
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (currentlyLiked: boolean) => {
      if (!trackId) return false;
      if (currentlyLiked) {
        await unlikeTrack(trackId);
      } else {
        await likeTrack(trackId);
      }
      return !currentlyLiked;
    },
    onSuccess: (newIsLiked) => {
      if (!trackId) return;
      // Atualiza o estado deste player
      queryClient.setQueryData(["likedTrack", trackId], newIsLiked);
      // Atualiza o estado da tabela principal em tempo real!
      queryClient.setQueriesData({ queryKey: ["likedTracksBulk"] }, (old: Set<string> | undefined) => {
        if (!old) return old;
        const newSet = new Set(old);
        if (newIsLiked) newSet.add(trackId);
        else newSet.delete(trackId);
        return newSet;
      });
    }
  });

  const handleToggleLike = () => {
    if (!trackId) return;
    toggleLikeMutation.mutate(isLiked);
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  function handleSeekRatio(ratio: number) {
    if (!current || duration <= 0) return;
    seek(ratio * duration);
  }

  return (
    <div className="fixed bottom-2 md:bottom-0 z-50 h-14 md:h-16 w-[calc(100%-16px)] left-2 md:left-0 md:w-full rounded-lg md:rounded-none overflow-hidden bg-[#5a3630] md:bg-transparent md:glass-nav md:border-t md:border-white/10 px-2 md:px-6 transition-all shadow-xl md:shadow-none">
      
      {/* Barra de Progresso Mobile */}
      <div className="absolute bottom-0 left-0 h-[2px] bg-white/30 w-full md:hidden rounded-b-lg overflow-hidden">
        <div className="h-full bg-white transition-all" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-2 md:gap-10">
        {/* Controls */}
        <div className="flex shrink-0 items-center gap-3 md:gap-5">
          <button
            onClick={prev}
            disabled={!current}
            className="hidden text-white/60 transition-colors hover:text-white disabled:opacity-30 sm:block"
            aria-label="Faixa anterior"
          >
            <SkipBack className="h-4 w-4 md:h-5 md:w-5 fill-current" />
          </button>
          <button
            onClick={toggle}
            disabled={!current}
            className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full md:bg-white text-white md:text-black shadow-none md:shadow-lg transition-transform hover:scale-105 active:scale-95 shrink-0 disabled:opacity-40 disabled:hover:scale-100"
            aria-label={isPlaying ? "Pausar" : "Tocar"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 md:h-5 md:w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 md:h-5 md:w-5 fill-current" />
            )}
          </button>
          <button
            onClick={next}
            disabled={!current}
            className="hidden text-white/60 transition-colors hover:text-white disabled:opacity-30 sm:block"
            aria-label="Próxima faixa"
          >
            <SkipForward className="h-4 w-4 md:h-5 md:w-5 fill-current" />
          </button>
          <button
            onClick={toggleShuffle}
            className={cn(
              "hidden transition-colors lg:block",
              isShuffle ? "text-primary" : "text-white/60 hover:text-white",
            )}
            aria-label="Aleatório"
            aria-pressed={isShuffle}
          >
            <Shuffle className="h-4 w-4" />
          </button>
          <button
            onClick={toggleRepeat}
            className={cn(
              "hidden transition-colors lg:block",
              isRepeat ? "text-primary" : "text-white/60 hover:text-white",
            )}
            aria-label="Repetir"
            aria-pressed={isRepeat}
          >
            <Repeat className="h-4 w-4" />
          </button>
        </div>

        {/* Current Track Info (Moved to left on mobile) */}
        <div className="flex flex-1 md:flex-none md:w-48 shrink-0 items-center gap-2 md:gap-3 min-w-0 order-first md:order-none cursor-pointer">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-white/5 shadow-md">
            {current?.coverUrl ? (
              <img src={current.coverUrl} alt={current.title} className="h-full w-full object-cover" />
            ) : (
              <Music2 className="h-4 w-4 text-white/40" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm md:text-xs font-bold text-white tracking-tight">
              {current?.title ?? "Nada tocando"}
            </p>
            <p className="truncate text-[11px] md:text-[9px] font-medium md:font-bold md:uppercase tracking-wide md:tracking-widest text-white/70 md:text-white/40">
              {current?.artist ?? "TopDJ"}
            </p>
          </div>
        </div>

        {/* Progress Bar (Waveform Style) - Hidden on Mobile */}
        <div className="hidden md:flex min-w-0 flex-1 items-center gap-2 md:gap-4 text-[9px] md:text-[10px] font-bold font-mono">
          <span className="shrink-0 text-primary">{formatTime(currentTime)}</span>
          <Waveform
            progress={progress}
            height={28}
            barCount={72}
            seed={2}
            className="flex-1 group"
            onSeek={handleSeekRatio}
          />
          <span className="shrink-0 text-white/40">{formatTime(duration)}</span>
        </div>

        {/* Heart icon (Moved next to play on mobile) */}
        <div className="flex items-center">
          <button
            onClick={handleToggleLike}
            disabled={toggleLikeMutation.isPending}
            className={cn(
              "transition-colors shrink-0 disabled:opacity-50",
              isLiked ? "text-primary" : "text-white/70 md:text-white/40 hover:text-white",
            )}
            aria-label="Curtir"
          >
            <Heart className={cn("h-5 w-5 md:h-4 md:w-4", isLiked && "fill-current")} />
          </button>
        </div>

        {/* Volume */}
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <button
            onClick={toggleMute}
            className="text-white/60 transition-colors hover:text-white"
            aria-label={isMuted ? "Ativar som" : "Silenciar"}
          >
            {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
            className="h-1 w-16 md:w-20 cursor-pointer appearance-none rounded-full bg-white/10 accent-primary"
          />
        </div>
      </div>
    </div>
  );
}
