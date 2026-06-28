import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  fetchPacks,
  createPack,
  updatePack,
  deletePack,
  formatPreco,
  GENEROS,
  type Pack,
  type PackInput,
} from "@/lib/packs";
import { packImage } from "@/lib/pack-images";
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
    meta: [
      { title: "Admin — Gerenciar Packs | TopDJ" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const emptyForm: PackInput = {
  nome: "",
  genero: "Pop",
  preco: 0,
  descricao: "",
  imagem_url: "",
  destaque: false,
};

function Admin() {
  const queryClient = useQueryClient();
  const { data: packs = [], isLoading } = useQuery({
    queryKey: ["packs"],
    queryFn: fetchPacks,
  });

  const [editing, setEditing] = useState<Pack | null>(null);
  const [form, setForm] = useState<PackInput>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["packs"] });
  }

  const createMut = useMutation({
    mutationFn: (input: PackInput) => createPack(input),
    onSuccess: () => {
      invalidate();
      toast.success("Pack criado!");
      resetForm();
    },
    onError: (e: Error) => toast.error("Erro ao criar", { description: e.message }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: PackInput }) =>
      updatePack(id, input),
    onSuccess: () => {
      invalidate();
      toast.success("Pack atualizado!");
      resetForm();
    },
    onError: (e: Error) => toast.error("Erro ao atualizar", { description: e.message }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePack(id),
    onSuccess: () => {
      invalidate();
      toast.success("Pack excluído.");
    },
    onError: (e: Error) => toast.error("Erro ao excluir", { description: e.message }),
  });

  function resetForm() {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
  }

  function startCreate() {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(true);
  }

  function startEdit(pack: Pack) {
    setEditing(pack);
    setForm({
      nome: pack.nome,
      genero: pack.genero,
      preco: pack.preco,
      descricao: pack.descricao ?? "",
      imagem_url: pack.imagem_url ?? "",
      destaque: pack.destaque,
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: PackInput = {
      ...form,
      preco: Number(form.preco) || 0,
      descricao: form.descricao?.trim() || null,
      imagem_url: form.imagem_url?.trim() || null,
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, input: payload });
    } else {
      createMut.mutate(payload);
    }
  }

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Painel Admin</h1>
          <p className="text-muted-foreground">Gerencie os packs da loja.</p>
        </div>
        <Button
          onClick={startCreate}
          className="bg-[image:var(--gradient-primary)] font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="mr-1 h-4 w-4" />
          Novo Pack
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {editing ? "Editar Pack" : "Novo Pack"}
            </h2>
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
                onValueChange={(v) => setForm((f) => ({ ...f, genero: v }))}
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
                min="0"
                required
                value={form.preco}
                onChange={(e) =>
                  setForm((f) => ({ ...f, preco: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="imagem">URL da imagem (opcional)</Label>
              <Input
                id="imagem"
                value={form.imagem_url ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, imagem_url: e.target.value }))
                }
                placeholder="https://... (vazio usa imagem do gênero)"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              rows={3}
              value={form.descricao ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, descricao: e.target.value }))
              }
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
          <ul className="divide-y divide-border">
            {packs.map((pack) => (
              <li key={pack.id} className="flex items-center gap-4 p-4">
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
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => startEdit(pack)}
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    if (confirm(`Excluir "${pack.nome}"?`)) deleteMut.mutate(pack.id);
                  }}
                  aria-label="Excluir"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
