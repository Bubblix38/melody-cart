import React, { useState, useEffect, useRef } from "react";
import { Clock, Play, Pause, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { Pack } from "@/lib/packs";
import { Track } from "@/lib/tracks";
import { useAudioPlayer, type PlayerTrack } from "@/lib/audio-player";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserLikedTrackIdsBulk, likeTrack, unlikeTrack } from "@/lib/social";
import { cn } from "@/lib/utils";

function TrackDuration({ track }: { track: Track }) {
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

  if (!duration) return <span>--:--</span>;
  
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

type SortConfig = {
  key: 'title' | 'album' | 'date';
  direction: 'asc' | 'desc';
} | null;

interface TrackRowProps {
  track: Track;
  index: number;
  pack: Pack;
  isActive: boolean;
  isPlaying: boolean;
  isLiked: boolean;
  gridStyle: React.CSSProperties;
  onPlay: (track: Track) => void;
  onToggleLike: (trackId: string, isLiked: boolean) => void;
  togglePlayer: () => void;
  isPendingLike: boolean;
}

const MemoizedTrackRow = React.memo(({ 
  track, index, pack, isActive, isPlaying, isLiked, gridStyle, onPlay, onToggleLike, togglePlayer, isPendingLike 
}: TrackRowProps) => {
  return (
    <div 
      onDoubleClick={() => onPlay(track)}
      className={cn(
        "group grid gap-4 px-8 py-2 hover:bg-white/10 rounded-md items-center cursor-default transition-colors",
        isActive && "bg-white/5"
      )}
      style={gridStyle}
    >
      {/* Number / Play button */}
      <div className="relative flex items-center justify-center">
        {isActive && isPlaying ? (
          <button onClick={togglePlayer} className="text-spotify-green">
            <Pause fill="currentColor" className="w-4 h-4" />
          </button>
        ) : isActive && !isPlaying ? (
          <>
            <span className="text-base text-spotify-green group-hover:hidden">{index + 1}</span>
            <button onClick={() => onPlay(track)} className="hidden group-hover:block text-white">
              <Play fill="currentColor" className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <span className="text-base group-hover:hidden">{index + 1}</span>
            <button onClick={() => onPlay(track)} className="hidden group-hover:block text-white">
              <Play fill="currentColor" className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Title & Image */}
      <div className="flex items-center gap-3 overflow-hidden pr-2">
        <img 
          src={pack.imagem_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&w=50&h=50&fit=crop"} 
          alt={track.title}
          className="w-10 h-10 object-cover rounded bg-spotify-highlight shrink-0"
        />
        <div className="flex flex-col overflow-hidden">
          <span onClick={() => onPlay(track)} className={cn("font-medium truncate group-hover:underline cursor-pointer", isActive ? "text-spotify-green" : "text-white")}>{track.title}</span>
          <span className="text-sm truncate group-hover:text-white transition-colors cursor-pointer">{pack.dj || "TopDJ Oficial"}</span>
        </div>
      </div>

      {/* Album / Genre */}
      <div className="hidden md:flex items-center overflow-hidden">
        <span className="text-sm truncate hover:underline hover:text-white cursor-pointer">
          {pack.nome || "Pack"}
        </span>
      </div>

      {/* Date Added */}
      <div className="hidden lg:flex items-center overflow-hidden">
        <span className="text-sm truncate">
          {new Date(track.created_at || Date.now()).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      {/* Duration & Actions */}
      <div className="flex items-center justify-end gap-3 text-sm pr-2">
        <button 
          onClick={() => onToggleLike(track.id, isLiked)}
          disabled={isPendingLike}
          className={cn(
            "cursor-pointer hover:scale-110 transition-transform disabled:opacity-50",
            isLiked ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100 text-white hover:text-white"
          )}
        >
          <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
        </button>
        <TrackDuration track={track} />
      </div>
    </div>
  );
});


type SortConfig = {
  key: 'title' | 'album' | 'date';
  direction: 'asc' | 'desc';
} | null;

export function SpotifyTrackTable({ tracks, pack }: SpotifyTrackTableProps) {
  const { play, toggle, current, isPlaying } = useAudioPlayer();
  const queryClient = useQueryClient();

  const trackIds = tracks.map(t => t.id);
  const { data: likedTrackIds = new Set<string>() } = useQuery({
    queryKey: ["likedTracksBulk", trackIds],
    queryFn: () => getUserLikedTrackIdsBulk(trackIds),
    enabled: trackIds.length > 0,
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ trackId, isLiked }: { trackId: string, isLiked: boolean }) => {
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
      // Atualiza também o cache individual usado pelo FixedPlayer
      queryClient.setQueryData(["likedTrack", data.trackId], data.isLiked);
    }
  });

  const handleToggleLike = (trackId: string, isLiked: boolean) => {
    toggleLikeMutation.mutate({ trackId, isLiked });
  };

  // Estados para redimensionamento de colunas
  const [titleWidth, setTitleWidth] = useState<string | number>("4fr");
  const [albumWidth, setAlbumWidth] = useState<string | number>("2fr");
  const [dateWidth, setDateWidth] = useState<string | number>("2fr");

  const titleRef = useRef<HTMLDivElement>(null);
  const albumRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  // Estado para ordenação
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const handleResize = (
    e: React.MouseEvent, 
    ref: React.RefObject<HTMLDivElement>, 
    setWidth: React.Dispatch<React.SetStateAction<string | number>>
  ) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = ref.current?.offsetWidth || 200;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setWidth(Math.max(100, startWidth + deltaX) + "px");
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "default";
    };

    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleSort = (key: 'title' | 'album' | 'date') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Lógica de Ordenação
  const sortedTracks = [...tracks].sort((a, b) => {
    if (!sortConfig) return 0;
    
    let aVal: string | number = "";
    let bVal: string | number = "";

    if (sortConfig.key === 'title') {
      aVal = a.title.toLowerCase();
      bVal = b.title.toLowerCase();
    } else if (sortConfig.key === 'album') {
      aVal = (pack.nome || "").toLowerCase();
      bVal = (pack.nome || "").toLowerCase();
    } else if (sortConfig.key === 'date') {
      aVal = new Date(a.created_at || 0).getTime();
      bVal = new Date(b.created_at || 0).getTime();
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const queue: PlayerTrack[] = sortedTracks.map((t) => ({
    id: t.id,
    title: t.title,
    artist: pack.dj || "TopDJ Oficial",
    audioUrl: t.audio_url,
    coverUrl: pack.imagem_url || "",
  }));

  const handlePlay = (track: Track) => {
    const playerTrack = queue.find((t) => t.id === track.id)!;
    play(playerTrack, queue);
  };

  if (!tracks || tracks.length === 0) {
    return (
      <div className="w-full text-center text-spotify-subtext pt-10 pb-20">
        <p>Nenhuma faixa encontrada neste álbum.</p>
      </div>
    );
  }

  const gridStyle = {
    gridTemplateColumns: `32px minmax(150px, ${titleWidth}) minmax(100px, ${albumWidth}) minmax(100px, ${dateWidth}) minmax(80px, 1fr)`
  };

  return (
    <div className="w-full text-spotify-subtext pb-20 select-none">
      {/* Table Header */}
      <div 
        className="grid gap-4 px-8 py-2 border-b border-white/10 text-xs font-medium uppercase tracking-wider mb-2 sticky top-0 bg-[#121212] z-30 pt-4 group/header"
        style={gridStyle}
      >
        <div className="text-center">#</div>
        
        {/* Título Column */}
        <div className="flex items-center justify-between group/col" ref={titleRef}>
          <div className="flex items-center gap-1 cursor-pointer hover:text-white" onClick={() => handleSort('title')}>
            Título
            {sortConfig?.key === 'title' && (
              sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-spotify-green" /> : <ChevronDown className="w-4 h-4 text-spotify-green" />
            )}
          </div>
          <div 
            className="w-2 h-6 cursor-col-resize opacity-40 hover:opacity-100 hover:bg-white/20 border-r border-white/50 transition-all"
            onMouseDown={(e) => handleResize(e, titleRef, setTitleWidth)}
          />
        </div>

        {/* Álbum Column */}
        <div className="hidden md:flex items-center justify-between group/col" ref={albumRef}>
          <div className="flex items-center gap-1 cursor-pointer hover:text-white" onClick={() => handleSort('album')}>
            Álbum / Gênero
            {sortConfig?.key === 'album' && (
              sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-spotify-green" /> : <ChevronDown className="w-4 h-4 text-spotify-green" />
            )}
          </div>
          <div 
            className="w-2 h-6 cursor-col-resize opacity-40 hover:opacity-100 hover:bg-white/20 border-r border-white/50 transition-all"
            onMouseDown={(e) => handleResize(e, albumRef, setAlbumWidth)}
          />
        </div>

        {/* Date Column */}
        <div className="hidden lg:flex items-center justify-between group/col" ref={dateRef}>
          <div className="flex items-center gap-1 cursor-pointer hover:text-white" onClick={() => handleSort('date')}>
            Adicionada em
            {sortConfig?.key === 'date' && (
              sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-spotify-green" /> : <ChevronDown className="w-4 h-4 text-spotify-green" />
            )}
          </div>
          <div 
            className="w-2 h-6 cursor-col-resize opacity-40 hover:opacity-100 hover:bg-white/20 border-r border-white/50 transition-all"
            onMouseDown={(e) => handleResize(e, dateRef, setDateWidth)}
          />
        </div>

        {/* Clock Column */}
        <div className="flex justify-end pr-8 items-center">
          <Clock className="w-4 h-4" />
        </div>
      </div>

      {/* Table Body */}
      <div className="flex flex-col">
        {sortedTracks.map((track, index) => {
          const isActive = current?.id === track.id;
          const isLiked = likedTrackIds.has(track.id);
          
          return (
            <MemoizedTrackRow
              key={track.id}
              track={track}
              index={index}
              pack={pack}
              isActive={isActive}
              isPlaying={isPlaying}
              isLiked={isLiked}
              gridStyle={gridStyle}
              onPlay={handlePlay}
              onToggleLike={handleToggleLike}
              togglePlayer={toggle}
              isPendingLike={toggleLikeMutation.isPending}
            />
          );
        })}
      </div>
    </div>
  );
}
