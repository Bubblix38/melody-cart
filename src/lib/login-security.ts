/**
 * Sistema de proteção avançada para login
 * - Rate limiting exponencial
 * - Detecção de anomalias (novo IP, país, dispositivo)
 * - Captcha para múltiplas tentativas
 * - Alertas de segurança
 */

interface LoginAttempt {
  email: string;
  ip: string;
  userAgent: string;
  timestamp: number;
  success: boolean;
  country?: string;
  city?: string;
  fingerprint: string;
}

interface RateLimitState {
  attempts: number;
  lastAttemptTime: number;
  blockedUntil: number | null;
  failureStreak: number;
}

const LOGIN_ATTEMPTS_MAP = new Map<string, RateLimitState>();
const LOGIN_HISTORY: LoginAttempt[] = [];
const MAX_HISTORY = 10000;

// Limites para rate limiting exponencial
const RATE_LIMITS = {
  INITIAL_WINDOW: 60_000, // 1 minuto
  ATTEMPTS_PER_WINDOW: 5,
  EXPONENTIAL_BACKOFF: 2, // Multiplica por 2 a cada violação
  MAX_BACKOFF: 3_600_000, // 1 hora max
};

/**
 * Gera fingerprint do dispositivo/navegador
 */
export function generateDeviceFingerprint(): string {
  const navigator_info = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    plugins: Array.from(navigator.plugins || []).map((p) => p.name).join(","),
  };

  // Hash simples (em produção, usar biblioteca como fingerprintjs2)
  const str = JSON.stringify(navigator_info);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `fp_${Math.abs(hash).toString(16)}`;
}

/**
 * Obtém IP e informações de localização (cliente-side aproximação)
 */
async function getClientLocationInfo(): Promise<{
  ip: string;
  country: string;
  city: string;
}> {
  try {
    const resp = await fetch("https://ipapi.co/json/", {
      headers: { Accept: "application/json" },
    });
    const data = await resp.json();
    return {
      ip: data.ip || "unknown",
      country: data.country_name || "unknown",
      city: data.city || "unknown",
    };
  } catch {
    return { ip: "unknown", country: "unknown", city: "unknown" };
  }
}

/**
 * Verifica se um login deve ser bloqueado por rate limiting
 */
export function checkRateLimit(
  identifier: string,
  ipOrEmail: string
): { allowed: boolean; reason?: string; requiresCaptcha: boolean } {
  const now = Date.now();
  const key = `${identifier}:${ipOrEmail}`;

  let state = LOGIN_ATTEMPTS_MAP.get(key) || {
    attempts: 0,
    lastAttemptTime: now,
    blockedUntil: null,
    failureStreak: 0,
  };

  // Verificar se está bloqueado
  if (state.blockedUntil && now < state.blockedUntil) {
    const remainingMs = state.blockedUntil - now;
    return {
      allowed: false,
      reason: `Bloqueado por segurança. Tente novamente em ${Math.ceil(remainingMs / 1000)}s`,
      requiresCaptcha: true,
    };
  }

  state.blockedUntil = null; // Liberar se passou do tempo

  // Calcular janela de tempo (aumenta com cada falha)
  const window = RATE_LIMITS.INITIAL_WINDOW * Math.pow(RATE_LIMITS.EXPONENTIAL_BACKOFF, state.failureStreak);
  const timeSinceLastAttempt = now - state.lastAttemptTime;

  // Reset se passou da janela
  if (timeSinceLastAttempt > window) {
    state.attempts = 0;
    state.failureStreak = 0;
  }

  state.attempts++;
  state.lastAttemptTime = now;

  if (state.attempts > RATE_LIMITS.ATTEMPTS_PER_WINDOW) {
    // Calcular tempo de bloqueio (exponencial)
    const backoffMs = Math.min(
      RATE_LIMITS.INITIAL_WINDOW * Math.pow(RATE_LIMITS.EXPONENTIAL_BACKOFF, state.failureStreak),
      RATE_LIMITS.MAX_BACKOFF
    );
    state.blockedUntil = now + backoffMs;
    state.failureStreak++;

    LOGIN_ATTEMPTS_MAP.set(key, state);

    return {
      allowed: false,
      reason: `Muitas tentativas. Bloqueado por ${Math.ceil(backoffMs / 1000)}s`,
      requiresCaptcha: true,
    };
  }

  LOGIN_ATTEMPTS_MAP.set(key, state);

  // Se há alguma falha, avisar
  const requiresCaptcha = state.failureStreak > 0;
  return { allowed: true, requiresCaptcha };
}

/**
 * Registra tentativa de login (sucesso ou falha)
 */
export async function recordLoginAttempt(email: string, success: boolean): Promise<void> {
  const fingerprint = generateDeviceFingerprint();
  const location = await getClientLocationInfo();

  const attempt: LoginAttempt = {
    email: email.toLowerCase(),
    ip: location.ip,
    country: location.country,
    city: location.city,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
    success,
    fingerprint,
  };

  LOGIN_HISTORY.push(attempt);

  // Manter limite de histórico
  if (LOGIN_HISTORY.length > MAX_HISTORY) {
    LOGIN_HISTORY.shift();
  }

  // Se falha, investigar anomalia
  if (!success) {
    detectAnomalies(email, attempt);
  }
}

/**
 * Detecta anomalias de segurança (novo IP, país, dispositivo)
 */
function detectAnomalies(email: string, currentAttempt: LoginAttempt): void {
  const previousLogins = LOGIN_HISTORY.filter((a) => a.email === email && a.success);

  if (previousLogins.length === 0) {
    // Primeiro login conhecido
    return;
  }

  const lastSuccessful = previousLogins[previousLogins.length - 1];
  const anomalies: string[] = [];

  // Detectar novo IP
  if (lastSuccessful.ip !== currentAttempt.ip) {
    anomalies.push(`Novo IP: ${currentAttempt.ip} (último: ${lastSuccessful.ip})`);
  }

  // Detectar novo país
  if (lastSuccessful.country !== currentAttempt.country) {
    anomalies.push(`Novo país: ${currentAttempt.country} (último: ${lastSuccessful.country})`);
  }

  // Detectar novo dispositivo (fingerprint)
  if (lastSuccessful.fingerprint !== currentAttempt.fingerprint) {
    anomalies.push(`Novo dispositivo: ${currentAttempt.fingerprint}`);
  }

  if (anomalies.length > 0) {
    // Alertar (em produção: enviar email, log de auditoria, etc.)
    console.warn(`[LOGIN ANOMALY] ${email}:`, anomalies);
    
    // TODO: Enviar email de confirmação para o admin
    // TODO: Registrar no banco de auditoria
  }
}

/**
 * Obtém histórico de logins para auditoria
 */
export function getLoginHistory(emailFilter?: string): LoginAttempt[] {
  if (emailFilter) {
    return LOGIN_HISTORY.filter((a) => a.email === emailFilter.toLowerCase());
  }
  return LOGIN_HISTORY;
}

/**
 * Limpa rate limit para um email/IP (admin action)
 */
export function clearRateLimit(identifier: string, ipOrEmail: string): void {
  const key = `${identifier}:${ipOrEmail}`;
  LOGIN_ATTEMPTS_MAP.delete(key);
}

/**
 * Exporta estado de rate limiting (debug)
 */
export function getRateLimitDebug() {
  const entries: Record<string, RateLimitState> = {};
  LOGIN_ATTEMPTS_MAP.forEach((value, key) => {
    entries[key] = value;
  });
  return entries;
}
