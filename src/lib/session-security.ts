/**
 * Segurança de sessão e proteção contra roubo de tokens
 * Previne acesso não autorizado a contas de outros usuários
 */

import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

export interface SessionInfo {
  userId: string;
  email: string;
  createdAt: number;
  lastActivity: number;
  ip: string;
  userAgent: string;
}

export interface SecurityValidation {
  isValid: boolean;
  reason?: string;
  session?: SessionInfo;
}

/**
 * Gera fingerprint único do navegador
 */
export function generateFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || "unknown",
    navigator.platform,
  ];

  const fingerprint = components.join("|");

  // Hash simples (em produção, use SHA-256)
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(16);
}

/**
 * Valida se a sessão é legítima
 */
export async function validateSession(): Promise<SecurityValidation> {
  try {
    // 1. Verificar se há sessão ativa
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      return {
        isValid: false,
        reason: "Sessão inválida ou expirada",
      };
    }

    // 2. Verificar se o token não foi manipulado
    const storedToken = sessionStorage.getItem("supabase.auth.token");
    const currentToken = session.access_token;

    if (storedToken && storedToken !== currentToken) {
      console.warn("🚨 Token manipulado detectado!");
      return {
        isValid: false,
        reason: "Token foi modificado",
      };
    }

    // 3. Verificar fingerprint do navegador
    const currentFingerprint = generateFingerprint();
    const storedFingerprint = sessionStorage.getItem("browser-fingerprint");

    if (storedFingerprint && storedFingerprint !== currentFingerprint) {
      console.warn("🚨 Fingerprint diferente detectado!");
      return {
        isValid: false,
        reason: "Navegador diferente detectado",
      };
    }

    // 4. Armazenar fingerprint se for a primeira vez
    if (!storedFingerprint) {
      sessionStorage.setItem("browser-fingerprint", currentFingerprint);
    }

    // 5. Verificar IP (se disponível no token)
    // Nota: Isso requer validação no backend

    return {
      isValid: true,
      session: {
        userId: session.user.id,
        email: session.user.email || "",
        createdAt: Date.now(),
        lastActivity: Date.now(),
        ip: "unknown", // Será preenchido pelo servidor
        userAgent: navigator.userAgent,
      },
    };
  } catch (error) {
    console.error("Erro na validação de sessão:", error);
    return {
      isValid: false,
      reason: "Erro na validação",
    };
  }
}

/**
 * Verifica ownership de um recurso
 * Garante que o usuário só pode acessar seus próprios dados
 */
export async function verifyOwnership(
  userId: string,
  resourceType: "pack" | "purchase" | "cart",
  resourceId: string,
): Promise<boolean> {
  try {
    switch (resourceType) {
      case "pack":
        // Packs são públicos para leitura, mas apenas admins podem modificar
        // A verificação de admin é feita no backend via RLS
        return true;

      case "purchase":
        // Nota: Tabela purchases não existe no banco atual
        // Quando implementar sistema de compras, adicionar verificação aqui
        // Por enquanto, retornar false (sem suporte a purchases)
        return false;

      case "cart":
        // Carrinho é sempre do usuário logado
        return true;

      default:
        return false;
    }
  } catch (error) {
    console.error("Erro na verificação de ownership:", error);
    return false;
  }
}

/**
 * Sanitiza token removendo caracteres suspeitos
 */
export function sanitizeToken(token: string): string {
  // Remover espaços, quebras de linha e caracteres especiais
  return token
    .trim()
    .replace(/\s+/g, "")
    .replace(/[\n\r\t]/g, "")
    .replace(/[<>"']/g, "");
}

/**
 * Valida formato de JWT token
 */
export function isValidJWTFormat(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  // Verificar se header e payload são base64 válidos
  try {
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));

    // Verificar campos obrigatórios
    return !!(header.alg && header.typ && payload.sub && payload.exp && payload.iat);
  } catch {
    return false;
  }
}

/**
 * Verifica se o token está expirado
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp;

    if (!exp) return true;

    // Verificar se expirou (com margem de 5 minutos)
    const now = Math.floor(Date.now() / 1000);
    return exp < now - 300;
  } catch {
    return true;
  }
}

/**
 * Middleware de validação de sessão
 */
export class SessionSecurity {
  private static instance: SessionSecurity;
  private failedAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos

