import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTracks, createTrack, deleteTrack, updateTrack, type TrackInput, type Track } from "@/lib/tracks";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Trash2, Pencil, Plus, X, ListPlus } from "lucide-react";
import { toast } from "sonner";
import { formatPreco } from "@/lib/packs";

const ALLOWED_AUDIO_DOMAINS = ["supabase.co", "amazonaws.com", "cloudinary.com"];

function isValidAudioUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_AUDIO_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

/** Deriva um título legível a partir do nome do arquivo na URL. */
function titleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const fileName = decodeURIComponent(parsed.pathname.split("/").pop() || "faixa");
    return fileName.replace(/\.[^./]+$/, "").replace(/[-_]+/g, " ").trim() || "Faixa";
  } catch {
    return "Faixa";
  }
}

type BulkLine = { title: string; url: string; valid: boolean };

function parseBulkInput(raw: string): BulkLine[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // Aceita "Título | URL" ou apenas "URL"
      const [maybeTitle, maybeUrl] = line.split("|").map((s) => s.trim());
      const url = maybeUrl || maybeTitle;
      const title = maybeUrl ? maybeTitle : titleFromUrl(url);
      return { title, url, valid: isValidAudioUrl(url) };
    });
}

export function AdminTrackManager({ packId }: { packId: string }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Track | null>(null);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkPrice, setBulkPrice] = useState(0.5);
  const [bulkImporting, setBulkImporting] = useState(false);

  const [form, setForm] = useState<TrackInput>({
    pack_id: packId,
    title: "",
    audio_url: "",
    download_url: "",
    price: 0.50,
    duration: 0,
  });

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ["tracks", packId],
    queryFn: () => fetchTracks(packId),
  });

  const createMut = useMutation({
    mutationFn: createTrack,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks", packId] });
      toast.success("Faixa adicionada com sucesso!");
      resetForm();
    },
    onError: (e: Error) => toast.error("Erro ao adicionar faixa", { description: e.message }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TrackInput> }) => updateTrack(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks", packId] });
      toast.success("Faixa atualizada!");
      resetForm();
    },
    onError: (e: Error) => toast.error("Erro ao atualizar", { description: e.message }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteTrack,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks", packId] });
      toast.success("Faixa removida.");
    },
    onError: (e: Error) => toast.error("Erro ao excluir", { description: e.message }),
  });

  function resetForm() {
    setForm({
      pack_id: packId,
      title: "",
      audio_url: "",
      download_url: "",
      price: 0.50,
      duration: 0,
    });
    setEditing(null);
    setShowForm(false);
  }

  function handleEdit(track: Track) {
    setEditing(track);
    setForm({
      pack_id: track.pack_id,
      title: track.title,
      audio_url: track.audio_url,
      download_url: track.download_url || "",
      price: track.price,
      duration: track.duration || 0,
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      download_url: form.download_url?.trim() || null,
      price: Number(form.price) || 0,
      duration: Number(form.duration) || 0,
    };

    if (editing) {
      updateMut.mutate({ id: editing.id, input: payload });
    } else {
      createMut.mutate(payload);
    }
  }

  async function handleBulkImport() {
    const lines = parseBulkInput(bulkText);
    if (lines.length === 0) {
      toast.error("Cole ao menos uma URL de áudio.");
      return;
    }
    const invalid = lines.filter((l) => !l.valid);
    if (invalid.length > 0) {
      toast.error(`${invalid.length} URL(s) inválida(s) ou de domínio não permitido.`, {
        description: "Use apenas links do Supabase Storage, Amazon S3 ou Cloudinary.",
      });
      return;
    }

    setBulkImporting(true);
    let success = 0;
    let failed = 0;
    for (const line of lines) {
      try {
        await createTrack({
          pack_id: packId,
          title: line.title,
          audio_url: line.url,
          download_url: null,
          price: Number(bulkPrice) || 0,
          duration: null,
        });
        success++;
      } catch {
        failed++;
      }
    }
    setBulkImporting(false);
    queryClient.invalidateQueries({ queryKey: ["tracks", packId] });

    if (failed === 0) {
      toast.success(`${success} faixas importadas com sucesso!`);
      setBulkText("");
      setShowBulkForm(false);
    } else {
      toast.warning(`${success} importadas, ${failed} falharam.`);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-card/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">Músicas do Álbum</h3>
        {!showForm && !showBulkForm && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowBulkForm(true)} variant="outline">
              <ListPlus className="w-4 h-4 mr-1" /> Importar em Lote
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)} variant="secondary">
              <Plus className="w-4 h-4 mr-1" /> Nova Faixa
            </Button>
          </div>
        )}
      </div>

      {showBulkForm && (
        <div className="mb-6 space-y-4 rounded-lg bg-card p-4 border border-border">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-sm">Importar Faixas em Lote</h4>
            <button type="button" onClick={() => setShowBulkForm(false)}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Cole uma URL de áudio por linha (Supabase Storage, S3 ou Cloudinary). Opcionalmente,
            informe o título antes da URL separado por <code className="rounded bg-muted px-1">|</code>:
            <br />
            <span className="font-mono">Faixa 01 | https://.../faixa01.mp3</span>
          </p>
          <Textarea
            rows={8}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"https://xxxx.supabase.co/storage/v1/object/public/musicas/faixa01.mp3\nhttps://xxxx.supabase.co/storage/v1/object/public/musicas/faixa02.mp3"}
            className="font-mono text-xs"
          />
          <div className="space-y-1 max-w-[200px]">
            <Label>Preço avulso padrão (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(Number(e.target.value))}
            />
          </div>
          <Button onClick={handleBulkImport} disabled={bulkImporting} className="w-full">
            {bulkImporting ? "Importando..." : "Importar Faixas"}
          </Button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-4 rounded-lg bg-card p-4 border border-border">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-sm">{editing ? "Editar Faixa" : "Adicionar Nova Faixa"}</h4>
            <button type="button" onClick={resetForm}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Título da Faixa</Label>
              <Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Track 01" />
            </div>
            <div className="space-y-1">
              <Label>Preço Avulso (R$)</Label>
              <Input required type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>URL do Áudio para Preview (Ouvir no site)</Label>
              <Input required type="url" value={form.audio_url} onChange={e => setForm({ ...form, audio_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Link do Google Drive (Download após compra)</Label>
              <Input type="url" value={form.download_url ?? ""} onChange={e => setForm({ ...form, download_url: e.target.value })} placeholder="https://drive.google.com/..." />
            </div>
            <div className="space-y-1">
              <Label>Duração (em segundos)</Label>
              <Input type="number" value={form.duration ?? 0} onChange={e => setForm({ ...form, duration: Number(e.target.value) })} placeholder="Ex: 180" />
            </div>
          </div>
          <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="w-full">
            {editing ? "Salvar Alterações" : "Adicionar Faixa"}
          </Button>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : tracks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma faixa cadastrada ainda.</p>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
          {tracks.map(track => (
            <li key={track.id} className="flex items-center justify-between p-3 text-sm bg-card">
              <div className="flex flex-col">
                <span className="font-semibold">{track.title}</span>
                <span className="text-xs text-muted-foreground">
                  Preview: {track.audio_url ? "Sim" : "Não"} | Drive: {track.download_url ? "Sim" : "Não"} | {formatPreco(track.price)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={() => handleEdit(track)}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { if(confirm("Excluir faixa?")) deleteMut.mutate(track.id) }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
