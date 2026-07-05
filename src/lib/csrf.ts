/**
 * Utilitário para proteção CSRF (Cross-Site Request Forgery)
 * Gera e valida tokens CSRF para formulários
 */

const CSRF_TOKEN_KEY = "topdj-csrf-token";
const TOKEN_LENGTH = 32;

/**
 * Gera um token CSRF aleatório
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Salva token CSRF no sessionStorage
 */
export function setCsrfToken(): string {
  const token = generateCsrfToken();
  sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  return token;
}

/**
 * Recupera token CSRF do sessionStorage
 */
export function getCsrfToken(): string | null {
  return sessionStorage.getItem(CSRF_TOKEN_KEY);
}

/**
 * Valida token CSRF
 */
export function validateCsrfToken(token: string | null): boolean {
  if (!token) return false;
  const storedToken = getCsrfToken();
  return token === storedToken;
}

/**
 * Adiciona token CSRF a um objeto de dados
 */
export function addCsrfToken(data: Record<string, unknown>): Record<string, unknown> {
  const token = getCsrfToken();
  if (!token) {
    // Se não há token, cria um novo
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
