import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Play,
  Pause,
  Heart,
  Repeat,
  Share,
  MoreHorizontal,
  ShoppingCart,
  Send,
  User,
} from "lucide-react";
import { toast } from "sonner";
import WaveSurfer from "wavesurfer.js";
import { useNavigate } from "@tanstack/react-router";
import type { Pack } from "@/lib/packs";
import { formatPreco } from "@/lib/packs";
import { packImage } from "@/lib/pack-images";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { TrackList } from "@/components/TrackList";
import {
  getComments,
  addComment,
  getLikesCount,
  addLike,
  getSavedTrackIds,
  saveTrack,
  unsaveTrack,
} from "@/lib/social";
import { supabase } from "@/integrations/supabase/client";

// URL pública para teste de áudio (livre de direitos e compatível com CORS)
const TEST_AUDIO_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

export function TrackRow({ pack }: { pack: Pack }) {
  const { addItem } = useCart();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // --- WaveSurfer State ---
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [isLoading, setIsLoading] = useState(true);

  // --- User Session ---
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
  }, []);

  // --- Social State (Persistent) ---
  const [hasLikedLocal, setHasLikedLocal] = useState(false);

  // Verificar no localStorage se o usuário já curtiu esta faixa
  useEffect(() => {
    const likedTracks = JSON.parse(localStorage.getItem("liked_tracks") || "[]");
    if (likedTracks.includes(pack.id)) {
      setHasLikedLocal(true);
    }
  }, [pack.id]);

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", pack.id],
    queryFn: () => getComments(pack.id),
  });

  const { data: likesCount = 0 } = useQuery({
    queryKey: ["likes", pack.id],
    queryFn: () => getLikesCount(pack.id),
  });

  // --- Saved Tracks ---
  const { data: savedIds = [] } = useQuery({
    queryKey: ["savedTrackIds"],
    queryFn: getSavedTrackIds,
    enabled: !!user,
  });
  const isSaved = savedIds.includes(pack.id);

  const saveMut = useMutation({
    mutationFn: () => saveTrack(pack.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedTrackIds"] });
      toast.success("Salvo no seu perfil!");
    },
  });

  const unsaveMut = useMutation({
    mutationFn: () => unsaveTrack(pack.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedTrackIds"] });
      toast.success("Removido do perfil");
    },
  });

  const commentMut = useMutation({
    mutationFn: (texto: string) => addComment(pack.id, texto, user?.user_metadata?.name || "Membro TopDJ"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", pack.id] });
      toast.success("Comentário publicado!");
    },
    onError: () => toast.error("Erro ao enviar comentário"),
  });

  const likeMut = useMutation({
    mutationFn: () => addLike(pack.id),
    onSuccess: () => {
      // Salvar no localStorage para não deixar curtir novamente
      const likedTracks = JSON.parse(localStorage.getItem("liked_tracks") || "[]");
      if (!likedTracks.includes(pack.id)) {
        likedTracks.push(pack.id);
        localStorage.setItem("liked_tracks", JSON.stringify(likedTracks));
      }
      setHasLikedLocal(true);
      queryClient.invalidateQueries({ queryKey: ["likes", pack.id] });
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "rgba(249, 115, 22, 0.4)", // Laranja semi-transparente
        progressColor: "rgba(249, 115, 22, 1)", // Laranja sólido
        cursorColor: "transparent",
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 56,
        url: TEST_AUDIO_URL,
      });

      wavesurfer.current.on("ready", (d) => {
        setDuration(formatTime(d));
        setIsLoading(false);
      });

      wavesurfer.current.on("audioprocess", (t) => {
        setCurrentTime(formatTime(t));
      });

      wavesurfer.current.on("play", () => setIsPlaying(true));
      wavesurfer.current.on("pause", () => setIsPlaying(false));
      wavesurfer.current.on("finish", () => setIsPlaying(false));

      return () => {
        wavesurfer.current?.destroy();
      };
    }
  }, []);

  const handlePlayPause = () => {
    wavesurfer.current?.playPause();
  };

  function handleAdd() {
    addItem(pack);
    toast.success(`${pack.nome} adicionado ao carrinho`);
  }

  function handleLike() {
    if (hasLikedLocal) {
      toast.info("Você já deixou o seu curtir nesta faixa! ❤️");
      return;
    }
    likeMut.mutate();
  }

  function handleSave() {
    if (!user) {
      toast.error("Você precisa criar uma conta para salvar músicas!");
      navigate({ to: "/login" });
      return;
    }

    if (isSaved) {
      unsaveMut.mutate();
    } else {
      saveMut.mutate();
    }
  }

  function handleComment(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem("texto") as HTMLInputElement;
    if (input.value.trim()) {
      commentMut.mutate(input.value.trim());
      form.reset();
    }
  }

  return (
    <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border border-border shadow-[var(--shadow-card)] transition-colors hover:border-primary/30">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Cover Image */}
        <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-lg shadow-md sm:h-48 sm:w-48 group">
          <img
            src={packImage(pack.imagem_url, pack.genero)}
            alt={pack.nome}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {pack.destaque && (
            <span className="absolute left-2 top-2 rounded-full bg-[image:var(--gradient-primary)] px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">
              Destaque
            </span>
          )}
        </div>

        {/* Track Content */}
        <div className="flex flex-1 flex-col justify-between min-w-0">
          {/* Header: Play button and Title */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 gap-3 sm:gap-4">
              <button
                onClick={handlePlayPause}
                disabled={isLoading}
                className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)] hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" />
                ) : (
                  <Play className="ml-1 h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" />
                )}
              </button>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  DJ Bubblix
                </span>
                <h3 className="truncate text-lg sm:text-xl font-bold">{pack.nome}</h3>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-muted/80 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold whitespace-nowrap">
              #{pack.genero}
            </span>
          </div>

          {/* Waveform Area */}
          <div className="mt-2 flex flex-col gap-2 relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground z-10">
                Carregando áudio...
              </div>
            )}
            <div
              ref={waveformRef}
              className={`w-full h-14 ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
            />
            <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-background/80 px-1 rounded text-foreground/80 z-10 pointer-events-none">
              {currentTime} / {duration}
            </span>
          </div>

          {/* Comment Input */}
          <form
            onSubmit={handleComment}
            className="mt-2 flex items-center gap-2 rounded-sm bg-muted/40 p-1 border border-transparent focus-within:border-border transition-colors"
          >
            <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-primary/20">
              <div className="flex h-full w-full items-center justify-center text-primary">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} className="w-full h-full rounded-full" />
                ) : (
                  <User className="h-3 w-3" />
                )}
              </div>
            </div>
            <input
              type="text"
              name="texto"
              placeholder="Escreva um comentário"
              className="flex-1 bg-transparent px-2 text-xs sm:text-sm outline-none placeholder:text-muted-foreground/70"
              required
              disabled={commentMut.isPending}
            />
            <button
              type="submit"
              disabled={commentMut.isPending}
              className="p-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </form>

          {/* Action Bar */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLike}
                disabled={likeMut.isPending}
                className={`h-7 sm:h-8 gap-1 sm:gap-1.5 px-2 sm:px-2.5 text-[10px] sm:text-xs transition-colors ${
                  hasLikedLocal
                    ? "text-red-500 border-red-500/50 hover:bg-red-500/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Heart
                  className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${hasLikedLocal ? "fill-current" : ""}`}
                />
                {likesCount + (hasLikedLocal && !likeMut.isSuccess ? 0 : 0)}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={saveMut.isPending || unsaveMut.isPending}
                className={`h-7 sm:h-8 gap-1 sm:gap-1.5 px-2 sm:px-2.5 text-[10px] sm:text-xs transition-colors ${
                  isSaved
                    ? "text-primary border-primary/50 hover:bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={isSaved ? "Remover do Perfil" : "Salvar no Perfil"}
              >
                <Repeat className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {isSaved ? "Salvo" : "Salvar"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 sm:h-8 gap-1 sm:gap-1.5 px-2 sm:px-2.5 text-[10px] sm:text-xs text-muted-foreground hover:text-foreground"
              >
                <Share className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Compartilhar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>

            {/* Cart Button */}
            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <span className="text-sm sm:text-lg font-extrabold text-gradient whitespace-nowrap">
                {formatPreco(pack.preco)}
              </span>
              <Button
                onClick={handleAdd}
                size="sm"
                className="h-7 sm:h-8 bg-[image:var(--gradient-primary)] px-2 sm:px-3 text-[10px] sm:text-xs font-bold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90"
                title="Comprar o álbum completo"
              >
                <ShoppingCart className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Comprar Álbum
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Render Comments List if there are any */}
      {comments.length > 0 && (
        <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-border/50">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
            {comments.length} Comentário{comments.length !== 1 ? "s" : ""}
          </h4>
          <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2 items-start text-sm">
                <div className="h-6 w-6 mt-0.5 shrink-0 overflow-hidden rounded-full bg-secondary/50 flex items-center justify-center text-[10px] font-bold text-secondary-foreground">
                  {comment.autor.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-xs text-muted-foreground">
                    {comment.autor}
                  </span>
                  <p className="text-foreground text-sm">{comment.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Faixas do Álbum */}
      <div className="mt-4 border-t border-border/50 pt-2">
        <TrackList packId={pack.id} coverUrl={packImage(pack.imagem_url, pack.genero)} />
      </div>
    </div>
  );
}
