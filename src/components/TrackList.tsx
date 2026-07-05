import { useState, useEffect, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { fetchTracks, type Track } from "@/lib/tracks";
import { Play, Pause, Heart, Repeat, ShoppingCart, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatPreco } from "@/lib/packs";
import { Button } from "./ui/button";
import { useAudioPlayer, type PlayerTrack } from "@/lib/audio-player";
import { useCart } from "@/lib/cart";
import {
  getTrackLikesCountsBulk,
  getUserLikedTrackIdsBulk,
  getTrackRepostsCountsBulk,
  getUserRepostedTrackIdsBulk,
  likeTrack,
  unlikeTrack,
  repostTrack,
  removeRepostTrack,
} from "@/lib/social";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function TrackList({ packId, coverUrl }: { packId: string; coverUrl?: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { addTrack } = useCart();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ["tracks", packId],
    queryFn: () => fetchTracks(packId),
  });

  const trackIds = tracks.map((t) => t.id);

  // Contadores/estado social buscados em lote para a lista inteira (evita
  // disparar 4 consultas por faixa, o que travaria álbuns com muitas músicas).
  const { data: likesCounts = {} } = useQuery({
    queryKey: ["trackLikesBulk", packId, trackIds],
    queryFn: () => getTrackLikesCountsBulk(trackIds),
    enabled: trackIds.length > 0,
  });
  const { data: likedSet = new Set<string>() } = useQuery({
    queryKey: ["trackLikedBulk", packId, trackIds, session?.user?.id],
    queryFn: () => getUserLikedTrackIdsBulk(trackIds),
    enabled: trackIds.length > 0,
  });
  const { data: repostsCounts = {} } = useQuery({
    queryKey: ["trackRepostsBulk", packId, trackIds],
    queryFn: () => getTrackRepostsCountsBulk(trackIds),
    enabled: trackIds.length > 0,
  });
  const { data: repostedSet = new Set<string>() } = useQuery({
    queryKey: ["trackRepostedBulk", packId, trackIds, session?.user?.id],
    queryFn: () => getUserRepostedTrackIdsBulk(trackIds),
    enabled: trackIds.length > 0,
  });

  const likeMut = useMutation({
    mutationFn: ({ trackId, isLiked }: { trackId: string; isLiked: boolean }) =>
      isLiked ? unlikeTrack(trackId) : likeTrack(trackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackLikesBulk", packId] });
      queryClient.invalidateQueries({ queryKey: ["trackLikedBulk", packId] });
    },
    onError: () => toast.error("Você precisa entrar para curtir."),
  });

  const repostMut = useMutation({
    mutationFn: ({ trackId, isReposted }: { trackId: string; isReposted: boolean }) =>
      isReposted ? removeRepostTrack(trackId) : repostTrack(trackId),
    onSuccess: (_data, { isReposted }) => {
      queryClient.invalidateQueries({ queryKey: ["trackRepostsBulk", packId] });
      queryClient.invalidateQueries({ queryKey: ["trackRepostedBulk", packId] });
      queryClient.invalidateQueries({ queryKey: ["userReposts"] });
      toast.success(isReposted ? "Repost removido." : "Adicionado ao seu perfil!");
    },
    onError: () => toast.error("Você precisa entrar para repostar."),
  });

  const { current, isPlaying, play, toggle } = useAudioPlayer();

  if (isLoading) return <div className="p-4 text-muted-foreground">Carregando faixas...</div>;
  if (tracks.length === 0)
    return <div className="p-4 text-muted-foreground">Nenhuma faixa cadastrada neste álbum.</div>;

  // Monta a fila do player com todas as faixas que têm áudio.
  const playerQueue: PlayerTrack[] = tracks
    .filter((t) => t.audio_url)
    .map((t) => ({
      id: t.id,
      title: t.title,
      audioUrl: t.audio_url,
      coverUrl,
    }));

  function handlePlay(trackId: string) {
    const track = playerQueue.find((t) => t.id === trackId);
    if (!track) return;
    if (current?.id === trackId) {
      toggle();
    } else {
      play(track, playerQueue);
    }
  }

  function requireAuth(action: () => void) {
    if (!session) {
      toast.error("Você precisa entrar na sua conta.");
      navigate({ to: "/login" });
      return;
    }
    action();
  }

  function handleBuyTrack(track: Track) {
    addTrack(track, { genero: "Nacionais", imagem_url: coverUrl ?? null });
    toast.success(`${track.title} adicionada ao carrinho`);
  }

  return (
    <div className="mt-4 flex flex-col w-full">
      {/* Cabeçalho da tabela */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50">
        <div className="w-8 text-center">#</div>
        <div>Título</div>
        <div className="w-12 text-center">
          <Clock className="w-4 h-4 mx-auto" />
        </div>
      </div>

      {/* Lista de faixas */}
      <div className="flex flex-col pt-2">
        {tracks.map((track, index) => (
          <TrackRowItem
            key={track.id}
            track={track}
            index={index}
            isCurrent={current?.id === track.id}
            isPlaying={current?.id === track.id && isPlaying}
            liked={likedSet.has(track.id)}
            likesCount={likesCounts[track.id] ?? 0}
            reposted={repostedSet.has(track.id)}
            repostsCount={repostsCounts[track.id] ?? 0}
            onPlay={() => handlePlay(track.id)}
            onToggleLike={() =>
              requireAuth(() => likeMut.mutate({ trackId: track.id, isLiked: likedSet.has(track.id) }))
            }
            onToggleRepost={() =>
              requireAuth(() =>
                repostMut.mutate({ trackId: track.id, isReposted: repostedSet.has(track.id) }),
              )
            }
            onBuy={() => handleBuyTrack(track)}
          />
        ))}
      </div>
    </div>
  );
}

function formatTime(seconds: number | null) {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const TrackRowItem = memo(function TrackRowItem({
  track,
  index,
  isCurrent,
  isPlaying,
  liked,
  likesCount,
  reposted,
  repostsCount,
  onPlay,
  onToggleLike,
  onToggleRepost,
  onBuy,
}: {
  track: Track;
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  liked: boolean;
  likesCount: number;
  reposted: boolean;
  repostsCount: number;
  onPlay: () => void;
  onToggleLike: () => void;
  onToggleRepost: () => void;
  onBuy: () => void;
}) {
  const hasAudio = !!track.audio_url;

  return (
    <div
      className={cn(
        "group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-md px-4 py-3 transition-colors hover:bg-white/5",
        isCurrent && "bg-primary/10",
      )}
    >
      <div className="w-8 text-center text-muted-foreground relative flex items-center justify-center">
        {hasAudio ? (
          <>
            {/* Espectro (equalizador) enquanto tocar, número quando parado.
                Some apenas no hover, para dar lugar ao botão de play/pause. */}
            <span className="group-hover:hidden">
              {isPlaying ? (
                <span className="flex gap-0.5 items-end h-4">
                  <span
                    className="w-0.5 bg-primary rounded-full animate-[wave_0.9s_ease-in-out_infinite]"
                    style={{ animationDelay: "0s" }}
                  />
                  <span
                    className="w-0.5 bg-primary rounded-full animate-[wave_0.9s_ease-in-out_infinite]"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span
                    className="w-0.5 bg-primary rounded-full animate-[wave_0.9s_ease-in-out_infinite]"
                    style={{ animationDelay: "0.4s" }}
                  />
                </span>
              ) : (
                index + 1
              )}
            </span>
            <button
              onClick={onPlay}
              className="hidden text-foreground hover:scale-110 transition-transform group-hover:flex"
              aria-label={isPlaying ? "Pausar" : "Tocar"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </button>
          </>
        ) : (
          <span>{index + 1}</span>
        )}
      </div>

      <div className="flex flex-col min-w-0 gap-1.5">
        <span className={cn("font-semibold truncate", isCurrent ? "text-primary" : "text-foreground")}>
          {track.title}
        </span>

        {/* Barra de ações estilo SoundCloud: curtir, repost, comprar */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLike}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold transition-colors",
              liked
                ? "text-red-500 border-red-500/40 bg-red-500/10"
                : "text-muted-foreground border-border hover:text-foreground",
            )}
            aria-label={liked ? "Descurtir" : "Curtir"}
          >
            <Heart className={cn("h-3 w-3", liked && "fill-current")} />
            {likesCount}
          </button>

          <button
            onClick={onToggleRepost}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold transition-colors",
              reposted
                ? "text-primary border-primary/40 bg-primary/10"
                : "text-muted-foreground border-border hover:text-foreground",
            )}
            aria-label={reposted ? "Remover repost" : "Repostar"}
            title={reposted ? "Remover do seu perfil" : "Repostar para seu perfil"}
          >
            <Repeat className="h-3 w-3" />
            {repostsCount}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end">
        <span className="hidden sm:block text-xs text-muted-foreground w-12 text-center">
          {formatTime(track.duration)}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={onBuy}
          className="h-7 gap-1 px-2 text-[11px] font-bold text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          title="Comprar apenas esta faixa"
        >
          <ShoppingCart className="h-3 w-3" />
          {formatPreco(track.price)}
        </Button>
      </div>
    </div>
  );
});
