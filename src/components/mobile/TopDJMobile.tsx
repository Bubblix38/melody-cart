import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchPacks, type Pack } from "@/lib/packs";
import { fetchTracks, type Track as RealTrack } from "@/lib/tracks";
import { useAudioPlayer, type PlayerTrack } from "@/lib/audio-player";
import { cacheAudio, isAudioCached } from "@/lib/offline-storage";
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
  LogOut,
  ArrowDownToLine,
  CheckCircle2,
} from "lucide-react";
import "./TopDJMobile.css";

type Screen = "catalog" | "library" | "favorites" | "profile";

function formatTime(s: number): string {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 mr-2 inline-block" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

interface Confetti {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

const DEFAULT_COVER = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&w=600&q=80";

function TrackRowItem({
  track,
  onSelectTrack,
}: {
  track: PlayerTrack;
  onSelectTrack: (t: PlayerTrack) => void;
}) {
  const [cached, setCached] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    isAudioCached(track.audioUrl).then(setCached);
  }, [track.audioUrl]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cached || downloading) return;
    setDownloading(true);
    const ok = await cacheAudio(track.audioUrl);
    if (ok) setCached(true);
    setDownloading(false);
  };

  return (
    <div className="track-row" onClick={() => onSelectTrack(track)}>
      <img src={track.coverUrl || DEFAULT_COVER} alt={track.title} className="track-thumb" style={{ width: 48, height: 48 }} />
      <div className="track-meta">
        <span className="track-name">{track.title}</span>
        <span className="track-sub">{track.artist}</span>
      </div>
      <button
        onClick={handleDownload}
        className="p-2 text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer"
        title={cached ? "Salvo para tocar offline" : "Salvar no celular para tocar offline"}
      >
        {cached ? (
          <CheckCircle2 size={18} className="text-emerald-400" />
        ) : (
          <ArrowDownToLine size={18} className={downloading ? "animate-pulse text-purple-400" : ""} />
        )}
      </button>
      <Play size={18} className="text-purple-400 ml-1" />
    </div>
  );
}

