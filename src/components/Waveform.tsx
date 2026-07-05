import { useMemo, useState } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateWaveformBars } from "@/lib/waveform";

export interface WaveformCommentMarker {
  id: string;
  /** 0 a 1: posição na faixa em que o comentário foi feito. */
  position_ratio: number;
  autor: string;
  avatar_url: string | null;
  content: string;
}

interface WaveformProps {
  /** 0 a 1: quanto da faixa já foi reproduzido. */
  progress: number;
  height?: number;
  barCount?: number;
  seed?: number;
  className?: string;
  onSeek?: (ratio: number) => void;
  /** Comentários ancorados na waveform, estilo SoundCloud. */
  comments?: WaveformCommentMarker[];
}

/**
 * Waveform moderna e centralizada: as barras crescem a partir do meio
 * (para cima e para baixo), como uma forma de onda de áudio real —
 * em vez de barras "de gráfico" que só sobem a partir da base.
 */
export function Waveform({
  progress,
  height = 40,
  barCount = 64,
  seed = 1,
  className,
  onSeek,
  comments = [],
}: WaveformProps) {
  const bars = useMemo(() => generateWaveformBars(barCount, seed), [barCount, seed]);
  const activeBars = Math.round(Math.min(1, Math.max(0, progress)) * bars.length);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    onSeek(ratio);
  }

  return (
    <div
      className={cn("relative", className)}
      style={{ height: comments.length > 0 ? height + 26 : height }}
    >
      {/* Marcadores de comentário (avatares fixados na posição da faixa) */}
      {comments.length > 0 && (
        <div className="absolute left-0 top-0 w-full h-6 pointer-events-none">
          {comments.map((c) => (
            <div
              key={c.id}
              className="absolute -translate-x-1/2 pointer-events-auto"
              style={{ left: `${c.position_ratio * 100}%` }}
              onMouseEnter={() => setHoveredId(c.id)}
              onMouseLeave={() => setHoveredId((id) => (id === c.id ? null : id))}
            >
              {/* Balão com o comentário, visível no hover */}
              {hoveredId === c.id && (
                <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 z-20 w-max max-w-[180px]">
                  <div className="rounded-lg bg-black/90 border border-white/10 px-3 py-1.5 shadow-xl">
                    <p className="text-[10px] font-bold text-white/90 leading-tight break-words">
                      {c.content}
                    </p>
                    <p className="text-[9px] text-primary font-bold mt-0.5">{c.autor}</p>
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 border-r border-b border-white/10 rotate-45 -mt-1" />
                </div>
              )}
              <button
                className="h-5 w-5 rounded-full overflow-hidden border-2 border-background shadow-md hover:scale-125 hover:z-10 transition-transform bg-muted flex items-center justify-center cursor-pointer"
                aria-label={`Comentário de ${c.autor}`}
              >
                {c.avatar_url ? (
                  <img src={c.avatar_url} alt={c.autor} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-2.5 w-2.5 text-muted-foreground" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className={cn(
          "flex items-center gap-[2px] absolute bottom-0 left-0 w-full",
          onSeek && "cursor-pointer",
        )}
        style={{ height }}
        onClick={handleClick}
      >
        {bars.map((h, i) => {
          const isActive = i < activeBars;
          return (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-full transition-colors duration-150",
                isActive
                  ? "bg-primary shadow-[0_0_6px_var(--color-primary)]"
                  : "bg-white/20 group-hover:bg-white/30",
              )}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
