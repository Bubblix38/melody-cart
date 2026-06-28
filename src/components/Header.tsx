import { Link } from "@tanstack/react-router";
import { ShoppingCart, Disc3, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/", label: "Início" },
  { to: "/mais-ouvidas", label: "Mais Ouvidas" },
  { to: "/loja", label: "Loja de Álbuns" },
  { to: "/contato", label: "Contato" },
] as const;

export function Header() {
  const { totalItens, setOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--gradient-brand)] text-primary-foreground shadow-[var(--shadow-glow)]">
            <Disc3 className="h-5 w-5" />
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-gradient">Top</span>
            <span className="text-foreground">DJ</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="hidden rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Admin
          </Link>
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir carrinho"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItens > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] px-1 text-[11px] font-bold text-primary-foreground">
                {totalItens}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border/40 md:hidden",
          mobileOpen ? "max-h-80" : "max-h-0",
          "transition-[max-height] duration-300",
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "text-foreground bg-muted" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
