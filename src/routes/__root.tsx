import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CartProvider } from "@/lib/cart";
import { AudioPlayerProvider } from "@/lib/audio-player";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TopDJ" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <AudioPlayerProvider>
            <CartProvider>
              <div style={{ padding: "20px" }}>
                <h1>TopDJ - Site em Teste</h1>
                <Outlet />
              </div>
            </CartProvider>
          </AudioPlayerProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