function CatalogScreen({
  tracks,
  isLoading,
  user,
  onSelectTrack,
  onOpenProfile,
}: {
  tracks: PlayerTrack[];
  isLoading: boolean;
  user: any;
  onSelectTrack: (t: PlayerTrack) => void;
  onOpenProfile: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const filtered = tracks.filter((t) =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.artist && t.artist.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <div className="screen search-screen">
      <div className="screen-header flex items-center justify-between">
        <div>
          <h1 className="brand-title">TOPDJ</h1>
          <span className="brand-sub">Catálogo de Músicas</span>
        </div>
        {userAvatar ? (
          <img
            src={userAvatar}
            alt="Perfil"
            onClick={onOpenProfile}
            className="w-10 h-10 rounded-full object-cover border-2 border-purple-500 shadow-md cursor-pointer hover:scale-105 transition-transform"
          />
        ) : (
          <button
            onClick={onOpenProfile}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-purple-400 border border-white/10 cursor-pointer"
          >
            <User size={20} />
          </button>
        )}
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
        <h3 className="section-title"><Music size={18} /> Músicas Disponíveis ({isLoading ? "..." : filtered.length})</h3>
        
        {isLoading ? (
          <div className="track-list space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl animate-pulse">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Music size={48} className="empty-icon" />
            <p className="empty-text">Nenhuma faixa encontrada no catálogo</p>
          </div>
        ) : (
          <div className="track-list">
            {filtered.map((t) => (
              <TrackRowItem key={t.id} track={t} onSelectTrack={onSelectTrack} />
            ))}
          </div>
        )}
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
            <TrackRowItem key={t.id} track={t} onSelectTrack={onSelectTrack} />
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
            <TrackRowItem key={t.id} track={t} onSelectTrack={onSelectTrack} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileScreen({ user, setUser }: { user: any; setUser: (u: any) => void }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/perfil`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (error) {
      alert("Erro ao conectar com Google: " + error.message);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || "Usuário TopDJ";
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userEmail = user?.email || "";

  return (
    <div className="screen profile-screen">
      <h2 className="screen-title">Perfil</h2>

      {loading ? (
        <div className="empty-state">
          <p className="empty-text">Carregando perfil...</p>
        </div>
      ) : !user ? (
        <div className="profile-card flex-col text-center p-6 gap-4">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
            <User size={36} className="text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Conecte sua conta</h3>
          <p className="text-xs text-gray-400 mb-2">
            Faça login com a sua Conta Google para sincronizar suas faixas, favoritos e compras em qualquer dispositivo.
          </p>
          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 rounded-xl bg-white text-black font-semibold flex items-center justify-center gap-2 shadow-lg hover:bg-gray-100 transition-transform active:scale-95 cursor-pointer"
          >
            <GoogleIcon />
            Entrar com a Conta Google
          </button>
        </div>
      ) : (
        <>
          <div className="profile-card">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-16 h-16 rounded-full object-cover border-2 border-purple-500" />
            ) : (
              <div className="profile-avatar"><User size={40} /></div>
            )}
            <div className="profile-info flex-1">
              <span className="profile-name text-white font-bold">{userName}</span>
              <span className="profile-level text-purple-400 text-xs">{userEmail}</span>
              <span className="text-[10px] text-emerald-400 font-semibold mt-1 inline-block">✓ Conta Google Conectada</span>
            </div>
          </div>

          <div className="section">
            <h3 className="section-title">Estatísticas do Perfil</h3>
            <div className="stats-grid">
              {[{ v: "247", l: "Horas Ouvidas" }, { v: "1.2k", l: "Faixas Acessadas" }, { v: "48", l: "DJs Favoritos" }, { v: "12", l: "Packs Baixados" }].map((s) => (
                <div key={s.l} className="stat-card">
                  <span className="stat-value">{s.v}</span>
                  <span className="stat-label">{s.l}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full mt-4 py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors cursor-pointer"
          >
            <LogOut size={18} />
            Sair da Conta Google
          </button>
        </>
      )}
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
  const track = player.current || {
    id: "empty",
    title: "Selecione uma música",
    artist: "TopDJ",
    audioUrl: "",
    coverUrl: DEFAULT_COVER,
  };

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
      <img src={track.coverUrl || DEFAULT_COVER} alt="" className="blur-bg" />

      <div className="spotify-bg">
        <div className={`spotify-blob blob-1 ${player.isPlaying ? "animated" : ""}`} style={{ background: `radial-gradient(circle at 30% 20%, ${colors[shifts[0]]}cc 0%, ${colors[shifts[1]]}44 45%, transparent 70%)` }} />
        <div className={`spotify-blob blob-2 ${player.isPlaying ? "animated" : ""}`} style={{ background: `radial-gradient(circle at 70% 60%, ${colors[shifts[2]]}99 0%, ${colors[shifts[3]]}33 50%, transparent 75%)` }} />
      </div>

      <div className="art-stage">
        <div className="player-art-wrapper">
          <div className="player-art-inner">
            <img src={track.coverUrl || DEFAULT_COVER} alt={track.title} className="player-art" />
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
  const [user, setUser] = useState<any>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [favorited, setFavorited] = useState<Set<string>>(new Set());

  const player = useAudioPlayer();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN" || session) {
        if (typeof window !== "undefined" && (window.location.hash.includes("access_token") || window.location.search.includes("code="))) {
          setScreen("profile");
        }
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const { data: packs = [], isLoading: isLoadingPacks } = useQuery({
    queryKey: ["packs"],
    queryFn: fetchPacks,
    retry: false,
    staleTime: Infinity,
    networkMode: "offlineFirst",
  });

  const spotlightPack = packs[0];

  const { data: realTracks = [], isLoading: isLoadingTracks } = useQuery({
    queryKey: ["tracks", spotlightPack?.id],
    queryFn: () => fetchTracks(spotlightPack?.id),
    retry: false,
    staleTime: Infinity,
    networkMode: "offlineFirst",
  });

  const allTracks: PlayerTrack[] = realTracks.map((t) => ({
    id: t.id,
    title: t.title,
    artist: spotlightPack?.dj || "TopDJ Oficial",
    audioUrl: t.audio_url,
    coverUrl: spotlightPack?.imagem_url || DEFAULT_COVER,
  }));

  const isLoadingData = isLoadingPacks || isLoadingTracks;

  // Pré-salva silenciosamente os arquivos de áudio no cache offline se conectado
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.onLine) {
      allTracks.forEach((t) => {
        if (t.audioUrl) {
          cacheAudio(t.audioUrl).catch(() => {});
        }
      });
    }
  }, [allTracks]);

  const selectAndPlay = useCallback(
    (t: PlayerTrack) => {
      if (t.audioUrl) {
        cacheAudio(t.audioUrl).catch(() => {});
      }
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

  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const currentTrack = player.current || allTracks[0];

  const navItems: { screen: Screen; icon: typeof Search; label: string }[] = [
    { screen: "catalog", icon: Search, label: "Catálogo" },
    { screen: "library", icon: Library, label: "Biblioteca" },
    { screen: "favorites", icon: Bookmark, label: "Favoritos" },
    { screen: "profile", icon: User, label: "Perfil" },
  ];

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
        {screen === "catalog" && (
          <CatalogScreen
            tracks={allTracks}
            isLoading={isLoadingData}
            user={user}
            onSelectTrack={selectAndPlay}
            onOpenProfile={() => setScreen("profile")}
          />
        )}
        {screen === "library" && <LibraryScreen liked={liked} tracks={allTracks} onSelectTrack={selectAndPlay} />}
        {screen === "favorites" && <FavoritesScreen favorited={favorited} tracks={allTracks} onSelectTrack={selectAndPlay} />}
        {screen === "profile" && <ProfileScreen user={user} setUser={setUser} />}
      </div>

      {/* Mini Player */}
      {currentTrack && (
        <div className="mini-player" onClick={() => setShowPlayer(true)}>
          <img
            src={currentTrack?.coverUrl || DEFAULT_COVER}
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
      )}

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        {navItems.map(({ screen: s, icon: Icon, label }) => {
          const isProfileTab = s === "profile";
          return (
            <button
              key={s}
              className={`nav-btn ${screen === s ? "active" : ""}`}
              onClick={() => setScreen(s)}
            >
              {isProfileTab && userAvatar ? (
                <img
                  src={userAvatar}
                  alt="Perfil"
                  className={`w-6 h-6 rounded-full object-cover border ${
                    screen === "profile" ? "border-purple-400 ring-2 ring-purple-500/50" : "border-gray-500"
                  }`}
                />
              ) : (
                <Icon size={22} />
              )}
              <span className="nav-label">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
