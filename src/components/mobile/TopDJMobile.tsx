import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPacks, type Pack } from "@/lib/packs";
import { fetchTracks, type Track as RealTrack } from "@/lib/tracks";
import { useAudioPlayer, type PlayerTrack } from "@/lib/audio-player";
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

type Screen = "catalog" | "library" | "favorites" | "profile";

function formatTime(s: number): string {
  if (!s || isNaN(s)) return "0:00";
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

const DEFAULT_TRACKS: PlayerTrack[] = [
  {
    id: "demo-1",
    title: "Neon Pulse",
    artist: "Aetherwave",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=electronic-future-beats-117997.mp3",
    coverUrl: "https://agent8-games.verse8.io/0xe5a00eaa7fc8a8b6c9483d094574fef92bf34751/mcp-uploads/static-assets/background-1785292497513.png",
  },
  {
    id: "demo-2",
    title: "Deep Current",
    artist: "Blue Shift",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=deep-house-synthwave-10874.mp3",
    coverUrl: "https://agent8-games.verse8.io/0xe5a00eaa7fc8a8b6c9483d094574fef92bf34751/mcp-uploads/static-assets/background-1785292504126.png",
  },
  {
    id: "demo-3",
    title: "Amber Sky",
    artist: "Solstice",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=techno-festival-loop-1412.mp3",
    coverUrl: "https://agent8-games.verse8.io/0xe5a00eaa7fc8a8b6c9483d094574fef92bf34751/mcp-uploads/static-assets/background-1785292505849.png",
  },
];

const navItems: { screen: Screen; icon: typeof Search; label: string }[] = [
  { screen: "catalog", icon: Search, label: "Catálogo" },
  { screen: "library", icon: Library, label: "Biblioteca" },
  { screen: "favorites", icon: Bookmark, label: "Favoritos" },
  { screen: "profile", icon: User, label: "Perfil" },
];

function CatalogScreen({
  tracks,
  onSelectTrack,
}: {
  tracks: PlayerTrack[];
  onSelectTrack: (t: PlayerTrack) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const filtered = tracks.filter((t) =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.artist && t.artist.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="screen search-screen">
      <div className="screen-header">
        <h1 className="brand-title">TOPDJ</h1>
        <span className="brand-sub">Catálogo de Músicas</span>
      </div>

      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Buscar DJs, faixas, gêneros..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="section">
        <h3 className="section-title"><Radio size={18} /> Gêneros Populares</h3>
        <div className="genre-grid">
          {["Progressive House", "Deep House", "Techno", "Melodic Techno", "Chill House", "Drum & Bass", "Trance", "Lo-Fi", "Funk"].map((g) => (
            <div key={g} className="genre-chip" onClick={() => setSearchTerm(g)}>{g}</div>
          ))}
        </div>
      </div>

      <div className="section">
        <h3 className="section-title"><Music size={18} /> Músicas Disponíveis ({filtered.length})</h3>
        <div className="track-list">
          {filtered.map((t) => (
            <div key={t.id} className="track-row" onClick={() => onSelectTrack(t)}>
              <img src={t.coverUrl || DEFAULT_TRACKS[0].coverUrl} alt={t.title} className="track-thumb" style={{ width: 48, height: 48 }} />
              <div className="track-meta">
                <span className="track-name">{t.title}</span>
                <span className="track-sub">{t.artist}</span>
              </div>
              <Play size={18} className="text-purple-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LibraryScreen({
  liked,
  tracks,
  onSelectTrack,
}: {
  liked: Set<string>;
  tracks: PlayerTrack[];
  onSelectTrack: (t: PlayerTrack) => void;
}) {
  const likedTracks = tracks.filter((t) => liked.has(t.id));
  return (
    <div className="screen library-screen">
      <h2 className="screen-title">Biblioteca</h2>
      {likedTracks.length === 0 ? (
        <div className="empty-state">
          <Heart size={48} className="empty-icon" />
          <p className="empty-text">Curta faixas no player para vê-las aqui</p>
        </div>
      ) : (
        <div className="track-list">
          {likedTracks.map((t) => (
            <div key={t.id} className="track-row" onClick={() => onSelectTrack(t)}>
              <img src={t.coverUrl || DEFAULT_TRACKS[0].coverUrl} alt={t.title} className="track-thumb" style={{ width: 48, height: 48 }} />
              <div className="track-meta">
                <span className="track-name">{t.title}</span>
                <span className="track-sub">{t.artist}</span>
              </div>
              <Heart size={16} className="like-icon filled" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FavoritesScreen({
  favorited,
  tracks,
  onSelectTrack,
}: {
  favorited: Set<string>;
  tracks: PlayerTrack[];
  onSelectTrack: (t: PlayerTrack) => void;
}) {
  const favTracks = tracks.filter((t) => favorited.has(t.id));
  return (
    <div className="screen favorites-screen">
      <h2 className="screen-title">Favoritos</h2>
      {favTracks.length === 0 ? (
        <div className="empty-state">
          <Star size={48} className="empty-icon" />
          <p className="empty-text">Favorite faixas no player para acessar rápido</p>
        </div>
      ) : (
        <div className="track-list">
          {favTracks.map((t) => (
            <div key={t.id} className="track-row" onClick={() => onSelectTrack(t)}>
              <img src={t.coverUrl || DEFAULT_TRACKS[0].coverUrl} alt={t.title} className="track-thumb" style={{ width: 48, height: 48 }} />
              <div className="track-meta">
                <span className="track-name">{t.title}</span>
                <span className="track-sub">{t.artist}</span>
              </div>
              <Star size={16} className="fav-icon filled" />
            </div>
          ))}
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
        <div className="profile-info">
          <span className="profile-name">DJ Entusiasta</span>
          <span className="profile-level">Nível Premium</span>
        </div>
      </div>
      <div className="section">
        <h3 className="section-title">Estatísticas</h3>
        <div className="stats-grid">
          {[{ v: "247", l: "Horas" }, { v: "1.2k", l: "Faixas" }, { v: "48", l: "DJs" }, { v: "12", l: "Playlists" }].map((s) => (
            <div key={s.l} className="stat-card">
              <span className="stat-value">{s.v}</span>
              <span className="stat-label">{s.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerScreen({
  liked,
  favorited,
  onToggleLike,
  onToggleFavorite,
}: {
  liked: Set<string>;
  favorited: Set<string>;
  onToggleLike: (id: string, e: React.MouseEvent) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}) {
  const player = useAudioPlayer();
  const track = player.current || DEFAULT_TRACKS[0];

  const colors = ["#7c3aed", "#4c1d95", "#2e1065", "#a21caf", "#1e1b4b"];
  const [shifts, setShifts] = useState([0, 1, 2, 3, 4]);
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const confettiId = useRef(0);

  useEffect(() => {
    if (!player.isPlaying) return;
    const id = setInterval(() => {
      setShifts(([a, b, c, d, e]) => [(a + 1) % 5, (b + 1) % 5, (c + 1) % 5, (d + 1) % 5, (e + 1) % 5]);
    }, 3000);
    return () => clearInterval(id);
  }, [player.isPlaying]);

  const progress = player.duration ? (player.currentTime / player.duration) * 100 : 0;

  const handleLikeClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const id = ++confettiId.current;
    setConfetti((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top, emoji: "❤️" }]);
    setTimeout(() => setConfetti((prev) => prev.filter((c) => c.id !== id)), 800);
    onToggleLike(track.id, e);
  };

  const handleFavClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const id = ++confettiId.current;
    setConfetti((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top, emoji: "✨" }]);
    setTimeout(() => setConfetti((prev) => prev.filter((c) => c.id !== id)), 800);
    onToggleFavorite(track.id, e);
  };

  return (
    <div className={`player-screen ${player.isPlaying ? "active" : ""}`}>
      <img src={track.coverUrl || DEFAULT_TRACKS[0].coverUrl} alt="" className="blur-bg" />

      <div className="spotify-bg">
        <div className={`spotify-blob blob-1 ${player.isPlaying ? "animated" : ""}`} style={{ background: `radial-gradient(circle at 30% 20%, ${colors[shifts[0]]}cc 0%, ${colors[shifts[1]]}44 45%, transparent 70%)` }} />
        <div className={`spotify-blob blob-2 ${player.isPlaying ? "animated" : ""}`} style={{ background: `radial-gradient(circle at 70% 60%, ${colors[shifts[2]]}99 0%, ${colors[shifts[3]]}33 50%, transparent 75%)` }} />
      </div>

      <div className="art-stage">
        <div className="player-art-wrapper">
          <div className="player-art-inner">
            <img src={track.coverUrl || DEFAULT_TRACKS[0].coverUrl} alt={track.title} className="player-art" />
          </div>
        </div>
        <div className="floating-badge">
          <span className="badge-text">EXCLUSIVE</span>
        </div>
      </div>

      <div className="glass-panel">
        <div className="player-title-row">
          <Equalizer active={player.isPlaying} />
          <h2 className="player-title">{track.title}</h2>
        </div>
        <p className="player-artist">{track.artist || "TopDJ"}</p>

        {/* Progress Bar */}
        <div className="player-progress">
          <div
            className="progress-track"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              if (player.duration) player.seek(pct * player.duration);
            }}
          >
            <div className="progress-elapsed" style={{ width: `${progress}%`, background: colors[shifts[0]] }} />
            <div className="progress-dot-wrap" style={{ left: `${progress}%` }}>
              <div className="progress-dot" style={{ background: colors[shifts[0]] }} />
            </div>
          </div>
          <div className="progress-times">
            <span>{formatTime(player.currentTime)}</span>
            <span>{formatTime(player.duration)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="player-actions">
          <button className={`action-btn ${liked.has(track.id) ? "liked" : ""}`} onClick={handleLikeClick}>
            <Heart size={18} fill={liked.has(track.id) ? "currentColor" : "none"} />
          </button>
          <button className={`action-btn ${favorited.has(track.id) ? "faved" : ""}`} onClick={handleFavClick}>
            <Star size={18} fill={favorited.has(track.id) ? "currentColor" : "none"} />
          </button>
          <button className="action-btn"><Share2 size={18} /></button>
          <button className="action-btn buy-btn"><ShoppingBag size={18} /> Pack</button>
        </div>

        {/* Playback Controls */}
        <div className="player-controls">
          <button className={`ctrl-btn ${player.isShuffle ? "active" : ""}`} onClick={player.toggleShuffle}>
            <Shuffle size={18} />
          </button>
          <button className="ctrl-btn" onClick={player.prev}>
            <SkipBack size={22} />
          </button>
          <button className="play-button" onClick={player.toggle}>
            {player.isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="play-icon-offset" />}
          </button>
          <button className="ctrl-btn" onClick={player.next}>
            <SkipForward size={22} />
          </button>
          <button className={`ctrl-btn ${player.isRepeat ? "active" : ""}`} onClick={player.toggleRepeat}>
            {player.isRepeat ? <Repeat1 size={18} /> : <Repeat size={18} />}
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
  const [screen, setScreen] = useState<Screen>("catalog");
  const [showPlayer, setShowPlayer] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [favorited, setFavorited] = useState<Set<string>>(new Set());

  const player = useAudioPlayer();

  const { data: packs = [] } = useQuery({
    queryKey: ["packs"],
    queryFn: fetchPacks,
  });

  const spotlightPack = packs[0];

  const { data: realTracks = [] } = useQuery({
    queryKey: ["tracks", spotlightPack?.id],
    queryFn: () => fetchTracks(spotlightPack?.id),
  });

  const allTracks: PlayerTrack[] = realTracks.length > 0
    ? realTracks.map((t) => ({
        id: t.id,
        title: t.title,
        artist: spotlightPack?.dj || "TopDJ Oficial",
        audioUrl: t.audio_url,
        coverUrl: spotlightPack?.imagem_url || DEFAULT_TRACKS[0].coverUrl,
      }))
    : DEFAULT_TRACKS;

  const selectAndPlay = useCallback(
    (t: PlayerTrack) => {
      player.play(t, allTracks);
      setShowPlayer(true);
    },
    [player, allTracks]
  );

  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleFavorite = (id: string) => {
    setFavorited((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const currentTrack = player.current || allTracks[0];

  if (showPlayer) {
    return (
      <div className="topdj-mobile-root">
        <PlayerScreen
          liked={liked}
          favorited={favorited}
          onToggleLike={toggleLike}
          onToggleFavorite={toggleFavorite}
        />
        <button className="back-button" onClick={() => setShowPlayer(false)}>
          <ChevronLeft size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className="topdj-mobile-root">
      <div className="main-content">
        {screen === "catalog" && <CatalogScreen tracks={allTracks} onSelectTrack={selectAndPlay} />}
        {screen === "library" && <LibraryScreen liked={liked} tracks={allTracks} onSelectTrack={selectAndPlay} />}
        {screen === "favorites" && <FavoritesScreen favorited={favorited} tracks={allTracks} onSelectTrack={selectAndPlay} />}
        {screen === "profile" && <ProfileScreen />}
      </div>

      {/* Mini Player */}
      <div className="mini-player" onClick={() => setShowPlayer(true)}>
        <img
          src={currentTrack?.coverUrl || DEFAULT_TRACKS[0].coverUrl}
          alt=""
          className="mini-cover"
        />
        <div className="mini-info">
          <span className="mini-title">{currentTrack?.title || "Selecione uma faixa"}</span>
          <span className="mini-artist">{currentTrack?.artist || "TopDJ"}</span>
        </div>
        <Equalizer active={player.isPlaying} barCount={3} />
        <button
          className="mini-play"
          onClick={(e) => {
            e.stopPropagation();
            if (!player.current && allTracks.length > 0) {
              player.play(allTracks[0], allTracks);
            } else {
              player.toggle();
            }
          }}
        >
          {player.isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
        </button>
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        {navItems.map(({ screen: s, icon: Icon, label }) => (
          <button
            key={s}
            className={`nav-btn ${screen === s ? "active" : ""}`}
            onClick={() => setScreen(s)}
          >
            <Icon size={22} />
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
