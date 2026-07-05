import { useQuery } from "@tanstack/react-query";
import { Trophy, Play } from "lucide-react";
import { fetchPacks, formatPreco } from "@/lib/packs";
import { fetchTracks } from "@/lib/tracks";
import { packImage } from "@/lib/pack-images";
import { useCart } from "@/lib/cart";
import { getPackPlayCounts } from "@/lib/plays";
import { useAudioPlayer, type PlayerTrack } from "@/lib/audio-player";
import { Button } from "@/components/ui/button";

/**
 * Ranking real dos packs mais ouvidos (por número de audições).
 * Componente compartilhado entre a rota /mais-ouvidas e a aba
 * "Faixas populares" da página inicial.
 */
export function PopularRanking({ showHeader = true }: { showHeader?: boolean }) {
  const { data: packs = [] } = useQuery({ queryKey: ["packs"], queryFn: fetchPacks });
  const { addItem } = useCart();
  const { play } = useAudioPlayer();

  const { data: playCounts = {}, isLoading: isLoadingPlays } = useQuery({
    queryKey: ["packPlayCounts"],
    queryFn: getPackPlayCounts,
  });

  const ranking = [...packs]
    .map((pack) => ({ pack, plays: playCounts[pack.id] ?? 0 }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10);

  async function handlePlay(packId: string, coverUrl: string) {
    const tracks = await fetchTracks(packId);
    const playable = tracks.filter((t) => t.audio_url);
    if (playable.length === 0) return;
    const queue: PlayerTrack[] = playable.map((t) => ({
      id: t.id,
      title: t.title,
      audioUrl: t.audio_url,
      coverUrl,
    }));
    play(queue[0], queue);
  }

  return (
    <div>
      {showHeader && (
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground">
            <Trophy className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold">Mais Ouvidas</h1>
            <p className="text-muted-foreground">
              Ranking real dos packs mais tocados na TopDJ, por número de audições.
            </p>
          </div>
        </div>
      )}

      {packs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <p className="text-muted-foreground">Nenhum pack cadastrado ainda.</p>
        </div>
      ) : isLoadingPlays ? (
        <div className="py-12 text-center text-muted-foreground">Carregando ranking...</div>
      ) : ranking.every((r) => r.plays === 0) ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <p className="text-muted-foreground">
            Ainda não há audições registradas. Toque alguma faixa para começar o ranking!
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {ranking.map(({ pack, plays }, i) => {
            const coverUrl = packImage(pack.imagem_url, pack.genero);
            return (
              <li
                key={pack.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]"
              >
                <span className="w-8 shrink-0 text-center text-2xl font-extrabold text-gradient">
                  {i + 1}
                </span>
                <button
                  onClick={() => handlePlay(pack.id, coverUrl)}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg group"
                  aria-label={`Tocar ${pack.nome}`}
                >
                  <img
                    src={coverUrl}
                    alt={pack.nome}
                    loading="lazy"
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-5 w-5 text-white fill-current" />
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{pack.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {pack.genero} · {plays.toLocaleString("pt-BR")}{" "}
                    {plays === 1 ? "audição" : "audições"}
                  </p>
                </div>
                <span className="hidden font-bold sm:block">{formatPreco(pack.preco)}</span>
                <Button
                  size="sm"
                  onClick={() => addItem(pack)}
                  className="bg-[image:var(--gradient-primary)] font-semibold text-primary-foreground hover:opacity-90"
                >
                  Comprar
                </Button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
