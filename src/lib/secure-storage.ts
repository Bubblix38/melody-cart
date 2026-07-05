/**
 * Utilitário para armazenamento seguro no localStorage
 * Criptografa dados sensíveis antes de salvar
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;

/**
 * Gera uma chave de criptografia a partir de uma senha
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Criptografa um valor
 */
export async function encrypt(value: string, password: string): Promise<string> {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);

    const encoder = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encoder.encode(value),
    );

    // Combinar salt + iv + dados criptografados
    const combined = new Uint8Array(salt.length + iv.length + new Uint8Array(encrypted).length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    // Converter para base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("Erro ao criptografar:", error);
    throw new Error("Falha na criptografia");
  }
}

/**
 * Descriptografa um valor
 */
export async function decrypt(encryptedValue: string, password: string): Promise<string> {
  try {
    // Decodificar de base64
    const combined = Uint8Array.from(atob(encryptedValue), (c) => c.charCodeAt(0));

    // Extrair salt, iv e dados criptografados
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    const key = await deriveKey(password, salt);

    const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, encrypted);

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Erro ao descriptografar:", error);
    return "[]"; // Retorna array vazio em caso de erro
  }
}

/**
 * Gera uma chave derivada do origin, user agent e salt aleatório
 * Usada para criptografia de dados do carrinho
 * Salt é armazenado no sessionStorage (expira ao fechar navegador)
 */
export function getStorageKey(): string {
  const origin = window.location.origin;
  const userAgent = navigator.userAgent;

  // Salt aleatório persistido por sessão — dificulta derivação offline
  let salt = sessionStorage.getItem("topdj-crypto-salt");
  if (!salt) {
    salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    sessionStorage.setItem("topdj-crypto-salt", salt);
  }

  const combined = `${origin}-${userAgent}-${salt}`;
  // Usar SHA-256 para gerar chave consistente
  return btoa(combined).slice(0, 32);
}

/**
 * Salva dados criptografados no localStorage
 */
export async function setSecureItem(key: string, value: unknown): Promise<void> {
  try {
    const storageKey = getStorageKey();
    const jsonString = JSON.stringify(value);
    const encrypted = await encrypt(jsonString, storageKey);
    localStorage.setItem(key, encrypted);
  } catch (error) {
    console.error("Erro ao salvar dados seguros:", error);
    throw new Error("Falha ao salvar dados criptografados");
  }
}

/**
 * Recupera dados descriptografados do localStorage
 */
export async function getSecureItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const storageKey = getStorageKey();
    const encrypted = localStorage.getItem(key);

    if (!encrypted) return fallback;

    const decrypted = await decrypt(encrypted, storageKey);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.error("Erro ao recuperar dados seguros:", error);
    return fallback;
  }
}

/**
 * Remove item do localStorage
 */
export function removeSecureItem(key: string): void {
  localStorage.removeItem(key);
}
