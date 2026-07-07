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
// Comparação em tempo constante para strings hex (evita timing attacks)
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Verifica a assinatura do webhook do Stripe usando Web Crypto (compatível com Workers).
// A assinatura é calculada como HMAC-SHA256 de `${timestamp}.${rawBody}`.
async function verifyStripeSignature(
  payload: string,
  sigHeader: string | null,
  secret: string,
  toleranceSec = 300,
): Promise<boolean> {
  if (!sigHeader) return false;

  let timestamp = "";
  const signatures: string[] = [];
  for (const part of sigHeader.split(",")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === "t") timestamp = value;
    else if (key === "v1") signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) return false;

  const ts = parseInt(timestamp, 10);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > toleranceSec) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`));
  const expected = [...new Uint8Array(sigBuffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signatures.some((sig) => timingSafeEqualHex(sig, expected));
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

      // Parse URL once at the beginning
      const url = new URL(request.url);

      // Validação CSRF server-side: verificar Origin/Referer em mutações
      if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
        const origin = request.headers.get("origin");
        const referer = request.headers.get("referer");
        const host = request.headers.get("host") || "";
        const csrfHeader = request.headers.get("X-CSRF-Token");
        const csrfCookie = request.headers.get("cookie")?.split(";").find((c) => c.includes("__Host-csrf-token"));

        // Validar Origin
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
              return new Response("Forbidden: Invalid Origin", { status: 403 });
            }
          } catch {
            return new Response("Forbidden: Invalid Origin URL", { status: 403 });
          }
        }

        // Validar CSRF via Double-Submit Cookie
        // Para /admin, /api/packs*, /api/tracks*, exigir CSRF válido
        const isProtectedPath = url.pathname.startsWith("/admin") ||
                               url.pathname.startsWith("/api/packs") ||
                               url.pathname.startsWith("/api/tracks");

        if (isProtectedPath && request.method !== "GET") {
          // Exigir CSRF header + cookie
          if (!csrfHeader || !csrfCookie) {
            securityLogger.log(
              "suspicious",
              clientIP,
              request.headers.get("user-agent") || "",
              "CSRF token ausente em mutação protegida",
            );
            return new Response("Forbidden: CSRF token required", { status: 403 });
          }

          // Extrair token do cookie
          const cookieToken = csrfCookie.split("__Host-csrf-token=")[1]?.split(";")[0];
          if (!cookieToken || cookieToken !== csrfHeader) {
            securityLogger.log(
              "suspicious",
              clientIP,
              request.headers.get("user-agent") || "",
              "CSRF token mismatch ou inválido",
            );
            return new Response("Forbidden: CSRF validation failed", { status: 403 });
          }
        }
      }

      // Processar endpoints especiais (CSRF init, Webhook, etc)

      // Endpoint para inicialização de token CSRF (Define HttpOnly SameSite Cookie)
      if (request.method === "POST" && url.pathname === "/api/security/csrf-init") {
        try {
          const body = await request.json();
          const token = body.token;

          if (!token || typeof token !== "string" || token.length < 32) {
            return new Response("Invalid CSRF token", { status: 400 });
          }

          // Definir cookie HttpOnly com SameSite=Strict (máxima proteção)
          const response = new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": `__Host-csrf-token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`,
            },
          });

          return response;
        } catch (err) {
          console.error("Erro ao processar CSRF init:", err);
          return new Response("CSRF init error", { status: 400 });
        }
      }

      // Webhook do Stripe
      if (request.method === "POST" && url.pathname === "/api/webhook") {
        try {
          const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_67VM5gISABrIujxUnvW2ngNyjTcDkUjn";
          if (!webhookSecret) {
            console.error("STRIPE_WEBHOOK_SECRET não configurado; webhook rejeitado.");
            return new Response("Webhook não configurado", { status: 500 });
          }

          // Assinatura precisa ser verificada sobre o corpo bruto (raw body)
          const rawBody = await request.text();
          const signature = request.headers.get("stripe-signature");

          const verified = await verifyStripeSignature(rawBody, signature, webhookSecret);
          if (!verified) {
            securityLogger.log(
              "suspicious",
              clientIP,
              request.headers.get("user-agent") || "",
              "Assinatura de webhook Stripe inválida",
            );
            return new Response("Assinatura inválida", { status: 400 });
          }

          const body = JSON.parse(rawBody);

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
