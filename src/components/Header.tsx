import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ChevronDown, User, Disc3, ShoppingCart, Palette, Check, LogOut, Menu, X, Home, Folder, Bell, Users, ArrowDownToLine } from "lucide-react";
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

function BackgroundThemePicker() {
  const { theme, setTheme } = useBackgroundTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 transition-colors hover:bg-white/10 cursor-pointer"
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
  const [menuOpen, setMenuOpen] = useState(false);
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
    <header className="bg-black fixed top-0 z-50 w-full border-b border-white/5 h-14">
      <div className="w-full flex h-full items-center justify-between px-4 md:px-6">
        
        {/* 1. Left: Logo Canto Esquerdo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1ed760] text-black shadow-md transition-transform group-hover:scale-105">
            <Disc3 className="h-5 w-5 animate-spin-slow" />
          </div>
          <span className="font-display text-xl font-black tracking-tighter text-white">
            TOP<span className="text-[#1ed760]">DJ</span>
          </span>
        </Link>

        {/* 2. Center: Entalhe Spotify (Home + Search Capsule) */}
        <div className="hidden md:flex items-center gap-2 max-w-lg w-full mx-auto justify-center">
          {/* Circular Home Button */}
          <Link
            to="/"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white transition-all hover:scale-105"
            title="Início"
          >
            <Home className="h-5 w-5" />
          </Link>

          {/* Search Capsule */}
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3.5 h-5 w-5 text-white/50 pointer-events-none" />
            <input
              type="text"
              placeholder="O que você quer ouvir?"
              className="w-full rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] pl-10 pr-10 py-2.5 text-sm text-white placeholder-white/50 outline-none border border-transparent focus:border-white/20 transition-all"
            />
            <div className="absolute right-3.5 flex items-center border-l border-white/10 pl-2 text-white/40 hover:text-white cursor-pointer" title="Navegar">
              <Folder className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* 3. Right: Premium, Install App, Bell, User Avatar */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Ver planos Premium */}
          <Link
            to="/loja"
            className="hidden lg:inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white hover:bg-white/90 text-black text-xs font-bold transition-transform hover:scale-105 shrink-0"
          >
            Ver Packs PRO
          </Link>

          {/* Instalar aplicativo */}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); alert("O aplicativo PWA está pronto para instalação no seu dispositivo!"); }}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white transition-colors py-1 px-2.5 rounded-full hover:bg-white/10"
          >
            <ArrowDownToLine className="h-4 w-4" />
            <span>Instalar aplicativo</span>
          </a>

          {/* Cart Icon */}
          <button
            onClick={() => setOpen(true)}
            className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer text-white/70 hover:text-white"
            aria-label="Carrinho"
          >
            <ShoppingCart className="h-4 w-4" />
            {totalItens > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1ed760] px-1 text-[10px] font-black text-black">
                {totalItens}
              </span>
            )}
          </button>

          {/* Bell Icon */}
          <button className="relative hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-sky-400" />
          </button>

          <BackgroundThemePicker />

          {/* User Profile Avatar with glowing ring */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 cursor-pointer group" aria-label="Menu da conta">
                  <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-[#1ed760] bg-white/10 transition-transform group-hover:scale-105">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt="Perfil" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-white">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </div>
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
            <Link to="/login" className="px-4 py-1.5 rounded-full bg-white text-black font-bold text-xs hover:scale-105 transition-transform">
              Entrar
            </Link>
          )}

          {/* Hamburger Menu Trigger for Mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 transition-colors hover:bg-white/10 md:hidden cursor-pointer text-white"
            aria-label="Menu principal"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      {menuOpen && (
        <div className="md:hidden fixed top-14 left-0 w-full bg-[#121212]/95 backdrop-blur-xl border-b border-white/10 z-40 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-4 p-6">
            <Link to="/" onClick={() => setMenuOpen(false)} className="text-white font-bold py-2 border-b border-white/5 flex items-center gap-2">
              <Home className="h-4 w-4" /> Início
            </Link>
            <Link to="/loja" onClick={() => setMenuOpen(false)} className="text-white font-bold py-2 border-b border-white/5 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Packs & Loja
            </Link>
            <Link to="/perfil" onClick={() => setMenuOpen(false)} className="text-white font-bold py-2 border-b border-white/5 flex items-center gap-2">
              <User className="h-4 w-4" /> Perfil
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
