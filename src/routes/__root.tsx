import { createFileRoute, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { FixedPlayer } from "@/components/FixedPlayer";
import { CartDrawer } from "@/components/CartDrawer";
import { CartProvider } from "@/lib/cart";
import { AudioPlayerProvider } from "@/lib/audio-player";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import TopDJMobile from "@/components/mobile/TopDJMobile";
import "@/styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export const Route = createFileRoute("__root")({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
      { title: "TopDJ — A Maior Loja de Packs de Música Eletrônica e Funk do Brasil" },
      { name: "description", content: "Baixe os melhores packs de música para DJs. Produções de alta qualidade em WAV/MP3 320kbps. Lançamentos semanais." },
    ],
  }),
  component: RootLayout,
});

function RootLayout() {
  const [startProtection, setStartProtection] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);

    const timer = setTimeout(() => {
      setStartProtection(true);
    }, 1500);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!startProtection) return;

    let devtoolsOpen = false;
    const threshold = 160;

    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if ((widthThreshold || heightThreshold) && !devtoolsOpen) {
        devtoolsOpen = true;
      }
    };

    const interval = setInterval(checkDevTools, 1000);
    return () => clearInterval(interval);
  }, [startProtection]);

  return (
    <QueryClientProvider client={queryClient}>
      <AudioPlayerProvider>
        <CartProvider>
          {/* Interface Mobile (exibida estritamente em telas de celular por CSS) */}
          <div className="block md:hidden min-h-screen bg-[#0a0a0f]">
            <TopDJMobile />
          </div>

          {/* Interface Desktop (exibida estritamente em telas grandes por CSS) */}
          <div className="hidden md:flex h-screen w-screen overflow-hidden flex-col bg-black select-none">
            <Header />
            <main className="flex-1 overflow-hidden bg-black relative">
              <Outlet />
            </main>
            <FixedPlayer />
          </div>

          <CartDrawer />
          <Toaster position="top-center" richColors theme="dark" />
        </CartProvider>
      </AudioPlayerProvider>
    </QueryClientProvider>
  );
}