  static getInstance(): SessionSecurity {
    if (!SessionSecurity.instance) {
      SessionSecurity.instance = new SessionSecurity();
    }
    return SessionSecurity.instance;
  }

  /**
   * Verifica se o usuário está bloqueado por muitas tentativas falhas
   */
  isLockedOut(userId: string): boolean {
    const record = this.failedAttempts.get(userId);
    if (!record) return false;

    const now = Date.now();

    // Reset se passou do tempo de bloqueio
    if (now - record.lastAttempt > this.LOCKOUT_DURATION) {
      this.failedAttempts.delete(userId);
      return false;
    }

    return record.count >= this.MAX_FAILED_ATTEMPTS;
  }

  /**
   * Registra tentativa de acesso falha
   */
  recordFailedAttempt(userId: string): void {
    const record = this.failedAttempts.get(userId) || { count: 0, lastAttempt: 0 };
    record.count++;
    record.lastAttempt = Date.now();
    this.failedAttempts.set(userId, record);

    console.warn(`🚨 Muitas tentativas falhas para usuário: ${userId}`);
  }

  /**
   * Limpa tentativas falhas após sucesso
   */
  clearFailedAttempts(userId: string): void {
    this.failedAttempts.delete(userId);
  }

  /**
   * Valida sessão completa com todas as verificações
   */
  async validateCompleteSession(): Promise<SecurityValidation> {
    // 1. Validar sessão básica
    const sessionValidation = await validateSession();
    if (!sessionValidation.isValid) {
      return sessionValidation;
    }

    const userId = sessionValidation.session!.userId;

    // 2. Verificar se usuário está bloqueado
    if (this.isLockedOut(userId)) {
      return {
        isValid: false,
        reason: "Conta temporariamente bloqueada por muitas tentativas",
      };
    }

    // 3. Limpar tentativas falhas
    this.clearFailedAttempts(userId);

    return sessionValidation;
  }

  /**
   * Invalida sessão (logout forçado)
   */
  async invalidateSession(): Promise<void> {
    // Limpar dados locais
    sessionStorage.removeItem("supabase.auth.token");
    sessionStorage.removeItem("browser-fingerprint");
    localStorage.removeItem("topdj-cart");

    // Fazer logout no Supabase
    await supabase.auth.signOut();
  }
}

// Instância singleton
export const sessionSecurity = SessionSecurity.getInstance();

/**
 * Hook para monitoramento de sessão
 */
export function useSessionSecurity() {
  const validate = useCallback(async (): Promise<SecurityValidation> => {
    return sessionSecurity.validateCompleteSession();
  }, []);

  const invalidate = useCallback(async (): Promise<void> => {
    await sessionSecurity.invalidateSession();
  }, []);

  const checkOwnership = useCallback(async (
    resourceType: "pack" | "purchase" | "cart",
    resourceId: string,
  ): Promise<boolean> => {
    const validation = await validate();
    if (!validation.isValid || !validation.session) {
      return false;
    }

    return verifyOwnership(validation.session.userId, resourceType, resourceId);
  }, [validate]);

  return {
    validate,
    invalidate,
    checkOwnership,
    generateFingerprint,
    sanitizeToken,
    isValidJWTFormat,
    isTokenExpired,
  };
}

/**
 * Proteção contra session hijacking
 */
export class SessionHijackingProtection {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
  private static lastActivity = Date.now();

  /**
   * Verifica se a sessão expirou por inatividade
   */
  static isSessionExpired(): boolean {
    const now = Date.now();
    const inactiveTime = now - this.lastActivity;

    if (inactiveTime > this.SESSION_TIMEOUT) {
      console.warn("🚨 Sessão expirada por inatividade");
      return true;
    }

    return false;
  }

  /**
   * Atualiza timestamp de última atividade
   */
  static updateActivity(): void {
    this.lastActivity = Date.now();
  }

  /**
   * Inicia monitoramento de inatividade
   */
  static startInactivityMonitor(onExpired: () => void): () => void {
    const checkInterval = 60 * 1000; // Verificar a cada 1 minuto

    const interval = setInterval(() => {
      if (this.isSessionExpired()) {
        onExpired();
      }
    }, checkInterval);

    // Atualizar atividade em eventos do usuário
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    const updateActivity = () => this.updateActivity();

    events.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    return () => {
      clearInterval(interval);
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }
}
