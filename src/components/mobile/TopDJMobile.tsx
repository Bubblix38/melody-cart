import { useState, useEffect, useRef, useCallback } from "react";
import assets from "./assets.json";
import Equalizer from "./Equalizer";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Star,
  Share2,
  ShoppingBag,
  Upload,
  Home,
  Search,
  Library,
  Bookmark,
  User,
  ChevronLeft,
  TrendingUp,
  Clock,
  Music,
  Radio,
} from "lucide-react";
import "./TopDJMobile.css";

type RepeatMode = "off" | "one" | "all";
type Screen = "home" | "search" | "library" | "favorites" | "profile";

interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  cover: string;
  duration: number;
  dj: string;
  bpm: number;
  key: string;
  genre: string;
  colors: string[];
}

const tracks: Track[] = [
  {
    id: 1,
    title: "Neon Pulse",
    artist: "Aetherwave",
    album: "Digital Horizons",
    cover: assets.images.neonWaves.url,
    duration: 224,
    dj: "AETHERWAVE",
    bpm: 128,
    key: "Fm",
    genre: "Progressive House",
    colors: ["#7c3aed", "#4c1d95", "#2e1065", "#a21caf", "#1e1b4b"],
  },
  {
    id: 2,
    title: "Deep Current",
    artist: "Blue Shift",
    album: "Oceanic Beats",
    cover: assets.images.deepBlue.url,
    duration: 256,
    dj: "BLUE SHIFT",
    bpm: 132,
    key: "Am",
    genre: "Deep House",
    colors: ["#0ea5e9", "#1e3a5f", "#0c4a6e", "#06b6d4", "#0a1628"],
  },
  {
    id: 3,
    title: "Amber Sky",
    artist: "Solstice",
    album: "Festival Dawn",
    cover: assets.images.festivalAmber.url,
    duration: 198,
    dj: "SOLSTICE",
    bpm: 126,
    key: "Gm",
    genre: "Melodic Techno",
    colors: ["#f59e0b", "#ea580c", "#c2410c", "#f97316", "#7c2d12"],
  },
  {
    id: 4,
    title: "Void Walker",
    artist: "Aetherwave",
    album: "Digital Horizons",
    cover: assets.images.neonWaves.url,
    duration: 312,
    dj: "AETHERWAVE",
    bpm: 140,
    key: "Dm",
    genre: "Techno",
    colors: ["#6d28d9", "#4c1d95", "#3b0764", "#8b5cf6", "#0d0820"],
  },
  {
    id: 5,
    title: "Coastal Drift",
    artist: "Blue Shift",
    album: "Oceanic Beats",
    cover: assets.images.deepBlue.url,
    duration: 275,
    dj: "BLUE SHIFT",
    bpm: 124,
    key: "Em",
    genre: "Chill House",
    colors: ["#06b6d4", "#0891b2", "#0e7490", "#22d3ee", "#0a1628"],
  },
];

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface Confetti {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

function usePlayback() {
  const [trackIdx, setTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [liked, setLiked] = useState<Set<number>>(new Set([1, 3]));
  const [favorited, setFavorited] = useState<Set<number>>(new Set([1]));
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const confettiId = useRef(0);
  const intervalRef = useRef<number | null>(null);
  const shuffleStack = useRef<number[]>([]);

  const track = tracks[trackIdx];
  const progress = track.duration ? (currentTime / track.duration) * 100 : 0;

  function buildShuffle() {
    const pool = tracks.map((_, i) => i).filter((i) => i !== trackIdx);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    shuffleStack.current = pool;
  }

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setCurrentTime((p) => Math.min(p + 1, tracks[trackIdx]?.duration ?? 0));
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, trackIdx]);

  useEffect(() => {
    if (currentTime >= track.duration && track.duration > 0) handleNext();
  }, [currentTime]);

  function handleNext() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (repeat === "one") { setCurrentTime(0); if (!isPlaying) setIsPlaying(true); return; }
    if (shuffle) {
      if (shuffleStack.current.length === 0) {
        if (repeat === "all") { buildShuffle(); }
        else { setIsPlaying(false); setCurrentTime(track.duration); return; }
      }
      const next = shuffleStack.current.pop()!;
      setTrackIdx(next); setCurrentTime(0); setIsPlaying(true);
      return;
    }
    if (trackIdx === tracks.length - 1) {
      if (repeat === "all") { setTrackIdx(0); setCurrentTime(0); setIsPlaying(true); }
      else { setIsPlaying(false); setCurrentTime(track.duration); }
      return;
    }
    setTrackIdx((p) => p + 1); setCurrentTime(0); setIsPlaying(true);
  }

  function handlePrev() {
    if (currentTime > 3) { setCurrentTime(0); return; }
    setTrackIdx((p) => (p === 0 ? tracks.length - 1 : p - 1));
    setCurrentTime(0); setIsPlaying(true);
  }

  function seek(pct: number) { setCurrentTime(Math.floor(pct * track.duration)); }

  function toggleShuffle() {
    setShuffle((s) => { if (!s) buildShuffle(); else shuffleStack.current = []; return !s; });
  }
  function toggleRepeat() {
    const modes: RepeatMode[] = ["off", "one", "all"];
    setRepeat(modes[(modes.indexOf(repeat) + 1) % 3]);
  }

  function spawnConfetti(x: number, y: number) {
    const id = ++confettiId.current;
    const emojis = ["❤️", "✨", "💜", "💖"];
    setConfetti((prev) => [...prev, { id, x, y, emoji: emojis[Math.floor(Math.random() * emojis.length)] }]);
    setTimeout(() => setConfetti((prev) => prev.filter((c) => c.id !== id)), 800);
  }

  function toggleLike(id: number) {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleFavorite(id: number) {
    setFavorited((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return {
    trackIdx, setTrackIdx, isPlaying, setIsPlaying, currentTime,
    shuffle, repeat, liked, favorited, confetti,
    track, progress,
    handleNext, handlePrev, seek,
    toggleShuffle, toggleRepeat, toggleLike, toggleFavorite, spawnConfetti,
    togglePlay: () => {
      if (currentTime >= track.duration) setCurrentTime(0);
      setIsPlaying((p) => !p);
    },
  };
}

const navItems: { screen: Screen; icon: typeof Home; label: string }[] = [
  { screen: "home", icon: Home, label: "Home" },
  { screen: "search", icon: Search, label: "Buscar" },
  { screen: "library", icon: Library, label: "Biblioteca" },
  { screen: "favorites", icon: Bookmark, label: "Favoritos" },
  { screen: "profile", icon: User, label: "Perfil" },
];

function HomeScreen({ onSelectTrack, onPlay }: { onSelectTrack: (i: number) => void; onPlay: () => void }) {
  return (
    <div className="screen home-screen">
      <div className="screen-header">
        <h1 className="brand-title">TOPDJ</h1>
        <span className="brand-sub">Streaming Premium</span>
      </div>
      <div className="section">
        <h3 className="section-title"><TrendingUp size={18} /> Em Alta</h3>
        <div className="featured-grid">
          {[tracks[0], tracks[1], tracks[2]].map((t, i) => (
            <div key={i} className="featured-card" onClick={() => { onSelectTrack(i); onPlay(); }}>
              <img src={t.cover} alt={t.album} style={{ width: "100%", height: "auto" }} />
              <div className="featured-tag">FEATURED</div>
              <div className="featured-info">
                <span className="featured-title">{t.title}</span>
                <span className="featured-artist">{t.artist}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="section">
        <h3 className="section-title"><Music size={18} /> Para Você</h3>
        <div className="track-list">
          {tracks.map((t, i) => (
            <div key={t.id} className="track-row" onClick={() => { onSelectTrack(i); onPlay(); }}>
              <img src={t.cover} alt={t.album} className="track-thumb" style={{ width: 48, height: 48 }} />
              <div className="track-meta"><span className="track-name">{t.title}</span><span className="track-sub">{t.artist} · {t.genre}</span></div>
              <span className="track-dur">{formatTime(t.duration)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchScreen() {
  return (
    <div className="screen search-screen">
      <div className="search-bar"><Search size={18} className="search-icon" /><input type="text" placeholder="Buscar DJs, faixas, gêneros..." className="search-input" /></div>
      <div className="section">
        <h3 className="section-title"><Radio size={18} /> Gêneros Populares</h3>
        <div className="genre-grid">
          {["Progressive House", "Deep House", "Techno", "Melodic Techno", "Chill House", "Drum & Bass", "Trance", "Lo-Fi"].map((g) => (<div key={g} className="genre-chip">{g}</div>))}
        </div>
      </div>
      <div className="section">
        <h3 className="section-title"><Clock size={18} /> Buscas Recentes</h3>
        <div className="track-list">
          {tracks.slice(0, 3).map((t) => (
            <div key={t.id} className="track-row">
              <img src={t.cover} alt={t.album} className="track-thumb" style={{ width: 48, height: 48 }} />
              <div className="track-meta"><span className="track-name">{t.title}</span><span className="track-sub">{t.artist}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LibraryScreen({ liked, onSelectTrack, onPlay }: { liked: Set<number>; onSelectTrack: (i: number) => void; onPlay: () => void }) {
  const likedTracks = tracks.filter((t) => liked.has(t.id));
  return (
    <div className="screen library-screen">
      <h2 className="screen-title">Biblioteca</h2>
      {likedTracks.length === 0 ? (
        <div className="empty-state"><Heart size={48} className="empty-icon" /><p className="empty-text">Curta faixas para vê-las aqui</p></div>
      ) : (
        <div className="track-list">
          {likedTracks.map((t) => {
            const i = tracks.indexOf(t);
            return (
              <div key={t.id} className="track-row" onClick={() => { onSelectTrack(i); onPlay(); }}>
                <img src={t.cover} alt={t.album} className="track-thumb" style={{ width: 48, height: 48 }} />
                <div className="track-meta"><span className="track-name">{t.title}</span><span className="track-sub">{t.artist}</span></div>
                <Heart size={16} className="like-icon filled" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FavoritesScreen({ favorited, onSelectTrack, onPlay }: { favorited: Set<number>; onSelectTrack: (i: number) => void; onPlay: () => void }) {
  const favTracks = tracks.filter((t) => favorited.has(t.id));
  return (
    <div className="screen favorites-screen">
      <h2 className="screen-title">Favoritos</h2>
      {favTracks.length === 0 ? (
        <div className="empty-state"><Star size={48} className="empty-icon" /><p className="empty-text">Favorite faixas para acessar rápido</p></div>
      ) : (
        <div className="track-list">
          {favTracks.map((t) => {
            const i = tracks.indexOf(t);
            return (
              <div key={t.id} className="track-row" onClick={() => { onSelectTrack(i); onPlay(); }}>
                <img src={t.cover} alt={t.album} className="track-thumb" style={{ width: 48, height: 48 }} />
                <div className="track-meta"><span className="track-name">{t.title}</span><span className="track-sub">{t.artist}</span></div>
                <Star size={16} className="fav-icon filled" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProfileScreen() {
  return (
    <div className="screen profile-screen">
      <h2 className="screen-title">Perfil</h2>
      <div className="profile-card">
        <div className="profile-avatar"><User size={40} /></div>
        <div className="profile-info"><span className="profile-name">DJ Entusiasta</span><span className="profile-level">Nível Premium</span></div>
      </div>
      <div className="section">
        <h3 className="section-title">Estatísticas</h3>
        <div className="stats-grid">
          {[{ v: "247", l: "Horas" }, { v: "1.2k", l: "Faixas" }, { v: "48", l: "DJs" }, { v: "12", l: "Playlists" }].map((s) => (
            <div key={s.l} className="stat-card"><span className="stat-value">{s.v}</span><span className="stat-label">{s.l}</span></div>
          ))}
        </div>
      </div>
      <div className="section">
        <h3 className="section-title">Configurações</h3>
        <div className="settings-list">
          {["Qualidade de Áudio", "Equalizador", "Notificações", "Privacidade"].map((s) => (
            <div key={s} className="setting-row"><span>{s}</span><ChevronLeft size={18} className="setting-arrow" /></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerScreen({ pb }: { pb: ReturnType<typeof usePlayback> }) {
  const { track, isPlaying, currentTime, progress, shuffle, repeat, liked, favorited, confetti,
    togglePlay, handlePrev, handleNext, seek, toggleShuffle, toggleRepeat, toggleLike, toggleFavorite, spawnConfetti } = pb;

  const [shifts, setShifts] = useState([0, 1, 2, 3, 4]);
  const [trackPhase, setTrackPhase] = useState<"idle" | "bg-changing" | "cover-entering">("idle");
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const gyroRef = useRef<{ beta: number; gamma: number }>({ beta: 0, gamma: 0 });
  const animFrame = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setShifts(([a, b, c, d, e]) => [(a + 1) % 5, (b + 1) % 5, (c + 1) % 5, (d + 1) % 5, (e + 1) % 5]);
    }, 3000);
    return () => clearInterval(id);
  }, [isPlaying]);

  useEffect(() => {
    setShifts([0, 1, 2, 3, 4]);
    setTrackPhase("bg-changing");
    const t1 = setTimeout(() => setTrackPhase("cover-entering"), 300);
    const t2 = setTimeout(() => setTrackPhase("idle"), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [track.id]);

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      gyroRef.current = { beta: e.beta, gamma: e.gamma };
    };
    window.addEventListener("deviceorientation", handleOrientation);
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, []);

  useEffect(() => {
    const updateParallax = () => {
      const { beta, gamma } = gyroRef.current;
      if (Math.abs(beta) > 2 || Math.abs(gamma) > 2) {
        const px = Math.max(-4, Math.min(4, gamma / 22));
        const py = Math.max(-4, Math.min(4, (beta - 30) / 22));
        setParallax({ x: px, y: py });
      } else {
        setParallax({ x: 0, y: 0 });
      }
      animFrame.current = requestAnimationFrame(updateParallax);
    };
    animFrame.current = requestAnimationFrame(updateParallax);
    return () => cancelAnimationFrame(animFrame.current);
  }, []);

  const c = track.colors;

  const handleLike = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    spawnConfetti(e.clientX - rect.left, e.clientY - rect.top);
    toggleLike(track.id);
  };

  const handleFav = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    spawnConfetti(e.clientX - rect.left, e.clientY - rect.top);
    toggleFavorite(track.id);
  };

  const coverVisible = trackPhase === "cover-entering" || trackPhase === "idle";

  return (
    <div className={`player-screen ${isPlaying ? "active" : ""}`}>
      <img
        src={track.cover}
        alt=""
        className={`blur-bg ${trackPhase === "bg-changing" ? "morphing" : ""}`}
        style={{ transform: `translate(${parallax.x * 1}px, ${parallax.y * 1}px) scale(1.12)` }}
      />

      <div className={`spotify-bg ${trackPhase === "bg-changing" ? "morphing" : ""}`}
        style={{ transform: `translate(${parallax.x * 1.5}px, ${parallax.y * 1.5}px)` }}>
        <div className={`spotify-blob blob-1 ${isPlaying ? "animated" : ""}`} style={{ background: `radial-gradient(circle at 30% 20%, ${c[shifts[0]]}cc 0%, ${c[shifts[1]]}44 45%, transparent 70%)` }} />
        <div className={`spotify-blob blob-2 ${isPlaying ? "animated" : ""}`} style={{ background: `radial-gradient(circle at 70% 60%, ${c[shifts[2]]}99 0%, ${c[shifts[3]]}33 50%, transparent 75%)` }} />
        <div className={`spotify-blob blob-3 ${isPlaying ? "animated" : ""}`} style={{ background: `radial-gradient(circle at 50% 80%, ${c[shifts[4]]}88 0%, ${c[shifts[0]]}22 55%, transparent 80%)` }} />
        <div className={`spotify-blob blob-4 ${isPlaying ? "animated" : ""}`} style={{ background: `radial-gradient(circle at 50% 30%, ${c[shifts[1]]}44 0%, transparent 60%)` }} />
      </div>

      <div
        className="ambient-glow-wrap"
        style={{ transform: `translate(calc(-50% + ${parallax.x * 4}px), calc(-50% + ${parallax.y * 4}px))` }}
      >
        <div className={`ambient-glow ${isPlaying ? "breathing" : ""}`} style={{ background: c[shifts[0]] }} />
      </div>

      <div className="art-stage">
        <div
          className={`player-art-wrapper ${trackPhase === "cover-entering" ? "track-enter" : ""}`}
          style={{
            opacity: coverVisible ? 1 : 0,
            transform: `perspective(800px) rotateY(${parallax.x}deg) rotateX(${-parallax.y}deg) scale(${isPlaying ? 1.006 : 1})`,
            "--glass-edge": `${c[shifts[0]]}44`,
            "--shadow-x": `${parallax.x * 3}px`,
            "--shadow-y": `${parallax.y * 3}px`,
            "--refl-x": `${parallax.x}px`,
            "--refl-y": `${parallax.y}px`,
          } as React.CSSProperties}
        >
          <div className="player-art-inner">
            <img
              src={track.cover}
              alt={track.album}
              className="player-art"
              style={{
                width: "100%",
                height: "100%",
                transform: `translate(${parallax.x * 0.8}px, ${parallax.y * 0.8}px) scale(1.04)`,
              }}
            />
          </div>
        </div>

        {coverVisible && (
          <>
            <div className="floating-badge" style={{ transform: `translate(${parallax.x * 7}px, ${parallax.y * 7}px)` }}>
              <span className="badge-text">EXCLUSIVE</span>
            </div>
            <div className="bpm-chip" style={{ transform: `translate(${parallax.x * 5}px, ${parallax.y * 5}px)` }}>
              <span className="bpm-value">{track.bpm}</span>
              <span className="bpm-label">BPM</span>
            </div>
          </>
        )}
      </div>

      <div
        className={`glass-panel ${trackPhase === "cover-entering" ? "track-enter" : ""}`}
        style={{ opacity: coverVisible ? 1 : 0, transform: coverVisible ? `translateY(${Math.abs(parallax.y) * 1.5}px)` : "translateY(8px)" }}
      >
        <div className="player-meta">
          <div className="player-meta-row"><span className="player-dj">{track.dj}</span><span className="player-bpm">{track.bpm} BPM</span></div>
          <div className="player-meta-row"><span className="player-key">{track.key}</span><span className="player-genre">{track.genre}</span></div>
        </div>

        <div className="player-title-row"><Equalizer active={isPlaying} /><h2 className="player-title">{track.title}</h2></div>
        <p className="player-artist">{track.artist}</p>

        <div className="player-progress">
          <div className="progress-track" onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); seek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))); }}>
            <div className="progress-elapsed" style={{ width: `${progress}%`, background: c[shifts[0]] }} />
            <div className="progress-dot-wrap" style={{ left: `${progress}%` }}>
              <div className="progress-dot-glow" style={{ background: c[shifts[0]] }} />
              <div className="progress-dot" style={{ background: c[shifts[0]] }} />
            </div>
          </div>
          <div className="progress-times"><span>{formatTime(currentTime)}</span><span>{formatTime(track.duration)}</span></div>
        </div>

        <div className="player-actions">
          <button className={`action-btn ${liked.has(track.id) ? "liked" : ""}`} onClick={handleLike}>
            <Heart size={18} fill={liked.has(track.id) ? "currentColor" : "none"} />
          </button>
          <button className={`action-btn ${favorited.has(track.id) ? "faved" : ""}`} onClick={handleFav}>
            <Star size={18} fill={favorited.has(track.id) ? "currentColor" : "none"} />
          </button>
          <button className="action-btn"><Share2 size={18} /></button>
          <button className="action-btn"><Upload size={18} /></button>
          <button className="action-btn buy-btn"><ShoppingBag size={18} /> Pack</button>
        </div>

        <div className="player-controls">
          <button className={`ctrl-btn ${shuffle ? "active" : ""}`} onClick={toggleShuffle}><Shuffle size={18} /></button>
          <button className="ctrl-btn" onClick={handlePrev}><SkipBack size={22} /></button>
          <button className="play-button" onClick={togglePlay}>
            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="play-icon-offset" />}
            <div className={`play-ripple ${isPlaying ? "pulsing" : ""}`} />
          </button>
          <button className="ctrl-btn" onClick={handleNext}><SkipForward size={22} /></button>
          <button className={`ctrl-btn ${repeat !== "off" ? "active" : ""}`} onClick={toggleRepeat}>
            {repeat === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
          </button>
        </div>
      </div>

      <div className="confetti-layer">
        {confetti.map((c) => (
          <span key={c.id} className="confetti-particle" style={{ left: c.x, top: c.y }}>{c.emoji}</span>
        ))}
      </div>
    </div>
  );
}

export default function TopDJMobile() {
  const pb = usePlayback();
  const [screen, setScreen] = useState<Screen>("home");
  const [showPlayer, setShowPlayer] = useState(false);

  const selectAndPlay = useCallback((idx: number) => {
    pb.setTrackIdx(idx);
    pb.setIsPlaying(true);
    setShowPlayer(true);
  }, [pb]);

  if (showPlayer) {
    return (
      <div className="topdj-mobile-root">
        <PlayerScreen pb={pb} />
        <button className="back-button" onClick={() => setShowPlayer(false)}><ChevronLeft size={24} /></button>
      </div>
    );
  }

  return (
    <div className="topdj-mobile-root">
      <div className="main-content">
        {screen === "home" && <HomeScreen onSelectTrack={selectAndPlay} onPlay={() => setShowPlayer(true)} />}
        {screen === "search" && <SearchScreen />}
        {screen === "library" && <LibraryScreen liked={pb.liked} onSelectTrack={selectAndPlay} onPlay={() => setShowPlayer(true)} />}
        {screen === "favorites" && <FavoritesScreen favorited={pb.favorited} onSelectTrack={selectAndPlay} onPlay={() => setShowPlayer(true)} />}
        {screen === "profile" && <ProfileScreen />}
      </div>
      <div className="mini-player" onClick={() => setShowPlayer(true)}>
        <img src={pb.track.cover} alt="" className="mini-cover" style={{ width: 40, height: 40 }} />
        <div className="mini-info"><span className="mini-title">{pb.track.title}</span><span className="mini-artist">{pb.track.artist}</span></div>
        <Equalizer active={pb.isPlaying} barCount={3} />
        <button className="mini-play" onClick={(e) => { e.stopPropagation(); pb.togglePlay(); }}>
          {pb.isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
        </button>
      </div>
      <nav className="bottom-nav">
        {navItems.map(({ screen: s, icon: Icon, label }) => (
          <button key={s} className={`nav-btn ${screen === s ? "active" : ""}`} onClick={() => setScreen(s)}>
            <Icon size={22} /><span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
