import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User, Camera, MapPin, Edit3, Save, X, Repeat, Download, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TrackRow } from "@/components/TrackRow";
import { fetchPacks } from "@/lib/packs";
import { getSavedTrackIds, getUserReposts } from "@/lib/social";
import { getUserDownloads } from "@/lib/orders";
import { getProfile, updateProfile, uploadImage, type UserProfile } from "@/lib/profile";
import { packImage } from "@/lib/pack-images";
import { useAudioPlayer } from "@/lib/audio-player";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [{ title: "Meu Perfil — TopDJ" }],
  }),
  component: Perfil,
});

function Perfil() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
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

  const { data: allPacks = [], isLoading } = useQuery({
    queryKey: ["packs"],
    queryFn: fetchPacks,
  });

  const savedPacks = allPacks.filter((p) => savedIds.includes(p.id));

  const { data: reposts = [] } = useQuery({
    queryKey: ["userReposts"],
    queryFn: getUserReposts,
    enabled: !!user,
  });

  const { data: downloads = [], isLoading: isLoadingDownloads } = useQuery({
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

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatars" | "banners",
  ) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      setUploadingImage(true);
      toast.loading(`Enviando ${type === "avatars" ? "foto" : "banner"}...`, { id: "upload" });
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

  if (!user) return null;

  // Derivar imagens a mostrar
  const displayAvatar = profile?.avatar_url || user.user_metadata?.avatar_url;
  const displayBanner =
    profile?.banner_url ||
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=2574&auto=format&fit=crop";
  const displayNome =
    profile?.apelido || profile?.nome_completo || user.user_metadata?.full_name || "Membro TopDJ";
  const displaySubNome = profile?.apelido ? profile.nome_completo : "";
  const displayLocation = profile?.cidade
    ? `${profile.cidade}${profile.estado ? `, ${profile.estado}` : ""}`
    : "";

  return (
    <div className="bg-background min-h-screen pb-12">
      {/* BANNER GIGANTE */}
      <div className="relative w-full h-[300px] md:h-[350px] bg-muted overflow-hidden group">
        <img src={displayBanner} alt="Banner" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Trocar capa: sempre disponível, visível ao passar o mouse (ou sempre em mobile) */}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={bannerInputRef}
          onChange={(e) => handleImageUpload(e, "banners")}
        />
        <button
          onClick={() => bannerInputRef.current?.click()}
          disabled={uploadingImage}
          className="absolute top-20 left-4 flex items-center gap-2 rounded-md bg-black/50 px-3 py-2 text-sm font-semibold text-white opacity-100 transition-opacity hover:bg-black/70 disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100 z-10"
        >
          <Camera className="w-4 h-4" />
          {uploadingImage ? "Enviando..." : "Trocar capa"}
        </button>

        {/* Botão de Logout */}
        <div className="absolute top-20 right-4 flex gap-2 z-10">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleLogout}
            className="bg-black/50 text-white hover:bg-black/70 border-none"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* CONTAINER DO PERFIL SOBREPOSTO */}
        <div className="absolute bottom-6 left-4 md:left-10 flex items-end gap-4 md:gap-6 w-full max-w-5xl pr-4">
          {/* Avatar */}
          <div className="relative">
            <div className="h-32 w-32 md:h-48 md:w-48 rounded-full border-4 border-black overflow-hidden bg-muted shadow-2xl flex items-center justify-center shrink-0">
              {displayAvatar ? (
                <img src={displayAvatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-16 w-16 text-muted-foreground" />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={avatarInputRef}
              onChange={(e) => handleImageUpload(e, "avatars")}
            />
            <button
              disabled={uploadingImage}
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-primary text-primary-foreground p-2 md:p-3 rounded-full shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
              aria-label="Trocar foto de perfil"
            >
              <Camera className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          {/* Textos: Nome, Sobrenome, Local */}
          <div className="flex-1 pb-2 md:pb-4 text-white">
            {!isEditing ? (
              <div className="flex flex-col gap-1.5 items-start">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight bg-black/60 px-3 py-1 rounded inline-block">
                  {displayNome}
                </h1>
                {displaySubNome && (
                  <h2 className="text-sm md:text-base font-semibold bg-black/60 px-2 py-0.5 rounded text-white/90 inline-block">
                    {displaySubNome}
                  </h2>
                )}
                {displayLocation && (
                  <div className="flex items-center gap-1 text-xs md:text-sm text-white/80 font-medium bg-black/60 px-2 py-1 rounded mt-1 inline-flex">
                    <MapPin className="w-3.5 h-3.5" />
                    {displayLocation}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-black/70 p-4 rounded-xl space-y-3 w-full max-w-md border border-white/10 backdrop-blur-md">
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
                    <Label className="text-white/70 text-xs">Estado / País</Label>
                    <Input
                      className="bg-black/50 border-white/20 text-white h-8 text-sm"
                      placeholder="Ex: ES, Brasil"
                      value={editForm.estado || ""}
                      onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação na Direita */}
          <div className="hidden md:flex flex-col gap-2 pb-4 shrink-0">
            {!isEditing ? (
              <Button
                onClick={startEditing}
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20"
              >
                <Edit3 className="w-4 h-4 mr-2" /> Editar Perfil
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => saveProfileMut.mutate(editForm)}
                  disabled={saveProfileMut.isPending}
                  className="bg-[image:var(--gradient-primary)] text-white border-none shadow-lg"
                >
                  <Save className="w-4 h-4 mr-2" /> Salvar
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="secondary"
                  className="bg-black/50 text-white hover:bg-black/70 border-none"
                >
                  <X className="w-4 h-4 mr-2" /> Cancelar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE ACTION BUTTONS (abaixo do banner) */}
      <div className="md:hidden flex gap-2 p-4 border-b border-border">
        {!isEditing ? (
          <Button onClick={startEditing} variant="outline" className="w-full">
            <Edit3 className="w-4 h-4 mr-2" /> Editar Perfil
          </Button>
        ) : (
          <>
            <Button
              onClick={() => saveProfileMut.mutate(editForm)}
              disabled={saveProfileMut.isPending}
              className="flex-1 bg-[image:var(--gradient-primary)]"
            >
              <Save className="w-4 h-4 mr-2" /> Salvar
            </Button>
            <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1">
              <X className="w-4 h-4 mr-2" /> Cancelar
            </Button>
          </>
        )}
      </div>

      {/* MEUS DOWNLOADS (liberados após pagamento) */}
      <div className="container mx-auto px-4 md:px-10 mt-8 max-w-7xl">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b border-border/50 flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          Meus Downloads
        </h2>

        {isLoadingDownloads ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            Carregando seu histórico...
          </div>
        ) : downloads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <p className="text-muted-foreground">
              Você ainda não comprou nenhum álbum ou faixa. Seus downloads aparecem aqui após o
              pagamento ser confirmado.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {downloads.map((d, idx) => (
              <div
                key={`${d.pedidoId}-${idx}`}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div>
                  <p className="font-semibold">{d.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.tipo === "pack" ? "Álbum completo" : "Faixa individual"} · Comprado em{" "}
                    {new Date(d.comprado_em).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {d.url ? (
                  <Button size="sm" className="gap-2 font-bold shrink-0" asChild>
                    <a href={d.url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" /> Baixar
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground italic shrink-0">
                    Link ainda não disponível
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REPOSTS (atalhos de faixas que o usuário repostou) */}
      <div className="container mx-auto px-4 md:px-10 mt-10 max-w-7xl">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b border-border/50 flex items-center gap-2">
          <Repeat className="w-5 h-5 text-primary" />
          Reposts
        </h2>

        {reposts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <p className="text-muted-foreground">
              Faça repost de faixas que você gostou para elas aparecerem aqui como atalho.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {reposts.map((r) => {
              const track = r.tracks;
              if (!track) return null;
              const isCurrent = current?.id === track.id;
              const isThisPlaying = isCurrent && isPlaying;

              function handlePlayRepost() {
                if (isCurrent) {
                  toggle();
                } else {
                  play({
                    id: track!.id,
                    title: track!.title,
                    audioUrl: track!.audio_url,
                    coverUrl: track!.packs?.imagem_url
                      ? packImage(track!.packs.imagem_url, track!.packs.genero)
                      : undefined,
                  });
                }
              }

              return (
                <div
                  key={r.track_id}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card p-3"
                >
                  <button
                    onClick={handlePlayRepost}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden relative group"
                  >
                    {track.packs?.imagem_url && (
                      <img
                        src={packImage(track.packs.imagem_url, track.packs.genero)}
                        alt={track.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isThisPlaying ? (
                        <Pause className="h-5 w-5 text-white fill-current" />
                      ) : (
                        <Play className="h-5 w-5 text-white fill-current" />
                      )}
                    </span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn("font-semibold truncate", isCurrent && "text-primary")}>
                      {track.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {track.packs?.nome ?? "Álbum"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONTEÚDO PRINCIPAL (Músicas) */}
      <div className="container mx-auto px-4 md:px-10 mt-10 max-w-7xl">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b border-border/50">Músicas Salvas</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            Carregando sua biblioteca...
          </div>
        ) : savedPacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/30 rounded-xl border border-dashed border-border">
            <h3 className="text-xl font-bold mb-2">Sua biblioteca está vazia</h3>
            <p className="text-muted-foreground max-w-md">
              Você ainda não salvou nenhuma música. Volte para a loja e clique no botão de salvar
              nas suas faixas favoritas!
            </p>
            <Button
              className="mt-6 bg-[image:var(--gradient-primary)]"
              onClick={() => navigate({ to: "/loja" })}
            >
              Explorar a Loja
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-4xl">
            {savedPacks.map((pack) => (
              <TrackRow key={pack.id} pack={pack} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
