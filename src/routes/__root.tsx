import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import "@fontsource/sora/500.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/sora/800.css";
import "@fontsource-variable/plus-jakarta-sans/index.css";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
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
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "generator", content: "WordPress 6.4.1" },
      { title: "TopDJ — Descubra e Compre os Melhores Álbuns" },
      {
        name: "description",
        content:
          "Descubra e compre os melhores packs de música: Nacionais, Rock, Sertanejo e Eletrônica. Pagamento seguro e envio rápido na TopDJ.",
      },
      { name: "author", content: "TopDJ" },
      { property: "og:title", content: "TopDJ — Descubra e Compre os Melhores Álbuns" },
      {
        property: "og:description",
        content:
          "Os melhores packs de música de todos os gêneros, com pagamento seguro e suporte 24h.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        httpEquiv: "Content-Security-Policy",
        content:
          "default-src 'self'; script-src 'self' https://nwsjgacmraijqyvvghoh.supabase.co https://js.stripe.com https://cdn.jsdelivr.net; style-src 'self' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; media-src 'self' https://nwsjgacmraijqyvvghoh.supabase.co; connect-src 'self' https://nwsjgacmraijqyvvghoh.supabase.co wss://nwsjgacmraijqyvvghoh.supabase.co https://api.stripe.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests;",
      },
      { name: "twitter:title", content: "TopDJ — Descubra e Compre os Melhores Álbuns" },
      { name: "description", content: "Loja de packs de música TopDJ: encontre lançamentos e sucessos de Nacionais, Rock, Sertanejo e Eletrônica. Pagamento seguro." },
      { property: "og:description", content: "Loja de packs de música TopDJ: encontre lançamentos e sucessos de Nacionais, Rock, Sertanejo e Eletrônica. Pagamento seguro." },
      { name: "twitter:description", content: "Loja de packs de música TopDJ: encontre lançamentos e sucessos de Nacionais, Rock, Sertanejo e Eletrônica. Pagamento seguro." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/20f64a2e-f7ea-486b-8d17-b979d2627c13/id-preview-54a72a15--ecf14f43-c191-48cb-861f-8fcbe0315698.lovable.app-1783349783327.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/20f64a2e-f7ea-486b-8d17-b979d2627c13/id-preview-54a72a15--ecf14f43-c191-48cb-861f-8fcbe0315698.lovable.app-1783349783327.png" },
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
      <body className="custom-scrollbar selection:bg-primary/30">
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
            <BackgroundScene />
            <div className="flex min-h-screen flex-col pb-16">
              <Header />
              <main className="flex-1">
                <Outlet />
              </main>
            </div>
            <CartDrawer />
            <FixedPlayer />
            <Toaster position="top-center" richColors theme="dark" />
          </CartProvider>
        </AudioPlayerProvider>
      </BackgroundThemeProvider>
    </QueryClientProvider>
  );
}
