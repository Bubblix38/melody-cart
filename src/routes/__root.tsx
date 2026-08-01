import { type ReactNode, useEffect } from "react";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  Link,
  useRouter,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { logSecurityEvent } from "@/lib/security-logger";
import { CartProvider } from "@/lib/cart";
import { BackgroundThemeProvider } from "@/lib/background-theme";
import { AudioPlayerProvider } from "@/lib/audio-player";
import { useDevToolsProtection } from "@/lib/devtools-protection";
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import { Toaster } from "@/components/ui/sonner";
import { FixedPlayer } from "@/components/FixedPlayer";
import { BackgroundScene } from "@/components/BackgroundScene";
import { SpotifySidebar } from "@/components/SpotifySidebar";
import { SpotifyRightSidebar } from "@/components/SpotifyRightSidebar";
import TopDJMobile from "@/components/mobile/TopDJMobile";
import appCss from "@/styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado. Tente atualizar ou voltar ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
      { title: "TopDJ — A Maior Loja de Packs de Música Eletrônica e Funk do Brasil" },
      { name: "description", content: "Baixe os melhores packs de música para DJs. Produções de alta qualidade em WAV/MP3 320kbps. Lançamentos semanais." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="custom-scrollbar selection:bg-primary/30 bg-black text-white">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { startProtection } = useDevToolsProtection();

  useEffect(() => {
    const stopProtection = startProtection();
    if (localStorage.getItem("HONEYPOT_BANNED") === "true") {
      logSecurityEvent("honeypot_triggered", { note: "Usuário bloqueado permanentemente retornou" });
      document.body.innerHTML =
        "<h1 style='color:red; text-align:center; margin-top:20%'>PERMANENT BAN</h1>";
      window.location.href = "https://www.fbi.gov/investigate/cyber";
    }
    return () => {
      stopProtection();
    };
  }, [startProtection]);

  return (
    <QueryClientProvider client={queryClient}>
      <BackgroundThemeProvider>
        <AudioPlayerProvider>
          <CartProvider>
            {/* Interface Mobile (exibida estritamente em telas de celular por CSS) */}
            <div className="block md:hidden min-h-screen bg-[#0a0a0f]">
              <TopDJMobile />
            </div>

            {/* Interface Desktop (exibida estritamente em telas grandes por CSS) */}
            <div className="hidden md:flex h-screen w-screen overflow-hidden flex-col bg-black select-none">
              <main className="flex-1 w-full h-full relative z-10 overflow-hidden">
                <Outlet />
              </main>
              <CartDrawer />
            </div>

            <Toaster position="top-center" richColors theme="dark" />
          </CartProvider>
        </AudioPlayerProvider>
      </BackgroundThemeProvider>
    </QueryClientProvider>
  );
}
