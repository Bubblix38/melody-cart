/**
 * Utilitário para proteção CSRF (Cross-Site Request Forgery)
 * Usa Double-Submit Cookie + Server-Side Validation
 * Token armazenado em memória (não em storage público)
 * Validação via header customizado + cookie HttpOnly SameSite
 */

const CSRF_HEADER_NAME = "X-CSRF-Token";
const TOKEN_LENGTH = 32;

// Token armazenado em memória (seguro contra XSS que leia storage)
let _csrfToken: string | null = null;

/**
 * Gera um token CSRF criptograficamente aleatório
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Inicializa/renova token CSRF na memória
 * Envia ao servidor para validação e cookie HttpOnly SameSite
 */
export function setCsrfToken(): string {
  const token = generateCsrfToken();
  _csrfToken = token;

  // Enviar ao servidor via fetch para inicializar cookie HttpOnly
  initCsrfServerCookie(token).catch((err) => {
    console.warn("[CSRF] Erro ao inicializar cookie no servidor:", err);
  });

  return token;
}

/**
 * Recupera token CSRF da memória
 */
export function getCsrfToken(): string | null {
  return _csrfToken;
}

/**
 * Valida token CSRF (comparação em tempo constante)
 * Servidor valida via header customizado + cookie
 */
export function validateCsrfToken(token: string | null): boolean {
  if (!token) return false;

  const storedToken = _csrfToken;
  if (!storedToken) return false;

  // Comparação em tempo constante (evita timing attacks)
  return timingSafeEqual(token, storedToken);
}

/**
 * Comparação em tempo constante para strings
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Envia token CSRF para servidor e recebe cookie HttpOnly SameSite
 */
async function initCsrfServerCookie(token: string): Promise<void> {
  try {
    await fetch("/api/security/csrf-init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER_NAME]: token,
      },
      body: JSON.stringify({ token }),
      credentials: "include", // Inclui/recebe cookies
    });
  } catch (err) {
    console.error("[CSRF] Erro ao inicializar token no servidor:", err);
  }
}

/**
 * Adiciona token CSRF a um objeto de dados
 */
export function addCsrfToken(data: Record<string, unknown>): Record<string, unknown> {
  const token = getCsrfToken();
  if (!token) {
    const newToken = setCsrfToken();
    return { ...data, csrfToken: newToken };
  }
  return { ...data, csrfToken: token };
}

/**
 * Hook para usar CSRF protection em formulários
 */
export function useCsrf() {
  const getToken = (): string => {
    let token = getCsrfToken();
    if (!token) {
      token = setCsrfToken();
    }
    return token;
  };

  const validateToken = (token: string | FormDataEntryValue | null): boolean => {
    if (!token || typeof token !== "string") return false;
    return validateCsrfToken(token);
  };

  return {
    getToken,
    validateToken,
    setToken: setCsrfToken,
  };
}

/**
 * Exporta nome do header para uso no servidor
 */
export const CSRF_HEADER = CSRF_HEADER_NAME;
