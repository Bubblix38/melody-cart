import { useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User, Camera, Edit3, Save, X, MoreHorizontal, Clock, Play, Pause, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fetchPacks } from "@/lib/packs";
import { getSavedTrackIds, getUserLikedTracks } from "@/lib/social";
import { getUserDownloads } from "@/lib/orders";
import { getProfile, updateProfile, uploadImage, type UserProfile } from "@/lib/profile";
import { packImage } from "@/lib/pack-images";
import { useAudioPlayer, type PlayerTrack } from "@/lib/audio-player";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { SpotifySidebar } from "@/components/SpotifySidebar";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [{ title: "Meu Perfil — TopDJ" }],
  }),
  component: Perfil,
});

function TrackDuration({ audioUrl }: { audioUrl: string }) {
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    const onLoadedMetadata = () => {
      if (audio.duration && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.src = "";
    };
  }, [audioUrl]);

  if (!duration) return <span>--:--</span>;
  return (
    <span>
      {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
    </span>
  );
}

function Perfil() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/login" });
      } else {
        setUser(data.session.user);
      }
    });
  }, [navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: getProfile,
    enabled: !!user,
  });

  const { data: savedIds = [] } = useQuery({
    queryKey: ["savedTrackIds"],
    queryFn: getSavedTrackIds,
    enabled: !!user,
  });

  const { data: allPacks = [] } = useQuery({
    queryKey: ["packs"],
    queryFn: fetchPacks,
  });

  const savedPacks = allPacks.filter((p) => savedIds.includes(p.id));

  const { data: likedTracks = [] } = useQuery({
    queryKey: ["userLikedTracks"],
    queryFn: getUserLikedTracks,
    enabled: !!user,
  });

  const { data: downloads = [] } = useQuery({
    queryKey: ["userDownloads"],
    queryFn: getUserDownloads,
    enabled: !!user,
  });

  const { current, isPlaying, play, toggle } = useAudioPlayer();

  const saveProfileMut = useMutation({
    mutationFn: (data: Partial<UserProfile>) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setIsEditing(false);
      toast.success("Perfil atualizado!");
    },
    onError: () => toast.error("Erro ao salvar perfil"),
  });

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  function startEditing() {
    setEditForm({
      apelido: profile?.apelido || "",
      nome_completo: profile?.nome_completo || user?.user_metadata?.full_name || "",
      cidade: profile?.cidade || "",
      estado: profile?.estado || "",
    });
    setIsEditing(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, type: "avatars" | "banners") {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      setUploadingImage(true);
      toast.loading(`Enviando foto...`, { id: "upload" });
      const url = await uploadImage(file, type);
      await updateProfile({ [type === "avatars" ? "avatar_url" : "banner_url"]: url });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Imagem atualizada com sucesso!", { id: "upload" });
    } catch (err: any) {
      toast.error("Erro ao subir imagem: " + err.message, { id: "upload" });
    } finally {
      setUploadingImage(false);
    }
  }

  useGSAP(() => {
    if (!containerRef.current) return;
    const tl = gsap.timeline();
    tl.fromTo(".gsap-sidebar-left", 
      { x: -50, opacity: 0 }, 
      { x: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
    )
    .fromTo(".gsap-profile-header",
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
      "-=0.4"
    )
    .fromTo(".gsap-profile-content",
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
      "-=0.5"
    );
  }, { scope: containerRef });

  if (!user) return null;

  const displayAvatar = profile?.avatar_url || user.user_metadata?.avatar_url;
  const displayNome = profile?.apelido || profile?.nome_completo || user.user_metadata?.full_name || "Membro TopDJ";

  const queue: PlayerTrack[] = likedTracks.map((r) => {
    const track = r.tracks!;
    return {
      id: track.id,
      title: track.title,
      artist: displayNome,
      audioUrl: track.audio_url,
      coverUrl: track.packs?.imagem_url ? packImage(track.packs.imagem_url, track.packs.genero) : "",
    };
  });

  const handlePlayRepost = (trackId: string) => {
    if (current?.id === trackId) {
      toggle();
      return;
    }
    const track = queue.find(t => t.id === trackId);
    if (track) play(track, queue);
  };

  return (
    <div ref={containerRef} className="h-[calc(100vh-56px)] w-full flex bg-transparent overflow-hidden p-2 gap-2 text-white font-sans selection:bg-spotify-green/30">
      
      {/* Barra Lateral Esquerda */}
      <div className="gsap-sidebar-left flex shrink-0">
        <SpotifySidebar />
      </div>

      {/* Área Central Principal */}
      <main className="flex-1 bg-spotify-base rounded-lg overflow-y-auto custom-scrollbar relative flex flex-col">
        
        {/* Banner Gradiente Estilo Spotify */}
        <div className="gsap-profile-header relative flex items-end px-8 pb-6 pt-24 bg-gradient-to-b from-[#8C157E] to-spotify-base shadow-2xl">
          <div className="flex items-end gap-6 w-full relative z-10">
            {/* Avatar Gigante */}
            <div className="relative group shrink-0">
              <div className="h-48 w-48 rounded-full border-4 border-transparent shadow-2xl overflow-hidden bg-[#282828] flex items-center justify-center">
                {displayAvatar ? (
                  <img src={displayAvatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-20 w-20 text-spotify-subtext" />
                )}
                
                {/* Overlay de edição (visível no hover) */}
                <div 
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Camera className="w-10 h-10 mb-2" />
                  <span className="text-sm font-semibold">Escolher foto</span>
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={avatarInputRef}
                onChange={(e) => handleImageUpload(e, "avatars")}
              />
            </div>

            {/* Informações do Perfil */}
            <div className="flex flex-col gap-2 pb-2 flex-1">
              {!isEditing ? (
                <>
                  <span className="text-sm font-medium uppercase tracking-widest text-white/90">Perfil</span>
                  <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
                    {displayNome}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-white/90 font-medium mt-3">
                    <span className="text-white">{savedPacks.length} playlists salvas</span>
                    <span>•</span>
                    <span>{likedTracks.length} faixas curtidas</span>
                    <span>•</span>
                    <span>{downloads.length} compras</span>
                  </div>
                </>
              ) : (
                <div className="bg-black/40 p-4 rounded-xl space-y-3 w-full max-w-md border border-white/10 backdrop-blur-md">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-white/70 text-xs">Apelido Artístico</Label>
                      <Input
                        className="bg-black/50 border-white/20 text-white h-8 text-sm"
                        placeholder="Ex: DJ Bubbli"
                        value={editForm.apelido || ""}
                        onChange={(e) => setEditForm({ ...editForm, apelido: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-white/70 text-xs">Nome Real</Label>
                      <Input
                        className="bg-black/50 border-white/20 text-white h-8 text-sm"
                        placeholder="Seu nome"
                        value={editForm.nome_completo || ""}
                        onChange={(e) => setEditForm({ ...editForm, nome_completo: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-white/70 text-xs">Cidade</Label>
                      <Input
                        className="bg-black/50 border-white/20 text-white h-8 text-sm"
                        placeholder="Ex: Guarapari"
                        value={editForm.cidade || ""}
                        onChange={(e) => setEditForm({ ...editForm, cidade: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-white/70 text-xs">Estado</Label>
                      <Input
                        className="bg-black/50 border-white/20 text-white h-8 text-sm"
                        placeholder="Ex: ES"
                        value={editForm.estado || ""}
                        onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => saveProfileMut.mutate(editForm)}
                      disabled={saveProfileMut.isPending}
                      className="bg-spotify-green hover:bg-[#1ed760] text-black font-bold border-none"
                    >
                      <Save className="w-4 h-4 mr-2" /> Salvar
                    </Button>
                    <Button size="sm" onClick={() => setIsEditing(false)} variant="ghost" className="text-white hover:bg-white/10">
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo Abaixo do Banner */}
        <div className="gsap-profile-content flex-1 w-full bg-gradient-to-b from-black/20 to-spotify-base px-8 py-6 relative z-20">
          
          {/* Action Bar */}
          <div className="flex items-center gap-6 mb-10">
            {likedTracks.length > 0 && (
              <button 
                onClick={() => handlePlayRepost(queue[0].id)}
                className="w-14 h-14 bg-spotify-green hover:bg-[#1ed760] hover:scale-105 rounded-full flex items-center justify-center text-black transition-all shadow-[0_8px_8px_rgba(0,0,0,0.3)]"
              >
                {isPlaying && current?.id === queue[0].id ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-1" />
                )}
              </button>
            )}
            
            {!isEditing && (
              <button 
                onClick={startEditing}
                className="p-2 text-spotify-subtext hover:text-white transition-colors"
                title="Editar Perfil"
              >
                <MoreHorizontal className="w-8 h-8" />
              </button>
            )}

            <button 
              onClick={handleLogout}
              className="p-2 text-spotify-subtext hover:text-white transition-colors ml-auto flex items-center gap-2 font-bold text-sm"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>

          {/* Músicas Mais Tocadas (Reposts / Curtidas) */}
          <h2 className="text-2xl font-bold text-white mb-4">Músicas mais tocadas este mês</h2>
          
          {likedTracks.length === 0 ? (
            <p className="text-spotify-subtext text-sm mb-12">Você ainda não curtiu nenhuma música.</p>
          ) : (
            <div className="w-full text-spotify-subtext mb-12">
              <div className="flex flex-col">
                {likedTracks.map((r, index) => {
                  const track = r.tracks!;
                  const isActive = current?.id === track.id;
                  
                  return (
                    <div 
                      key={r.track_id}
                      onDoubleClick={() => handlePlayRepost(track.id)}
                      className={cn(
                        "group grid grid-cols-[32px_minmax(200px,4fr)_minmax(120px,2fr)_minmax(80px,1fr)] gap-4 px-4 py-2 hover:bg-white/10 rounded-md items-center cursor-default transition-colors",
                        isActive && "bg-white/5"
                      )}
                    >
                      <div className="relative flex items-center justify-center">
                        {isActive && isPlaying ? (
                          <button onClick={toggle} className="text-spotify-green">
                            <Pause fill="currentColor" className="w-4 h-4" />
                          </button>
                        ) : (
                          <>
                            <span className="text-base group-hover:hidden">{index + 1}</span>
                            <button onClick={() => handlePlayRepost(track.id)} className="hidden group-hover:block text-white">
                              <Play fill="currentColor" className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-3 overflow-hidden pr-2">
                        <img 
                          src={track.packs?.imagem_url ? packImage(track.packs.imagem_url, track.packs.genero) : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&w=50&h=50&fit=crop"} 
                          alt={track.title}
                          className="w-10 h-10 object-cover rounded bg-spotify-highlight shrink-0"
                        />
                        <div className="flex flex-col overflow-hidden">
                          <span onClick={() => handlePlayRepost(track.id)} className={cn("font-medium truncate group-hover:underline cursor-pointer", isActive ? "text-spotify-green" : "text-white")}>{track.title}</span>
                        </div>
                      </div>

                      <div className="hidden md:flex items-center">
                        <span className="text-sm truncate cursor-pointer hover:underline hover:text-white">
                          {track.packs?.nome ?? "Faixa Avulsa"}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-3 text-sm pr-2">
                        <TrackDuration audioUrl={track.audio_url} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Playlists Públicas (Packs Salvos) */}
          <div className="flex items-center justify-between mb-4 mt-8">
            <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">Playlists públicas</h2>
            <span className="text-sm font-bold text-spotify-subtext hover:underline cursor-pointer">Mostrar tudo</span>
          </div>
          
          {savedPacks.length === 0 ? (
            <p className="text-spotify-subtext text-sm mb-12">Você não possui nenhuma playlist pública salva.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-12">
              {savedPacks.map((pack, idx) => (
                <div 
                  key={`${pack.id}-${idx}`} 
                  onClick={() => navigate({ to: "/", search: { pack: pack.id } })}
                  className="bg-[#181818] hover:bg-[#282828] p-4 rounded-md transition-colors group cursor-pointer flex flex-col relative"
                >
                  <div className="w-full aspect-square mb-4 relative shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                    <img 
                      src={pack.imagem_url ? packImage(pack.imagem_url, pack.genero) : "https://images.unsplash.com/photo-1493225457124-a1a2a5f5c92e?auto=format&w=200&h=200&fit=crop"} 
                      alt={pack.nome} 
                      className="w-full h-full object-cover rounded-md"
                    />
                    <div className="absolute bottom-2 right-2 w-12 h-12 bg-spotify-green hover:bg-[#1ed760] hover:scale-105 rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all shadow-lg translate-y-2 group-hover:translate-y-0">
                      <Play className="w-6 h-6 fill-current ml-1" />
                    </div>
                  </div>
                  <h3 className="font-bold text-white truncate text-base mb-1">{pack.nome}</h3>
                  <p className="text-spotify-subtext text-sm truncate">
                    {pack.dj || "TopDJ Oficial"}
                  </p>
                </div>
              ))}
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
}
