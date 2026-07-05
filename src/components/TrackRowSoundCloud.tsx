import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Pause, Heart, Repeat, Share, ShoppingCart, MessageSquare, PlayCircle, Send, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Pack } from "@/lib/packs";
import { useCart } from "@/lib/cart";
import { getLikesCount, addLike, getTrackComments, addTrackComment } from "@/lib/social";
import { fetchTracks } from "@/lib/tracks";
import { packImage } from "@/lib/pack-images";
import { supabase } from "@/integrations/supabase/client";
import { useAudioPlayer, type PlayerTrack } from "@/lib/audio-player";
import { Waveform, type WaveformCommentMarker } from "@/components/Waveform";

const COMMENT_MAX_LENGTH = 30;

interface TrackRowSoundCloudProps {
  pack: Pack;
  variant?: "spotlight" | "regular";
}

/**
 * Formulário de comentário extraído como componente de nível de módulo.
 * Importante: NÃO declarar isso dentro de TrackRowSoundCloud — se fosse uma
 * função criada a cada render, o React desmontaria e remontaria o <input>
 * em toda tecla digitada, fazendo o campo perder o foco constantemente.
 */
function CommentForm({
  session,
  value,
  onChange,
  onSubmit,
  isSubmitting,
}: {
  session: any;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex items-center gap-2 rounded-md bg-white/5 p-1 border border-transparent focus-within:border-primary/50 transition-colors mt-2"
    >
      <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white/10 flex items-center justify-center">
        {session?.user?.user_metadata?.avatar_url ? (
          <img src={session.user.user_metadata.avatar_url} className="h-full w-full object-cover" />
        ) : (
          <User className="h-3 w-3 text-white/40" />
        )}
      </div>
      <input
        name="texto"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
        placeholder="Comente no momento exato da música..."
        maxLength={COMMENT_MAX_LENGTH}
        className="flex-1 bg-transparent px-2 text-xs outline-hidden placeholder:text-white/20 text-white"
      />
      <span className="text-[10px] text-white/20 tabular-nums pr-1">
        {value.length}/{COMMENT_MAX_LENGTH}
      </span>
      <button
        type="submit"
        disabled={isSubmitting || !value.trim()}
        className="p-1.5 text-white/40 hover:text-primary transition-colors disabled:opacity-30"
      >
        <Send className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}

export function TrackRowSoundCloud({ pack, variant = "regular" }: TrackRowSoundCloudProps) {
  const { addItem } = useCart();
  const queryClient = useQueryClient();
  const { current, isPlaying, currentTime, duration, play, toggle, seek } = useAudioPlayer();

  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState("");

  // --- Session ---
  const [session, setSession] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  // --- Faixas reais do álbum (para tocar de verdade) ---
  const { data: tracks = [], isLoading: tracksLoading } = useQuery({
    queryKey: ["tracks", pack.id],
    queryFn: () => fetchTracks(pack.id),
  });

  const coverUrl = packImage(pack.imagem_url, pack.genero);
  const playableTracks = tracks.filter((t) => t.audio_url);
  const spotlightTrack = playableTracks[0];
  // Considera "tocando este álbum" se a faixa atual do player pertence a
  // qualquer uma das faixas deste pack — não só a primeira. Assim, ao trocar
  // de faixa (próxima, ou escolher outra na lista), a waveform continua
  // acompanhando o progresso corretamente.
  const isCurrent = !!current && playableTracks.some((t) => t.id === current.id);
  const isThisPlaying = isCurrent && isPlaying;
  const progress = isCurrent && duration > 0 ? currentTime / duration : 0;

  // Faixa "exibida" nesta waveform: a que está tocando agora (se pertencer a
  // este álbum), senão a primeira faixa como padrão. Os comentários
  // precisam seguir essa faixa — nunca ficar travados na primeira, senão o
  // comentário de uma música aparece "colado" em todas as outras ao trocar.
  const displayedTrack = isCurrent ? playableTracks.find((t) => t.id === current!.id) : spotlightTrack;

  // --- Comentários ancorados na waveform da faixa exibida ---
  const { data: trackComments = [] } = useQuery({
    queryKey: ["trackComments", displayedTrack?.id],
    queryFn: () => getTrackComments(displayedTrack!.id),
    enabled: !!displayedTrack,
  });

  const waveformMarkers: WaveformCommentMarker[] = trackComments.map((c) => ({
    id: c.id,
    position_ratio: c.position_ratio,
    autor: c.autor,
    avatar_url: c.avatar_url,
    content: c.content,
  }));

  // --- Data ---
  const { data: likesCount = 0 } = useQuery({
    queryKey: ["likes", pack.id],
    queryFn: () => getLikesCount(pack.id),
  });

  // --- Mutations ---
  const likeMut = useMutation({
    mutationFn: () => addLike(pack.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["likes", pack.id] });
      toast.success("Música curtida! ❤️");
    },
  });

  const commentMut = useMutation({
    mutationFn: (texto: string) => {
      if (!displayedTrack) throw new Error("Nenhuma faixa disponível");
      // Ancora o comentário no ponto exato da faixa em que a pessoa está
      // ouvindo agora (0 se ninguém estiver tocando esta faixa no momento).
      const anchor = isCurrent ? progress : 0;
      return addTrackComment(displayedTrack.id, texto, anchor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackComments", displayedTrack?.id] });
      toast.success("Comentário publicado!");
      setCommentText("");
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao comentar"),
  });

  function handlePlayPause() {
    if (tracksLoading) {
      toast.info("Carregando faixas, aguarde um instante...");
      return;
    }
    if (!spotlightTrack) {
      toast.error("Nenhuma faixa disponível para tocar neste álbum.");
      return;
    }
    if (isCurrent) {
      toggle();
      return;
    }
    const queue: PlayerTrack[] = playableTracks.map((t) => ({
      id: t.id,
      title: t.title,
      audioUrl: t.audio_url,
      coverUrl,
    }));
    play(queue[0], queue);
  }

  function handleSeekRatio(ratio: number) {
    // Clique na waveform pula para aquele ponto, se esta faixa já for a atual.
    if (isCurrent && duration > 0) {
      seek(ratio * duration);
    }
  }

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("Você precisa entrar na sua conta para comentar.");
      return;
    }
    const text = commentText.trim();
    if (!text) return;
    commentMut.mutate(text);
  };

  if (variant === "spotlight") {
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden p-6 flex flex-col md:flex-row gap-8 items-stretch group/spotlight relative">
        <div className="w-56 h-56 shrink-0 relative overflow-hidden rounded-lg shadow-2xl bg-black">
          <img
            src={coverUrl}
            alt={pack.nome}
            className="w-full h-full object-cover transform group-hover/spotlight:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/spotlight:opacity-100 flex items-center justify-center transition-all cursor-pointer" onClick={handlePlayPause}>
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-2xl transform scale-75 group-hover/spotlight:scale-100 transition-transform">
              {isThisPlaying ? <Pause className="text-white h-8 w-8 fill-current" /> : <Play className="text-white h-8 w-8 fill-current ml-1" />}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-primary font-bold text-[10px] uppercase tracking-widest border border-primary/20 px-2 py-0.5 rounded shadow-primary/10">Spotlight</span>
                <span className="text-white/40 text-xs">Publicado hoje</span>
              </div>
              <div className="flex items-center gap-4 text-white/40 text-xs font-bold">
                <span className="flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5" /> 1.2k</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {trackComments.length}</span>
              </div>
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold mb-1 line-clamp-2 text-white break-words">{pack.nome}</h3>
            <p className="text-white/50 text-base leading-relaxed line-clamp-1">Mix exclusivo de {pack.genero}. Produzido pela equipe TopDJ.</p>
          </div>

          <div className="my-2">
            {tracksLoading ? (
              <div
                className="flex items-center justify-center text-white/20 text-xs uppercase tracking-widest font-bold"
                style={{ height: 56 }}
              >
                Carregando...
              </div>
            ) : !spotlightTrack ? (
              <div
                className="flex items-center justify-center text-white/20 text-xs uppercase tracking-widest font-bold"
                style={{ height: 56 }}
              >
                Sem faixas cadastradas
              </div>
            ) : (
              <Waveform
                progress={progress}
                height={56}
                barCount={80}
                seed={pack.id.charCodeAt(0)}
                comments={waveformMarkers}
                onSeek={handleSeekRatio}
                className="w-full"
              />
            )}
          </div>

          <div className="space-y-4">
            <CommentForm
              session={session}
              value={commentText}
              onChange={setCommentText}
              onSubmit={handleComment}
              isSubmitting={commentMut.isPending}
            />
            <div className="flex items-center gap-4">
              <button 
                onClick={() => addItem(pack)}
                className="px-8 py-2.5 bg-primary rounded-md font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 text-white"
              >
                <ShoppingCart className="h-4 w-4" /> Carrinho
              </button>
              <div className="flex gap-2">
                <button onClick={() => likeMut.mutate()} className={cn("p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors text-white", likeMut.isSuccess && "text-primary border-primary/30 fill-primary")}>
                  <Heart className="h-5 w-5" fill={likeMut.isSuccess ? "currentColor" : "none"} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 group/track">
      <div className="w-32 h-32 shrink-0 relative overflow-hidden rounded-lg border border-white/5 shadow-xl bg-black">
        <img
          src={coverUrl}
          alt={pack.nome}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/track:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={handlePlayPause}>
          {isThisPlaying ? <Pause className="h-10 w-10 text-white fill-current" /> : <Play className="h-10 w-10 text-white fill-current ml-1" />}
        </div>
      </div>
      
      <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-white/40 mb-1 font-bold">
                <span className="hover:text-white cursor-pointer transition-colors">TopDJ Originals</span>
                <Repeat className="h-3 w-3" />
                <span className="hover:text-white cursor-pointer transition-colors">DJ Bubblix</span>
              </div>
              <h3 className="font-display text-xl font-bold line-clamp-2 text-white break-words">{pack.nome}</h3>
            </div>
            <span className="text-xs text-white/30 whitespace-nowrap shrink-0">há 13 dias</span>
          </div>

          <div className="bg-white/[0.03] rounded-md p-2 hover:bg-white/[0.05] transition-colors">
            {tracksLoading ? (
              <div
                className="flex items-center justify-center text-white/20 text-xs uppercase tracking-widest font-bold"
                style={{ height: 36 }}
              >
                Carregando...
              </div>
            ) : !spotlightTrack ? (
              <div
                className="flex items-center justify-center text-white/20 text-xs uppercase tracking-widest font-bold"
                style={{ height: 36 }}
              >
                Sem faixas cadastradas
              </div>
            ) : (
              <Waveform
                progress={progress}
                height={36}
                barCount={56}
                seed={pack.id.charCodeAt(0)}
                comments={waveformMarkers}
                onSeek={handleSeekRatio}
                className="w-full"
              />
            )}
          </div>

          {showCommentForm && (
            <CommentForm
              session={session}
              value={commentText}
              onChange={setCommentText}
              onSubmit={handleComment}
              isSubmitting={commentMut.isPending}
            />
          )}
        </div>

        <div className="flex items-center gap-4 mt-2">
          <button onClick={() => likeMut.mutate()} className={cn("px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 text-white/70", likeMut.isSuccess && "text-primary border-primary/30")}>
            <Heart className={cn("h-3.5 w-3.5", likeMut.isSuccess && "fill-current")} /> {likesCount}
          </button>
          <button onClick={() => setShowCommentForm(!showCommentForm)} className={cn("px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 text-white/70", showCommentForm && "text-primary")}>
            <MessageSquare className="h-3.5 w-3.5" /> {trackComments.length}
          </button>
          <button className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 text-white/70"><Share className="h-3.5 w-3.5" /> Compartilhar</button>
          <div className="ml-auto text-white/20 text-[10px] font-bold uppercase tracking-widest hidden sm:block">506k Plays</div>
        </div>
      </div>
    </div>
  );
}
