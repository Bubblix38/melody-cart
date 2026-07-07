/**
 * Configuração de headers de segurança HTTP
 * Protege contra ataques comuns e ferramentas de scanning
 */

export const SECURITY_HEADERS = {
  // Previne MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Previne clickjacking
  "X-Frame-Options": "DENY",

  // Habilita proteção XSS do navegador
  "X-XSS-Protection": "1; mode=block",

  // Ofuscar identidade do servidor (Decoy/Engano para bots de scanning)
  Server: "Apache",
  "X-Powered-By": "PHP/8.1.0",

  // Previne cache de dados sensíveis
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",

  // Content Security Policy
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'nonce-{NONCE}' https://zcznaozaosciiffqncjo.supabase.co https://js.stripe.com",
    "style-src 'self' 'nonce-{NONCE}'",
    "img-src 'self' data: https:",
    "font-src 'self' data: https://cdn.gpteng.co",
    "media-src 'self' https://zcznaozaosciiffqncjo.supabase.co",
    "connect-src 'self' https://zcznaozaosciiffqncjo.supabase.co wss://zcznaozaosciiffqncjo.supabase.co https://api.stripe.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),

  // Referrer Policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions Policy
  "Permissions-Policy": [
    "geolocation=()",
    "microphone=()",
    "camera=()",
    "payment=()",
    "usb=()",
  ].join(", "),

  // Strict Transport Security (HSTS)
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
};

/**
 * Detecta ferramentas de scanning e teste de penetração
 */
export function detectScanningTools(userAgent: string): boolean {
  const scanningTools = [
    "burp",
    "owasp",
    "zap",
    "nikto",
    "nmap",
    "sqlmap",
    "dirbuster",
    "gobuster",
    "wfuzz",
    "ffuf",
    "hydra",
    "medusa",
    "wpscan",
    "joomscan",
    "droopescan",
    "acunetix",
    "nessus",
    "openvas",
    "qualys",
    "rapid7",
    "insomnia",
    "postman",
    "curl",
    "wget",
    "python-requests",
    "scrapy",
    "selenium",
    "puppeteer",
    "playwright",
    "phantomjs",
    "headless",
  ];

  const lowerUA = userAgent.toLowerCase();
  return scanningTools.some((tool) => lowerUA.includes(tool));
}

/**
 * Valida headers de requisição para detectar anomalias
 */
export function validateRequestHeaders(headers: Headers): {
  isValid: boolean;
  suspiciousFields: string[];
} {
  const suspiciousFields: string[] = [];

  // Verificar User-Agent suspeito
  const userAgent = headers.get("user-agent") || "";
  if (detectScanningTools(userAgent)) {
    suspiciousFields.push("User-Agent suspeito (ferramenta de scanning)");
  }

  // Verificar se User-Agent está presente
  if (!userAgent || userAgent.length < 10) {
    suspiciousFields.push("User-Agent ausente ou muito curto");
  }

  // Verificar headers comuns em ferramentas de teste
  const burpHeaders = ["x-burp-", "x-scanner", "x-attack", "x-pentest", "x-security-test"];

  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (burpHeaders.some((burp) => lowerKey.includes(burp))) {
      suspiciousFields.push(`Header suspeito: ${key}`);
    }
  });

  // Verificar Accept headers muito amplos (comum em scanners)
  const accept = headers.get("accept") || "";
  if (accept === "*/*" && !userAgent.includes("Mozilla")) {
    suspiciousFields.push("Accept muito amplo sem User-Agent de browser");
  }

  return {
    isValid: suspiciousFields.length === 0,
    suspiciousFields,
  };
}

/**
 * Gera nonce para CSP inline scripts
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Valida origem da requisição
 */
export function validateOrigin(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false;

  try {
    const url = new URL(origin);
    return allowedOrigins.some((allowed) => {
      if (allowed === "*") return true;
      if (allowed.startsWith("*.")) {
        const domain = allowed.slice(2);
        return url.hostname === domain || url.hostname.endsWith(`.${domain}`);
      }
      return url.origin === allowed;
    });
  } catch {
    return false;
  }
}

/**
 * Detecta padrões de ataque comuns
 */
