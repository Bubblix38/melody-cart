import { Link, useNavigate } from "@tanstack/react-router";
import { Search, User, Disc3, ShoppingCart, Check, LogOut, Menu, X, Home, Folder, Bell, Users, ArrowDownToLine } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { getProfile } from "@/lib/profile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <header className="bg-black fixed top-0 z-50 w-full h-16 border-b border-white/5 select-none">
      <div className="w-full h-full flex items-center justify-between px-6">
        
        {/* 1. Left: Logo Canto Esquerdo Spotify */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1fdf64] text-black shadow-md transition-transform group-hover:scale-105">
            <Disc3 className="h-6 w-6 animate-spin-slow" />
          </div>
          <span className="font-sans text-xl font-extrabold tracking-tighter text-white">
            TOP<span className="text-[#1fdf64]">DJ</span>
          </span>
        </Link>

        {/* 2. Center: Entalhe Spotify (Home Circle Pill + Search Input Box) */}
        <div className="hidden md:flex items-center gap-2 max-w-xl w-full mx-auto justify-center">
          {/* Circular Home Button */}
          <Link
            to="/"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white transition-all hover:scale-105"
            title="Início"
          >
            <Home className="h-6 w-6" />
          </Link>

          {/* Search Capsule Input */}
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-[#b3b3b3] pointer-events-none" />
            <input
              type="text"
              placeholder="O que você quer ouvir?"
              className="w-full h-12 rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] pl-12 pr-12 text-sm text-white placeholder-[#b3b3b3] outline-none border border-transparent focus:border-white/20 transition-all font-medium"
            />
            <div className="absolute right-4 flex items-center border-l border-white/10 pl-3 text-[#b3b3b3] hover:text-white cursor-pointer" title="Navegar">
              <Folder className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* 3. Right: Premium, Install App, Bell, Friend Activity & Avatar */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Ver planos Premium Pill */}
          <Link
            to="/loja"
            className="hidden xl:inline-flex items-center justify-center px-4 py-2 rounded-full bg-white hover:bg-white/90 text-black text-xs font-bold transition-transform hover:scale-105 shrink-0"
          >
            Ver planos Premium
          </Link>

          {/* Instalar aplicativo */}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); alert("O aplicativo PWA está pronto para instalação no seu dispositivo!"); }}
            className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-[#b3b3b3] hover:text-white transition-colors py-1.5 px-3 rounded-full hover:bg-white/10"
          >
            <ArrowDownToLine className="h-4 w-4" />
            <span>Instalar aplicativo</span>
          </a>

          {/* Notifications / Bell */}
          <button className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] text-[#b3b3b3] hover:text-white transition-colors cursor-pointer" title="Novidades">
            <Bell className="h-4 w-4" />
          </button>

          {/* Friend Activity / Users Icon */}
          <button className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] text-[#b3b3b3] hover:text-white transition-colors cursor-pointer" title="Atividade dos amigos">
            <Users className="h-4 w-4" />
          </button>

          {/* Cart Icon */}
          <button
            onClick={() => setOpen(true)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
            aria-label="Carrinho"
          >
            <ShoppingCart className="h-4 w-4" />
            {totalItens > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1fdf64] px-1 text-[10px] font-black text-black">
                {totalItens}
              </span>
            )}
          </button>

          {/* User Profile Avatar Circle */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 cursor-pointer group" aria-label="Menu da conta">
                  <div className="h-9 w-9 overflow-hidden rounded-full border border-white/20 bg-white/10 transition-transform group-hover:scale-105">
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
              <DropdownMenuContent align="end" className="w-48 bg-[#282828] border-white/10 text-white">
                <DropdownMenuItem asChild>
                  <Link to="/perfil" className="cursor-pointer hover:bg-white/10">
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 hover:bg-white/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" className="px-5 py-2 rounded-full bg-white text-black font-extrabold text-xs hover:scale-105 transition-transform">
              Entrar
            </Link>
          )}

          {/* Mobile Menu Trigger */}
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
        <div className="md:hidden fixed top-16 left-0 w-full bg-[#121212]/95 backdrop-blur-xl border-b border-white/10 z-40 animate-in slide-in-from-top duration-200">
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
