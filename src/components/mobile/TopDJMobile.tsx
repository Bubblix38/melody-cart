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
  Share2,
  Home,
  Search,
  Library,
  ChevronLeft,
  ChevronDown,
  MoreVertical,
  Globe,
  Check,
  Plus,
  ArrowDownToLine,
  Cast,
  FolderPlus,
  Sparkles,
  User,
  LogOut,
} from "lucide-react";
import "./TopDJMobile.css";

type Screen = "home" | "search" | "library" | "premium" | "create" | "profile";

function formatTime(s: number): string {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const DEFAULT_COVER = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&w=600&q=80";

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

function SpotifyMainDisplay({
  spotlightPack,
  tracks,
  isLoading,
  player,
  liked,
  downloaded,
  onSelectTrack,
  onToggleLike,
  onToggleDownload,
}: {
  spotlightPack: Pack | undefined;
  tracks: PlayerTrack[];
  isLoading: boolean;
  player: any;
  liked: Set<string>;
  downloaded: Set<string>;
  onSelectTrack: (t: PlayerTrack) => void;
  onToggleLike: (id: string) => void;
  onToggleDownload: (id: string) => void;
}) {
  const coverUrl = spotlightPack?.imagem_url || tracks[0]?.coverUrl || DEFAULT_COVER;
  const title = spotlightPack?.nome || "FUNK COM ELETRÔNICA 😈";
  const desc = spotlightPack?.descricao || "CLIQUE NO (+) PARA RECEBER MÚSICA NOVA TODA SEMANA — funk com música eletrônica, tech house, e os melhores remixes!";
  const dj = spotlightPack?.dj || "HUB Records";

  return (
    <div className="spotify-main-screen">
      {/* Top Bar Header */}
      <div className="spotify-top-bar">
        <button className="spotify-icon-btn"><ChevronLeft size={26} /></button>
        <div className="spotify-top-title">TopDJ Mobile</div>
        <button className="spotify-icon-btn"><MoreVertical size={22} /></button>
      </div>

      {/* Album / Playlist Cover Display */}
      <div className="spotify-cover-section">
        <div className="spotify-cover-wrapper">
          <img src={coverUrl} alt={title} className="spotify-cover-img" />
        </div>
      </div>

      {/* Metadata Section */}
      <div className="spotify-meta-section">
        <h1 className="spotify-playlist-title">{title}</h1>
        
        <p className="spotify-playlist-desc">
          {desc}{" "}
          <span className="spotify-see-more">Veja mais</span>
        </p>

        <div className="spotify-publisher-row">
          <div className="spotify-publisher-badge">
            <span className="spotify-badge-x">✕</span>
          </div>
          <span className="spotify-publisher-name">{dj}</span>
        </div>

        <div className="spotify-stats-row">
          <Globe size={14} className="spotify-stats-icon" />
          <span>289.480 salvamentos • 3h 40min</span>
        </div>
      </div>

      {/* Spotify Action Controls Bar */}
      <div className="spotify-action-bar">
        <div className="spotify-action-left">
          <button className="spotify-action-btn pill-btn" title="Minha lista">
            <FolderPlus size={20} />
          </button>
          
          <button 
            className="spotify-action-btn circle-btn active-green" 
            title="Salvar"
          >
            <div className="green-circle-check"><Check size={14} color="#121212" strokeWidth={3} /></div>
          </button>

          <button 
            className="spotify-action-btn circle-btn"
            title="Baixar"
          >
            <ArrowDownToLine size={20} />
          </button>

          <button className="spotify-action-btn circle-btn" title="Compartilhar">
            <Share2 size={20} />
          </button>
        </div>

        <div className="spotify-action-right">
          <button 
            className={`spotify-action-btn circle-btn shuffle-toggle ${player.isShuffle ? "active-green" : ""}`}
            onClick={player.toggleShuffle}
            title="Aleatório"
          >
            <Shuffle size={20} className={player.isShuffle ? "text-green" : ""} />
          </button>

          {/* Signature Spotify Big Green Play Button */}
          <button 
            className="spotify-big-play-btn" 
            onClick={() => {
              if (player.isPlaying) {
                player.toggle();
              } else if (tracks.length > 0) {
                if (!player.current) player.play(tracks[0], tracks);
                else player.toggle();
              }
            }} 
            title="Tocar"
          >
            {player.isPlaying ? (
              <Pause size={26} fill="#121212" color="#121212" />
            ) : (
              <Play size={26} fill="#121212" color="#121212" style={{ marginLeft: 3 }} />
            )}
          </button>
        </div>
      </div>

      {/* Tracklist / Músicas */}
      <div className="spotify-tracklist-section">
        <h3 className="spotify-section-header">Músicas ({isLoading ? "..." : tracks.length})</h3>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="spotify-track-list">
            {tracks.map((t) => {
              const isSelected = player.current?.id === t.id;
              return (
                <div 
                  key={t.id} 
                  className={`spotify-track-row ${isSelected ? "playing-row" : ""}`}
                  onClick={() => onSelectTrack(t)}
                >
                  <img src={t.coverUrl || DEFAULT_COVER} alt={t.title} className="spotify-track-thumb" />
                  
                  <div className="spotify-track-info">
                    <span className={`spotify-track-title ${isSelected ? "green-text" : ""}`}>
                      {t.title}
                    </span>
                    <span className="spotify-track-artist">
                      {t.artist || dj}
                    </span>
                  </div>

                  {isSelected && player.isPlaying ? (
                    <Equalizer active={true} barCount={3} />
                  ) : (
                    <button className="spotify-track-options" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical size={20} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchScreen() {
  return (
    <div className="spotify-screen-tab">
      <h2 className="spotify-tab-title">Buscar</h2>
      <div className="spotify-search-box">
        <Search size={20} className="search-icon-gray" />
        <input type="text" placeholder="O que você quer ouvir?" className="spotify-search-input" />
      </div>
      <div className="spotify-genre-grid">
        {["Podcasts", "Lançamentos", "Funk", "Eletrônica", "Pop", "Hip-Hop", "Rock", "Sertanejo"].map((cat, i) => (
          <div key={cat} className="spotify-genre-card" style={{ backgroundColor: ["#e1306c", "#8400e7", "#1e3264", "#e8115b", "#27856a", "#8d67ab", "#7d4b32", "#ba5d07"][i % 8] }}>
            <span>{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LibraryScreen({ liked, tracks, onSelectTrack }: { liked: Set<string>; tracks: PlayerTrack[]; onSelectTrack: (t: PlayerTrack) => void }) {
  const likedTracks = tracks.filter((t) => liked.has(t.id));
  return (
    <div className="spotify-screen-tab">
      <h2 className="spotify-tab-title">Sua Biblioteca</h2>
      <div className="spotify-lib-filters">
        <span className="lib-chip active">Playlists</span>
        <span className="lib-chip">Artistas</span>
        <span className="lib-chip">Álbuns</span>
      </div>
      <div className="spotify-track-list" style={{ marginTop: 16 }}>
        {likedTracks.length === 0 ? (
          <p style={{ color: "#b3b3b3", padding: "16px 0" }}>Nenhuma música favoritada ainda.</p>
        ) : (
          likedTracks.map((t) => (
            <div key={t.id} className="spotify-track-row" onClick={() => onSelectTrack(t)}>
              <img src={t.coverUrl || DEFAULT_COVER} alt="" className="spotify-track-thumb" />
              <div className="spotify-track-info">
                <span className="spotify-track-title">{t.title}</span>
                <span className="spotify-track-artist">{t.artist}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PremiumScreen() {
  return (
    <div className="spotify-screen-tab">
      <h2 className="spotify-tab-title">Spotify Premium</h2>
      <div className="spotify-premium-card">
        <h3>Aproveite 3 meses por R$ 0,00</h3>
        <p>Ouça sem anúncios, offline e com áudio em alta qualidade.</p>
        <button className="spotify-premium-btn">Seja Premium</button>
      </div>
    </div>
  );
}

function CreateScreen() {
  return (
    <div className="spotify-screen-tab">
      <h2 className="spotify-tab-title">Criar</h2>
      <p style={{ color: "#b3b3b3", marginTop: 12 }}>Crie novas playlists ou adicione suas músicas favoritas.</p>
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
        queryParams: { prompt: "select_account" },
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
    <div className="spotify-screen-tab">
      <h2 className="spotify-tab-title">Perfil</h2>
      {!user ? (
        <div style={{ background: "#181818", padding: 24, borderRadius: 12, textAlign: "center" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Conecte sua conta</h3>
          <p style={{ color: "#b3b3b3", fontSize: 13, marginBottom: 16 }}>
            Faça login com sua Conta Google para sincronizar favoritos e playlists.
          </p>
          <button
            onClick={handleGoogleLogin}
            style={{ width: "100%", padding: 12, borderRadius: 24, background: "#ffffff", color: "#000", fontWeight: 700, border: "none", cursor: "pointer" }}
          >
            <GoogleIcon /> Entrar com Google
          </button>
        </div>
      ) : (
        <div style={{ background: "#181818", padding: 20, borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            {userAvatar ? (
              <img src={userAvatar} alt="" style={{ width: 56, height: 56, borderRadius: "50%" }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#333", display: "flex", alignItems: "center", justifyContent: "center" }}><User size={28} /></div>
            )}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{userName}</h3>
              <p style={{ fontSize: 12, color: "#b3b3b3" }}>{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ width: "100%", padding: 10, borderRadius: 8, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <LogOut size={18} /> Sair da conta
          </button>
        </div>
      )}
    </div>
  );
}

function FullscreenPlayer({ player, liked, onToggleLike, onClose }: { player: any; liked: Set<string>; onToggleLike: (id: string) => void; onClose: () => void }) {
  const track = player.current || { title: "Música TopDJ", artist: "TopDJ", coverUrl: DEFAULT_COVER, id: "empty" };
  const progress = player.duration ? (player.currentTime / player.duration) * 100 : 0;

  return (
    <div className="spotify-fullscreen-player">
      <div className="spotify-player-header">
        <button className="spotify-icon-btn" onClick={onClose}><ChevronDown size={28} /></button>
        <div className="spotify-player-header-info">
          <span className="sub">TOCANDO DA PLAYLIST</span>
          <span className="main">TopDJ Oficial</span>
        </div>
        <button className="spotify-icon-btn"><MoreVertical size={24} /></button>
      </div>

      <div className="spotify-player-art-stage">
        <img src={track.coverUrl || DEFAULT_COVER} alt={track.title} className="spotify-player-art-img" />
      </div>

      <div className="spotify-player-meta-bar">
        <div className="spotify-player-titles">
          <h2 className="title">{track.title}</h2>
          <p className="artist">{track.artist}</p>
        </div>
        <button 
          className="spotify-heart-btn"
          onClick={() => onToggleLike(track.id)}
        >
          <Heart size={24} fill={liked.has(track.id) ? "#1fdf64" : "none"} color={liked.has(track.id) ? "#1fdf64" : "#ffffff"} />
        </button>
      </div>

      <div className="spotify-player-progress-area">
        <div 
          className="spotify-progress-bar-container"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            if (player.duration) player.seek(pct * player.duration);
          }}
        >
          <div className="spotify-progress-bg">
            <div className="spotify-progress-fill" style={{ width: `${progress}%` }} />
            <div className="spotify-progress-knob" style={{ left: `${progress}%` }} />
          </div>
        </div>
        <div className="spotify-progress-labels">
          <span>{formatTime(player.currentTime)}</span>
          <span>{formatTime(player.duration)}</span>
        </div>
      </div>

      <div className="spotify-player-controls-row">
        <button className={`spotify-ctrl-btn ${player.isShuffle ? "active-green" : ""}`} onClick={player.toggleShuffle}>
          <Shuffle size={20} />
        </button>
        <button className="spotify-ctrl-btn" onClick={player.prev}>
          <SkipBack size={28} />
        </button>
        <button className="spotify-main-play-circle" onClick={player.toggle}>
          {player.isPlaying ? (
            <Pause size={32} fill="#121212" color="#121212" />
          ) : (
            <Play size={32} fill="#121212" color="#121212" style={{ marginLeft: 3 }} />
          )}
        </button>
        <button className="spotify-ctrl-btn" onClick={player.next}>
          <SkipForward size={28} />
        </button>
        <button className={`spotify-ctrl-btn ${player.isRepeat ? "active-green" : ""}`} onClick={player.toggleRepeat}>
          {player.isRepeat ? <Repeat1 size={20} /> : <Repeat size={20} />}
        </button>
      </div>

      <div className="spotify-player-footer-tools">
        <button className="spotify-icon-btn"><Cast size={18} /></button>
        <button className="spotify-icon-btn"><Share2 size={18} /></button>
      </div>
    </div>
  );
}

export default function TopDJMobile() {
  const [screen, setScreen] = useState<Screen>("home");
  const [user, setUser] = useState<any>(null);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());

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

  const toggleDownload = (id: string) => {
    setDownloaded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const currentTrack = player.current || allTracks[0];

  const navItems: { screen: Screen; icon: typeof Home; label: string }[] = [
    { screen: "home", icon: Home, label: "Início" },
    { screen: "search", icon: Search, label: "Buscar" },
    { screen: "library", icon: Library, label: "Sua Biblioteca" },
    { screen: "premium", icon: Sparkles, label: "Premium" },
    { screen: "create", icon: Plus, label: "Criar" },
  ];

  return (
    <div className="spotify-app-container">
      <div className="spotify-content-body">
        {screen === "home" && (
          <SpotifyMainDisplay
            spotlightPack={spotlightPack}
            tracks={allTracks.length > 0 ? allTracks : [
              { id: "1", title: "FUNK COM ELETRÔNICA 😈", artist: "HUB Records", audioUrl: "", coverUrl: DEFAULT_COVER },
              { id: "2", title: "Trinta e Oito (VIP Mix)", artist: "GIU", audioUrl: "", coverUrl: DEFAULT_COVER },
              { id: "3", title: "Acid", artist: "GIU", audioUrl: "", coverUrl: DEFAULT_COVER },
            ]}
            isLoading={isLoadingData}
            player={player}
            liked={liked}
            downloaded={downloaded}
            onSelectTrack={selectAndPlay}
            onToggleLike={toggleLike}
            onToggleDownload={toggleDownload}
          />
        )}
        {screen === "search" && <SearchScreen />}
        {screen === "library" && <LibraryScreen liked={liked} tracks={allTracks} onSelectTrack={selectAndPlay} />}
        {screen === "premium" && <PremiumScreen />}
        {screen === "create" && <CreateScreen />}
        {screen === "profile" && <ProfileScreen user={user} setUser={setUser} />}
      </div>

      {/* Mini Player */}
      {currentTrack && (
        <div className="spotify-mini-player" onClick={() => setShowFullPlayer(true)}>
          <img src={currentTrack.coverUrl || DEFAULT_COVER} alt="" className="mini-thumb" />
          <div className="mini-details">
            <span className="mini-title">{currentTrack.title}</span>
            <span className="mini-artist">{currentTrack.artist}</span>
          </div>
          <div className="mini-controls" onClick={(e) => e.stopPropagation()}>
            <button className="mini-icon-btn"><Cast size={20} /></button>
            <button 
              className="mini-icon-btn" 
              onClick={() => toggleLike(currentTrack.id)}
            >
              {liked.has(currentTrack.id) ? (
                <Check size={20} className="green-text" />
              ) : (
                <Plus size={20} />
              )}
            </button>
            <button className="mini-play-btn" onClick={player.toggle}>
              {player.isPlaying ? <Pause size={22} fill="#ffffff" /> : <Play size={22} fill="#ffffff" />}
            </button>
          </div>
        </div>
      )}

      {/* Spotify Bottom Nav */}
      <nav className="spotify-bottom-nav">
        {navItems.map(({ screen: s, icon: Icon, label }) => (
          <button 
            key={s} 
            className={`spotify-nav-tab ${screen === s ? "active" : ""}`} 
            onClick={() => setScreen(s)}
          >
            <Icon size={24} />
            <span className="spotify-nav-label">{label}</span>
          </button>
        ))}
      </nav>

      {/* Fullscreen Player Modal */}
      {showFullPlayer && (
        <FullscreenPlayer player={player} liked={liked} onToggleLike={toggleLike} onClose={() => setShowFullPlayer(false)} />
      )}
    </div>
  );
}