export function detectAttackPatterns(input: string): {
  isAttack: boolean;
  attackType?: string;
} {
  const attackPatterns: Record<string, RegExp[]> = {
    "SQL Injection": [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|DECLARE)\b)/i,
      /(--|\#|\/\*|\*\/)/,
      /(\bOR\b\s+\d+\s*=\s*\d+)/i,
      /(\bAND\b\s+\d+\s*=\s*\d+)/i,
      /('\s*OR\s*')/i,
      /(\bWAITFOR\b\s+DELAY)/i,
      /(\bSLEEP\s*\()/i,
      /(\bBENCHMARK\s*\()/i,
    ],
    XSS: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /<applet/gi,
      /<form/gi,
      /<input/gi,
      /<img\s+[^>]*onerror/gi,
      /<svg\s+[^>]*onload/gi,
      /<body\s+[^>]*onload/gi,
      /<input\s+[^>]*onfocus/gi,
      /<select\s+[^>]*onchange/gi,
      /<textarea\s+[^>]*onfocus/gi,
      /<button\s+[^>]*onclick/gi,
      /<a\s+[^>]*onclick/gi,
      /<div\s+[^>]*onmouseover/gi,
      /<details\s+[^>]*ontoggle/gi,
      /<video\s+[^>]*onerror/gi,
      /<audio\s+[^>]*onerror/gi,
      /<source\s+[^>]*onerror/gi,
      /<track\s+[^>]*onerror/gi,
      /<embed\s+[^>]*onerror/gi,
      /<object\s+[^>]*onerror/gi,
      /<applet\s+[^>]*onerror/gi,
      /<frame\s+[^>]*onerror/gi,
      /<frameset\s+[^>]*onerror/gi,
      /<iframe\s+[^>]*onerror/gi,
      /<script\s+[^>]*src/gi,
      /<script\s+[^>]*type/gi,
      /<script\s+[^>]*async/gi,
      /<script\s+[^>]*defer/gi,
      /<script\s+[^>]*charset/gi,
      /<script\s+[^>]*language/gi,
    ],
    "Path Traversal": [/\.\.\//g, /\.\.\\/g, /%2e%2e%2f/gi, /%2e%2e\//gi, /%252e%252e%252f/gi],
    "Command Injection": [
      /(\||;|\$\(|\`)/,
      /(\b(cat|ls|dir|type|more|less|head|tail|grep|find|whoami|id|pwd|cd|rm|cp|mv|chmod|chown|sudo|su|passwd|shadow|etc)\b)/i,
      /(\b(nc|netcat|ncat|socat|telnet|ftp|ssh|scp|rsync|wget|curl)\b)/i,
    ],
    SSRF: [
      /(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)/i,
      /(file:\/\/|gopher:\/\/|ftp:\/\/|dict:\/\/|ldap:\/\/|tftp:\/\/)/i,
    ],
  };

  for (const [attackType, patterns] of Object.entries(attackPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(input)) {
        return { isAttack: true, attackType };
      }
    }
  }

  return { isAttack: false };
}

/**
 * Middleware de segurança para requisições
 */
export class SecurityMiddleware {
  private suspiciousIPs: Map<string, { count: number; lastAttempt: number }> = new Map();
  private readonly MAX_ATTEMPTS = 10;
  private readonly WINDOW_MS = 60000; // 1 minuto

  /**
   * Verifica se IP está bloqueado por atividade suspeita
   */
  isIPBlocked(ip: string): boolean {
    const record = this.suspiciousIPs.get(ip);
    if (!record) return false;

    const now = Date.now();

    // Reset se passou da janela
    if (now - record.lastAttempt > this.WINDOW_MS) {
      this.suspiciousIPs.delete(ip);
      return false;
    }

    return record.count >= this.MAX_ATTEMPTS;
  }

  /**
   * Registra tentativa suspeita
   */
  recordSuspiciousAttempt(ip: string): void {
    const record = this.suspiciousIPs.get(ip) || { count: 0, lastAttempt: 0 };
    record.count++;
    record.lastAttempt = Date.now();
    this.suspiciousIPs.set(ip, record);
  }

  /**
   * Valida requisição completa
   */
  validateRequest(
    headers: Headers,
    body: string,
    ip: string,
  ): { isValid: boolean; threats: string[] } {
    const threats: string[] = [];

    // Verificar se IP está bloqueado
    if (this.isIPBlocked(ip)) {
      threats.push("IP bloqueado por múltiplas tentativas suspeitas");
      return { isValid: false, threats };
    }

    // Validar headers
    const headerValidation = validateRequestHeaders(headers);
    if (!headerValidation.isValid) {
      threats.push(...headerValidation.suspiciousFields);
      this.recordSuspiciousAttempt(ip);
    }

    // Detectar padrões de ataque no body
    const attackDetection = detectAttackPatterns(body);
    if (attackDetection.isAttack) {
      threats.push(`Padrão de ataque detectado: ${attackDetection.attackType}`);
      this.recordSuspiciousAttempt(ip);
    }

    return {
      isValid: threats.length === 0,
      threats,
    };
  }
}

// Instância singleton
export const securityMiddleware = new SecurityMiddleware();
