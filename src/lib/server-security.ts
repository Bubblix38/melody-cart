/**
 * Middleware de segurança para o servidor
 * Integra com src/server.ts para proteger contra scanning e ataques
 */

import { SECURITY_HEADERS, securityMiddleware, detectScanningTools } from "./security-headers";

/**
 * Aplica headers de segurança em uma Response
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (value && value.length > 0) {
      headers.set(key, value);
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Middleware de segurança para requisições
 * Usar no servidor (src/server.ts)
 */
export async function securityCheck(request: Request): Promise<{
  allowed: boolean;
  reason?: string;
  response?: Response;
}> {
  try {
    const userAgent = request.headers.get("user-agent") || "";
    const ip =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    // Detectar ferramentas de scanning
    if (detectScanningTools(userAgent)) {
      console.warn(`🚨 Scanning tool detected: ${userAgent} from IP: ${ip}`);

      return {
        allowed: false,
        reason: "Scanning tool detected",
        response: new Response("Access Denied", {
          status: 403,
          headers: {
            "Content-Type": "text/plain",
          },
        }),
      };
    }

    // Validar headers suspeitos
    const headerValidation = securityMiddleware.validateRequest(
      request.headers,
      "", // Body será validado separadamente se necessário
      ip,
    );

    if (!headerValidation.isValid) {
      console.warn(`🚨 Suspicious request from IP: ${ip}`, headerValidation.threats);

      // Bloquear se IP tiver muitas tentativas suspeitas
      if (securityMiddleware.isIPBlocked(ip)) {
        return {
          allowed: false,
          reason: "IP blocked due to suspicious activity",
          response: new Response("Too Many Suspicious Requests", {
            status: 429,
            headers: {
              "Content-Type": "text/plain",
              "Retry-After": "3600",
            },
          }),
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error in security check:", error);
    // Em caso de erro, bloquear a requisição (fail-closed)
    return {
      allowed: false,
      reason: "Security check failed",
      response: new Response("Service Unavailable", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      }),
    };
  }
}

/**
 * Exemplo de integração com src/server.ts
 *
 * Adicione no início da função fetch em src/server.ts:
 *
 * export default {
 *   async fetch(request: Request, env: unknown, ctx: unknown) {
 *     // Aplicar verificação de segurança
 *     const securityResult = await securityCheck(request);
 *     if (!securityResult.allowed) {
 *       return securityResult.response!;
 *     }
 *
 *     try {
 *       const handler = await getServerEntry();
 *       const response = await handler.fetch(request, env, ctx);
 *       return applySecurityHeaders(response);
 *     } catch (error) {
 *       // ... resto do código
 *     }
 *   },
 * };
 */

/**
 * Logging de segurança para monitoramento
 */
export class SecurityLogger {
  private logs: Array<{
    timestamp: number;
    type: "scan" | "attack" | "suspicious";
    ip: string;
    userAgent: string;
    details: string;
  }> = [];

  private readonly MAX_LOGS = 1000;

  log(type: "scan" | "attack" | "suspicious", ip: string, userAgent: string, details: string) {
    const logEntry = {
      timestamp: Date.now(),
      type,
      ip,
      userAgent,
      details,
    };

    this.logs.push(logEntry);

    // Manter apenas os últimos MAX_LOGS
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    // Log no console (em produção, enviar para serviço de monitoramento)
    console.warn(`[SECURITY ${type.toUpperCase()}]`, {
      ip,
      userAgent,
      details,
      timestamp: new Date(logEntry.timestamp).toISOString(),
    });

    // TODO: Enviar para serviço de monitoramento (Sentry, DataDog, etc.)
    // await fetch('https://your-monitoring-service.com/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(logEntry),
    // });
  }

  getLogs(type?: "scan" | "attack" | "suspicious") {
    if (type) {
      return this.logs.filter((log) => log.type === type);
    }
    return this.logs;
  }

  getRecentLogs(minutes: number = 60) {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.logs.filter((log) => log.timestamp > cutoff);
  }

  clear() {
    this.logs = [];
  }
}

// Instância singleton
export const securityLogger = new SecurityLogger();

/**
 * Rate Limiter simples para requisições
 */
export class RateLimiter {
  private requests: Map<string, Array<number>> = new Map();
  private readonly WINDOW_MS = 60000; // 1 minuto
  private readonly MAX_REQUESTS = 100; // 100 requisições por minuto

  isAllowed(ip: string): boolean {
    const now = Date.now();
    const windowStart = now - this.WINDOW_MS;

    const requests = this.requests.get(ip) || [];
    const recentRequests = requests.filter((time) => time > windowStart);

    if (recentRequests.length >= this.MAX_REQUESTS) {
      return false;
    }

    // Adicionar requisição atual
    recentRequests.push(now);
    this.requests.set(ip, recentRequests);

    // Limpar requisições antigas periodicamente
    if (Math.random() < 0.01) {
      // 1% de chance de limpeza
      this.cleanup();
    }

    return true;
  }

  private cleanup() {
    const now = Date.now();
    const windowStart = now - this.WINDOW_MS;

    for (const [ip, requests] of this.requests.entries()) {
      const recent = requests.filter((time) => time > windowStart);
      if (recent.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, recent);
      }
    }
  }

  getRemainingRequests(ip: string): number {
    const now = Date.now();
    const windowStart = now - this.WINDOW_MS;
    const requests = this.requests.get(ip) || [];
    const recentRequests = requests.filter((time) => time > windowStart);

    return Math.max(0, this.MAX_REQUESTS - recentRequests.length);
  }
}

// Instância singleton
export const rateLimiter = new RateLimiter();
