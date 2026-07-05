import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  applySecurityHeaders,
  securityCheck,
  securityLogger,
  rateLimiter,
} from "./lib/server-security";
import { vpnTorDetector } from "./lib/vpn-detection";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // Aplicar verificação de segurança
      const securityResult = await securityCheck(request);
      if (!securityResult.allowed) {
        securityLogger.log(
          "scan",
          request.headers.get("x-forwarded-for") || "unknown",
          request.headers.get("user-agent") || "",
          securityResult.reason || "Blocked by security",
        );
        return securityResult.response!;
      }

      // Rate limiting
      const clientIP =
        request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

      if (!rateLimiter.isAllowed(clientIP)) {
        securityLogger.log(
          "suspicious",
          clientIP,
          request.headers.get("user-agent") || "",
          "Rate limit exceeded",
        );

        return new Response("Rate Limit Exceeded", {
          status: 429,
          headers: {
            "Content-Type": "text/plain",
            "Retry-After": "60",
          },
        });
      }

      // Detecção de VPN/TOR/VPS
      const vpnAssessment = vpnTorDetector.analyzeAndBlock(clientIP, request.headers);
      if (vpnAssessment) {
        securityLogger.log(
          "scan",
          clientIP,
          request.headers.get("user-agent") || "",
          `IP bloqueado: ${vpnAssessment.reasons.join(", ")}`,
        );

        return new Response("Access Denied", {
          status: 403,
          headers: {
            "Content-Type": "text/plain",
          },
        });
      }

      // Validação CSRF server-side: verificar Origin/Referer em mutações
      if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
        const origin = request.headers.get("origin");
        const referer = request.headers.get("referer");
        const host = request.headers.get("host") || "";

        if (origin) {
          try {
            const originUrl = new URL(origin);
            const allowed =
              originUrl.hostname === "localhost" ||
              originUrl.hostname === "127.0.0.1" ||
              originUrl.host === host;
            if (!allowed) {
              securityLogger.log(
                "suspicious",
                clientIP,
                request.headers.get("user-agent") || "",
                `Origin inválido: ${origin}`,
              );
              return new Response("Forbidden", { status: 403 });
            }
          } catch {
            return new Response("Forbidden", { status: 403 });
          }
        }
      }

      // Webhook do Stripe
      const url = new URL(request.url);
      if (request.method === "POST" && url.pathname === "/api/webhook") {
        try {
          // Em produção seria necessário verificar a assinatura do webhook (STRIPE_WEBHOOK_SECRET)
          const body = await request.json();
          
          if (body.type === "payment_intent.succeeded") {
            const paymentIntent = body.data.object;
            const { createClient } = await import("@supabase/supabase-js");
            
            const sbAdmin = createClient(
              process.env.SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!,
              { auth: { persistSession: false, autoRefreshToken: false } }
            );

            await sbAdmin
              .from("pedidos")
              .update({ status: "pago" })
              .eq("stripe_payment_intent_id", paymentIntent.id);
              
            console.log("Webhook processado:", paymentIntent.id);
          }
          
          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          console.error("Erro no webhook:", err);
          return new Response("Webhook Error", { status: 400 });
        }
      }

      const handler = await getServerEntry();
      let response = await handler.fetch(request, env, ctx);

      // Aplicar headers de segurança
      response = applySecurityHeaders(response);

      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
