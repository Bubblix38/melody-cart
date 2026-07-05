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
    audio.preload = "metadata";
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
    audio.src = track.audioUrl;
    audio.play().catch((err) => console.error("Erro ao tocar áudio:", err));

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

  const playAtOffset = useCallback(
    (offset: number) => {
      if (!current || queue.length === 0) return;
      if (isShuffle && queue.length > 1) {
        // Sorteia uma faixa diferente da atual.
        let nextIdx = Math.floor(Math.random() * queue.length);
        const currentIdx = queue.findIndex((t) => t.id === current.id);
        if (nextIdx === currentIdx) nextIdx = (nextIdx + 1) % queue.length;
        play(queue[nextIdx]);
        return;
      }
      const idx = queue.findIndex((t) => t.id === current.id);
      if (idx === -1) return;
      const nextIdx = (idx + offset + queue.length) % queue.length;
      play(queue[nextIdx]);
    },
    [current, queue, play, isShuffle],
  );

  const next = useCallback(() => playAtOffset(1), [playAtOffset]);
  const prev = useCallback(() => playAtOffset(-1), [playAtOffset]);

  const toggleShuffle = useCallback(() => setIsShuffle((s) => !s), []);
  const toggleRepeat = useCallback(() => setIsRepeat((r) => !r), []);

  // Auto-avança ao terminar (respeitando repeat/shuffle).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else if (queue.length > 1) {
        next();
      }
    };
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [next, queue.length, isRepeat]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((v: number) => {
    const audio = audioRef.current;
    const clamped = Math.min(1, Math.max(0, v));
    setVolumeState(clamped);
    if (audio) {
      audio.volume = clamped;
      audio.muted = false;
    }
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextMuted = !audio.muted;
    audio.muted = nextMuted;
    setIsMuted(nextMuted);
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
    throw new Error("useAudioPlayer deve ser usado dentro de AudioPlayerProvider");
  }
  return ctx;
}
