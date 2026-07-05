import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — TopDJ" },
      {
        name: "description",
        content:
          "Fale com a equipe TopDJ. Tire dúvidas sobre packs de música, pagamentos e suporte.",
      },
    ],
  }),
  component: Contato,
});

const infos = [
  { icon: Mail, label: "E-mail", value: "contato@topdj.com.br" },
  { icon: Phone, label: "Telefone", value: "(11) 99999-0000" },
  { icon: MapPin, label: "Endereço", value: "São Paulo, SP" },
];

function Contato() {
  const [enviando, setEnviando] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setTimeout(() => {
      setEnviando(false);
      toast.success("Mensagem enviada!", {
        description: "Retornaremos o contato em breve.",
      });
      (e.target as HTMLFormElement).reset();
    }, 700);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold sm:text-4xl">
        Fale <span className="text-gradient">Conosco</span>
      </h1>
      <p className="mt-2 text-muted-foreground">
        Dúvidas sobre packs, pagamentos ou suporte? Envie sua mensagem.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          {infos.map((info) => (
            <div
              key={info.label}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-secondary">
                <info.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{info.label}</p>
                <p className="font-semibold">{info.value}</p>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" required placeholder="Seu nome" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required placeholder="voce@email.com" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mensagem">Mensagem</Label>
            <Textarea
              id="mensagem"
              name="mensagem"
              required
              rows={5}
              placeholder="Como podemos ajudar?"
            />
          </div>
          <Button
            type="submit"
            disabled={enviando}
            className="h-11 w-full bg-[image:var(--gradient-primary)] font-bold text-primary-foreground hover:opacity-90"
          >
            <Send className="mr-1 h-4 w-4" />
            {enviando ? "Enviando..." : "Enviar mensagem"}
          </Button>
        </form>
      </div>
    </div>
  );
}
