import { ShieldCheck, Truck, Headphones, Disc3 } from "lucide-react";

const beneficios = [
  { icon: ShieldCheck, label: "Pagamento Seguro" },
  { icon: Truck, label: "Envio Rápido" },
  { icon: Headphones, label: "Suporte 24h" },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 border-b border-border/60 pb-8 sm:grid-cols-3">
          {beneficios.map((b) => (
            <div key={b.label} className="flex items-center justify-center gap-3 sm:justify-start">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-secondary">
                <b.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold">{b.label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[image:var(--gradient-brand)] text-primary-foreground">
              <Disc3 className="h-4 w-4" />
            </span>
            <span className="font-bold">
              <span className="text-gradient">Top</span>DJ
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TopDJ. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
