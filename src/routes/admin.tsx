import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useRef, memo } from "react";
import { Pencil, Plus, Trash2, X, LogIn, LogOut, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import {
  fetchPacks,
  createPack,
  updatePack,
  deletePack,
  uploadPackCover,
  formatPreco,
  GENEROS,
  type Pack,
  type PackInput,
} from "@/lib/packs";
import { packImage } from "@/lib/pack-images";
import { setCsrfToken, getCsrfToken, validateCsrfToken } from "@/lib/csrf";
import { useSessionSecurity } from "@/lib/session-security";
import { multiSessionManager } from "@/lib/multi-session-manager";
import { AdminTrackManager } from "@/components/AdminTrackManager";
import { SecurityLogsViewer } from "@/components/SecurityLogsViewer";
import { logSecurityEvent } from "@/lib/security-logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Gerenciar Packs | TopDJ" }, { name: "robots", content: "noindex" }],
  }),
  component: Admin,
});

const emptyForm: PackInput = {
  nome: "",
  genero: "Nacionais",
  preco: 0,
  descricao: "",
  imagem_url: "",
  arquivo_url: "",
  destaque: false,
};

function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { validate, invalidate: invalidateSession } = useSessionSecurity();

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [sessionValid, setSessionValid] = useState(false);
  const [deviceAuthorized, setDeviceAuthorized] = useState(true);

  // Proteção extrema anti-invasor
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("admin_key") === "bubblix_master_2026") {
      localStorage.setItem("ADMIN_DEVICE_AUTHORIZED", "true");
      // Limpa a URL para esconder a chave
      window.history.replaceState({}, document.title, window.location.pathname);
      toast.success("Dispositivo autorizado!");
    } else if (localStorage.getItem("ADMIN_DEVICE_AUTHORIZED") !== "true") {
      setDeviceAuthorized(false);
      logSecurityEvent("admin_access_denied", { note: "Acesso direto à rota /admin sem autorização prévia" });
      localStorage.setItem("HONEYPOT_BANNED", "true");
      document.body.innerHTML = "<h1 style='color:red; text-align:center; margin-top:20%'>PERMANENT BAN</h1>";
      window.location.href = "https://www.fbi.gov/investigate/cyber";
    }
  }, []);

  // Hooks devem estar no topo, antes de qualquer early return
  const { data: packs = [], isLoading } = useQuery({
    queryKey: ["packs"],
    queryFn: fetchPacks,
  });

  const [editing, setEditing] = useState<Pack | null>(null);
  const [form, setForm] = useState<PackInput>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [csrfToken, setCsrfTokenState] = useState<string>("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const createMut = useMutation({
    mutationFn: (input: PackInput) => createPack(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packs"] });
      toast.success("Pack criado!");
      resetForm();
    },
    onError: (e: Error) => toast.error("Erro ao criar", { description: e.message }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: PackInput }) => updatePack(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packs"] });
      toast.success("Pack atualizado!");
      resetForm();
    },
    onError: (e: Error) => toast.error("Erro ao atualizar", { description: e.message }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePack(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packs"] });
      toast.success("Pack excluído.");
    },
    onError: (e: Error) => toast.error("Erro ao excluir", { description: e.message }),
  });

  useEffect(() => {
    const checkSession = async () => {
      const validation = await validate();
      setSessionValid(validation.isValid);

      if (!validation.isValid) {
        console.warn("Sessão inválida:", validation.reason);
        await invalidateSession();
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);

      if (data.session) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.session.user.id)
          .single()
          .then(({ data: roleData, error }) => {
            if (error) {
              setIsAdmin(false);
              setAdminCheckLoading(false);
              setAuthLoading(false);
              return;
            }
            setIsAdmin(roleData?.role === "admin");
            setAdminCheckLoading(false);
            setAuthLoading(false);
          });
      } else {
        setAdminCheckLoading(false);
        setAuthLoading(false);
      }

      checkSession();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data: roleData, error }) => {
            if (error) {
              setIsAdmin(false);
              return;
            }
            setIsAdmin(roleData?.role === "admin");
          });
        checkSession();
      } else {
        setIsAdmin(false);
      }
    });
    return () => listener?.subscription.unsubscribe();
  }, [validate, invalidateSession]);

  // Inicializar token CSRF
  useEffect(() => {
    const token = getCsrfToken() || setCsrfToken();
    setCsrfTokenState(token);
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
  }

  function startCreate() {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const startEdit = useCallback((pack: Pack) => {
    setEditing(pack);
    setForm({
      nome: pack.nome,
      genero: pack.genero as PackInput["genero"],
      preco: pack.preco,
      descricao: pack.descricao ?? "",
      imagem_url: pack.imagem_url ?? "",
      arquivo_url: pack.arquivo_url ?? "",
      destaque: pack.destaque,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingCover(true);
      const url = await uploadPackCover(file);
      setForm((f) => ({ ...f, imagem_url: url }));
      toast.success("Capa enviada!");
    } catch (err) {
      toast.error("Erro ao enviar capa", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const submittedToken = formData.get("csrfToken") as string;
    if (!validateCsrfToken(submittedToken)) {
      toast.error("Erro de segurança", { description: "Token CSRF inválido" });
      return;
    }
    const payload: PackInput = {
      nome: form.nome,
      genero: form.genero,
      preco: Number(form.preco) || 0,
      descricao: form.descricao?.trim() || null,
      imagem_url: form.imagem_url?.trim() || null,
      arquivo_url: form.arquivo_url?.trim() || null,
      destaque: form.destaque,
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, input: payload });
    } else {
      createMut.mutate(payload);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");

    // Sanitizar inputs
    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoginError(error.message);
      // Registrar tentativa falha de login (Rate Limit e Auditoria)
      logSecurityEvent("login_failed", { email });
    } else if (data.session?.user) {
      // Login bem-sucedido - gerar fingerprint
      const { generateFingerprint } = await import("@/lib/session-security");
      const fingerprint = generateFingerprint();
      sessionStorage.setItem("browser-fingerprint", fingerprint);

      // Gerenciar múltiplas sessões
      const clientIP = "unknown"; // Em produção, capturar IP real
      const userAgent = navigator.userAgent;

      const sessionValidation = multiSessionManager.registerSession(
        data.session.user.id,
        clientIP,
        userAgent,
      );

      if (sessionValidation.kickedSession) {
        console.warn(`Sessão anterior encerrada: ${sessionValidation.kickedSession.ip}`);
        // Opcional: Notificar o usuário (email, toast, etc.)
      }

      if (sessionValidation.reason) {
        console.log(sessionValidation.reason);
      }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (!deviceAuthorized) {
    return null; // O invasor será redirecionado pelo useEffect
  }

  if (authLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="text-muted-foreground">Verificando autenticação...</p>
      </div>
    );
  }

  if (!session || !sessionValid) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <h1 className="mb-2 text-center text-2xl font-extrabold">Admin — Login</h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Faça login para gerenciar os packs.
          </p>
          {!sessionValid && session && (
            <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                ⚠️ Sessão inválida ou suspeita detectada. Por segurança, faça login novamente.
              </p>
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">E-mail</Label>
              <Input
                id="login-email"
                type="email"
                required
                placeholder="admin@topdj.com.br"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password">Senha</Label>
              <Input
                id="login-password"
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
            {loginError && <p className="text-sm text-destructive">{loginError}</p>}
            <Button
              type="submit"
              className="w-full bg-[image:var(--gradient-primary)] font-semibold text-primary-foreground hover:opacity-90"
            >
              <LogIn className="mr-1 h-4 w-4" />
              Entrar
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (adminCheckLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="text-muted-foreground">Verificando permissões...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)] text-center">
          <h1 className="mb-2 text-2xl font-extrabold">Acesso Negado</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Você não tem permissão de administrador para acessar esta página.
          </p>
          <Button variant="outline" onClick={() => navigate({ to: "/" })} className="font-semibold">
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Painel Admin</h1>
          <p className="text-muted-foreground">Gerencie os packs da loja.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleLogout} className="font-semibold">
            <LogOut className="mr-1 h-4 w-4" />
            Sair
          </Button>
          <Button
            onClick={startCreate}
            className="bg-[image:var(--gradient-primary)] font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="mr-1 h-4 w-4" />
            Novo Pack
          </Button>
        </div>
      </div>

      <div className="mt-8 mb-12">
        <SecurityLogsViewer />
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
        >
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{editing ? "Editar Pack" : "Novo Pack"}</h2>
            <button type="button" onClick={resetForm} aria-label="Cancelar">
              <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                required
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Pack Pop Vibes"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="genero">Gênero</Label>
              <Select
                value={form.genero}
                onValueChange={(v) => setForm((f) => ({ ...f, genero: v as PackInput["genero"] }))}
              >
                <SelectTrigger id="genero">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENEROS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preco">Preço (R$)</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.preco}
                onChange={(e) => setForm((f) => ({ ...f, preco: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="imagem">Capa do álbum</Label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  {form.imagem_url ? (
                    <img
                      src={form.imagem_url}
                      alt="Prévia da capa"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImagePlus className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleCoverUpload}
                    className="hidden"
                    id="cover-file-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {uploadingCover ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Enviando...
                      </>
                    ) : (
                      <>
                        <ImagePlus className="mr-1.5 h-4 w-4" /> Enviar capa
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">JPEG, PNG, WebP ou GIF, até 5MB.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="arquivo_url">Link de Download do Google Drive (opcional)</Label>
            <Input
              id="arquivo_url"
              value={form.arquivo_url ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, arquivo_url: e.target.value }))}
              placeholder="https://drive.google.com/..."
              type="url"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              rows={3}
              value={form.descricao ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              placeholder="Breve descrição do pack"
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="destaque"
              checked={form.destaque}
              onCheckedChange={(v) => setForm((f) => ({ ...f, destaque: v }))}
            />
            <Label htmlFor="destaque">Destacar na página inicial</Label>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-[image:var(--gradient-primary)] font-semibold text-primary-foreground hover:opacity-90"
            >
              {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar pack"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Carregando...</p>
        ) : packs.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            Nenhum pack cadastrado. Clique em "Novo Pack".
          </p>
        ) : (
          <PackList packs={packs} onEdit={startEdit} onDelete={deleteMut.mutate} />
        )}
      </div>
    </div>
  );
}

/**
 * Lista de packs isolada em um componente memoizado.
 * Evita que digitar no formulário de edição/criação re-renderize
 * (e refaça a busca de tracks de) todos os packs a cada tecla.
 */
const PackList = memo(function PackList({
  packs,
  onEdit,
  onDelete,
}: {
  packs: Pack[];
  onEdit: (pack: Pack) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <ul className="divide-y divide-border">
      {packs.map((pack) => (
        <PackRow key={pack.id} pack={pack} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  );
});

const PackRow = memo(function PackRow({
  pack,
  onEdit,
  onDelete,
}: {
  pack: Pack;
  onEdit: (pack: Pack) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-col border-b border-border/50 last:border-0">
      <div className="flex items-center gap-4 p-4">
        <img
          src={packImage(pack.imagem_url, pack.genero)}
          alt={pack.nome}
          loading="lazy"
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{pack.nome}</p>
            {pack.destaque && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-secondary">
                Destaque
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {pack.genero} · {formatPreco(pack.preco)}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button size="icon" variant="outline" onClick={() => onEdit(pack)} aria-label="Editar">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                if (confirm(`Excluir "${pack.nome}"?`)) onDelete(pack.id);
              }}
              aria-label="Excluir"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <AdminTrackManager packId={pack.id} />
      </div>
    </div>
  );
});
