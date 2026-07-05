import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ChevronDown, User, Disc3, ShoppingCart, Palette, Check, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { getProfile } from "@/lib/profile";
import { BACKGROUND_THEMES, useBackgroundTheme } from "@/lib/background-theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { to: "/", label: "Início" },
  { to: "/mais-ouvidas", label: "Feed" },
  { to: "/loja", label: "Biblioteca" },
] as const;

function BackgroundThemePicker() {
  const { theme, setTheme } = useBackgroundTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 transition-colors hover:bg-white/10"
          aria-label="Escolher fundo da página"
        >
          <Palette className="h-4 w-4 text-white/60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Fundo da página</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {BACKGROUND_THEMES.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className="flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2">
              <span
                className="h-4 w-4 rounded-full border border-white/20"
                style={{ background: t.swatch }}
              />
              {t.label}
            </span>
            {theme === t.id && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const { totalItens, setOpen } = useCart();
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: getProfile,
    enabled: !!session?.user?.id,
  });

  const displayAvatar = profile?.avatar_url || session?.user?.user_metadata?.avatar_url;

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="glass-nav fixed top-0 z-50 w-full border-b border-white/10">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-8 px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20">
            <Disc3 className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight text-white">
            TOPDJ
          </span>
        </Link>

        {/* Navigation & Search */}
        <div className="hidden flex-1 items-center gap-6 md:flex">
          <nav className="flex items-center gap-6">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sm font-semibold text-white/60 transition-colors hover:text-white"
                activeProps={{ className: "text-white" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <div className="relative max-w-xl flex-1">
            <input
              type="text"
              placeholder="Pesquisar faixas, artistas, podcasts"
              className="w-full rounded-md border-none bg-white/5 px-4 py-1.5 text-sm outline-hidden transition-all focus:bg-white/10 focus:ring-1 focus:ring-primary"
            />
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 lg:gap-6">
          <button className="hidden rounded-md bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary transition-colors hover:bg-primary/20 sm:block">
            Atualizar agora
          </button>
          <a href="#" className="hidden text-sm text-white/60 transition-colors hover:text-white lg:block">
            Estúdio de Artista
          </a>

          {/* Profile & Cart */}
          <div className="flex items-center gap-4 border-l border-white/10 pl-6">
            <BackgroundThemePicker />
            <button
              onClick={() => setOpen(true)}
              className="relative flex h-8 w-8 items-center justify-center rounded-md bg-white/5 transition-colors hover:bg-white/10"
              aria-label="Carrinho"
            >
              <ShoppingCart className="h-4 w-4 text-white/60" />
              {totalItens > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">
                  {totalItens}
                </span>
              )}
            </button>

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 group" aria-label="Menu da conta">
                    <div className="h-8 w-8 overflow-hidden rounded-full border border-white/20 bg-white/10 transition-colors group-hover:border-primary/50">
                      {displayAvatar ? (
                        <img src={displayAvatar} alt="Perfil" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-white/40">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <ChevronDown className="h-3 w-3 text-white/40 transition-colors group-hover:text-white" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/perfil" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" className="text-sm font-bold text-primary hover:underline">
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

