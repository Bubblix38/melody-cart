import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { registerPlayFn } from "@/lib/plays";

export type PlayerTrack = {
  id: string;
  title: string;
  artist?: string;
  audioUrl: string;
  coverUrl?: string;
};

type AudioPlayerContextValue = {
  current: PlayerTrack | null;
  queue: PlayerTrack[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  /** Toca uma faixa. Se passar uma lista, ela vira a fila (para next/prev). */
  play: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<PlayerTrack | null>(null);
  const [queue, setQueue] = useState<PlayerTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  // Cria o elemento <audio> uma única vez (apenas no cliente).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = new Audio();
    audio.preload = "auto";
    audio.volume = volume;
    audioRef.current = audio;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onError = () => {
      const err = audio.error;
      console.error("Falha ao carregar áudio:", {
        src: audio.currentSrc,
        code: err?.code,
        message: err?.message,
      });
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = useCallback((track: PlayerTrack, newQueue?: PlayerTrack[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (newQueue) setQueue(newQueue);

    // Se for a mesma faixa, apenas alterna play/pause.
    if (current?.id === track.id) {
      if (audio.paused) {
        audio.play().catch((err) => console.error("Erro ao tocar áudio:", err));
      } else {
        audio.pause();
      }
      return;
    }

    setCurrent(track);

    // Limpa URL temporária antiga se existir
    if (audio.dataset.objectUrl) {
      URL.revokeObjectURL(audio.dataset.objectUrl);
      delete audio.dataset.objectUrl;
    }

    // Atribui o áudio e toca imediatamente para preservar o gesto de clique no mobile (iOS / Android)
    audio.src = track.audioUrl;
    audio.play().catch((err) => {
      console.error("Erro ao iniciar áudio:", err);
    });

    // Se estiver offline, verifica se existe versão salva em cache
    if (typeof window !== "undefined" && "caches" in window && !navigator.onLine) {
      caches.open("topdj-audio-cache-v1").then((cache) => {
        cache.match(track.audioUrl).then((response) => {
          if (response && response.ok) {
            response.blob().then((blob) => {
              if (blob.size > 0) {
                const objectUrl = URL.createObjectURL(blob);
                audio.src = objectUrl;
                audio.dataset.objectUrl = objectUrl;
                audio.play().catch(() => {});
              }
            });
          }
        });
      });
    }

    // Registra a audição (1 por IP único por faixa, contabilizado no servidor).
    registerPlayFn({ data: { trackId: track.id } }).catch(() => {
      /* falha ao contar play não deve afetar a reprodução */
    });
  }, [current]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) {
      audio.play().catch((err) => console.error("Erro ao tocar áudio:", err));
    } else {
      audio.pause();
    }
  }, [current]);

  const next = useCallback(() => {
    if (!queue.length || !current) return;
    const currentIndex = queue.findIndex((t) => t.id === current.id);

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      play(queue[randomIndex]);
      return;
    }

    if (currentIndex === -1 || currentIndex === queue.length - 1) {
      play(queue[0]);
    } else {
      play(queue[currentIndex + 1]);
    }
  }, [queue, current, isShuffle, play]);

  const prev = useCallback(() => {
    if (!queue.length || !current) return;
    const currentIndex = queue.findIndex((t) => t.id === current.id);
    if (currentIndex === -1 || currentIndex === 0) {
      play(queue[queue.length - 1]);
    } else {
      play(queue[currentIndex - 1]);
    }
  }, [queue, current, play]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((v: number) => {
    const audio = audioRef.current;
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    if (audio) {
      audio.volume = clamped;
      if (clamped > 0) audio.muted = false;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setIsRepeat((prev) => !prev);
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        current,
        queue,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        isRepeat,
        play,
        toggle,
        next,
        prev,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) {
    throw new Error("useAudioPlayer deve ser usado dentro de um AudioPlayerProvider");
  }
  return ctx;
}
