import {
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  PlusCircle,
  Mic2,
  ListMusic,
  Laptop2,
  Maximize2,
  Music2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAudioPlayer } from "@/lib/audio-player";
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
      queryClient.setQueryData(["likedTrack", trackId], newIsLiked);
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

  const title = current?.title ?? "Espresso (Remix)";
  const artist = current?.artist ?? "AVLS";
  const coverUrl = current?.coverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&w=200&h=200&fit=crop";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-black border-t border-[#181818] px-4 select-none">
      
      {/* Mobile Top Progress Line */}
      <div className="absolute top-0 left-0 h-[2px] bg-white/20 w-full md:hidden">
        <div className="h-full bg-[#1fdf64] transition-all" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="w-full h-full flex items-center justify-between gap-4">
        
        {/* 1. Left Side: Track Cover, Title, Artist & Plus Button */}
        <div className="flex w-1/4 max-w-[280px] items-center gap-3 min-w-0">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded bg-white/5 shadow-md">
            {coverUrl ? (
              <img src={coverUrl} alt={title} className="h-full w-full object-cover" />
            ) : (
              <Music2 className="h-5 w-5 text-white/40" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white tracking-tight hover:underline cursor-pointer">
              {title}
            </p>
            <p className="truncate text-xs font-medium text-[#b3b3b3] hover:underline cursor-pointer mt-0.5">
              {artist}
            </p>
          </div>
          <button
            onClick={handleToggleLike}
            className="text-[#b3b3b3] hover:text-white transition-colors shrink-0 p-1 cursor-pointer"
            aria-label="Salvar"
          >
            <PlusCircle className={cn("h-5 w-5", isLiked && "text-[#1fdf64] fill-current")} />
          </button>
        </div>

        {/* 2. Center Side: Controls & Timeline Slider */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-[640px] gap-1.5">
          {/* Controls */}
          <div className="flex items-center gap-5 sm:gap-6">
            <button
              onClick={toggleShuffle}
              className={cn(
                "transition-colors cursor-pointer",
                isShuffle ? "text-[#1fdf64]" : "text-[#b3b3b3] hover:text-white"
              )}
              aria-label="Aleatório"
            >
              <Shuffle className="h-4 w-4" />
            </button>
            
            <button
              onClick={prev}
              className="text-[#b3b3b3] transition-colors hover:text-white cursor-pointer"
              aria-label="Anterior"
            >
              <SkipBack className="h-5 w-5 fill-current" />
            </button>

            {/* Signature Spotify White Play/Pause Button */}
            <button
              onClick={toggle}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-md transition-transform hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
              aria-label={isPlaying ? "Pausar" : "Tocar"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={next}
              className="text-[#b3b3b3] transition-colors hover:text-white cursor-pointer"
              aria-label="Próxima"
            >
              <SkipForward className="h-5 w-5 fill-current" />
            </button>

            <button
              onClick={toggleRepeat}
              className={cn(
                "transition-colors cursor-pointer",
                isRepeat ? "text-[#1fdf64]" : "text-[#b3b3b3] hover:text-white"
              )}
              aria-label="Repetir"
            >
              <Repeat className="h-4 w-4" />
            </button>
          </div>

          {/* Timeline Bar */}
          <div className="hidden sm:flex w-full items-center gap-2 text-xs font-semibold text-[#b3b3b3]">
            <span className="shrink-0 w-9 text-right text-[11px]">{formatTime(currentTime)}</span>
            <div 
              className="relative flex-1 h-1 bg-[#4d4d4d] hover:h-1.5 rounded-full cursor-pointer group flex items-center transition-all"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                handleSeekRatio((e.clientX - rect.left) / rect.width);
              }}
            >
              <div 
                className="h-full bg-white group-hover:bg-[#1fdf64] rounded-full relative"
                style={{ width: `${progress * 100}%` }}
              >
                <div className="hidden group-hover:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-md" />
              </div>
            </div>
            <span className="shrink-0 w-9 text-left text-[11px]">{formatTime(duration || 184)}</span>
          </div>
        </div>

        {/* 3. Right Side: Mic, Queue, Devices, Volume Slider & Fullscreen */}
        <div className="hidden shrink-0 items-center justify-end gap-3 w-1/4 max-w-[220px] md:flex text-[#b3b3b3]">
          <button className="hover:text-white transition-colors cursor-pointer" title="Letra">
            <Mic2 className="h-4 w-4" />
          </button>
          <button className="hover:text-white transition-colors cursor-pointer" title="Fila de reprodução">
            <ListMusic className="h-4 w-4" />
          </button>
          <button className="hover:text-white transition-colors cursor-pointer" title="Conectar a um dispositivo">
            <Laptop2 className="h-4 w-4" />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="hover:text-white transition-colors cursor-pointer"
              aria-label={isMuted ? "Ativar som" : "Silenciar"}
            >
              {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
              className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-[#4d4d4d] accent-[#1fdf64] hover:accent-[#1fdf64]"
            />
          </div>

          <button className="hover:text-white transition-colors cursor-pointer" title="Tela cheia">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
