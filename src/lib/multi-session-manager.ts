/**
 * Gerenciador de múltiplas sessões por usuário
 * Limita a 2 IPs logados simultaneamente por conta
 * Previne compartilhamento de contas
 */

import { supabase } from "@/integrations/supabase/client";

export interface Session {
  userId: string;
  ip: string;
  userAgent: string;
  loginAt: number;
  lastActivity: number;
  sessionId: string;
}

export interface MultiSessionValidation {
  allowed: boolean;
  reason?: string;
  sessions?: Session[];
  kickedSession?: Session;
}

/**
 * Gerenciador de sessões múltiplas
 */
export class MultiSessionManager {
  private static instance: MultiSessionManager;
  private sessions: Map<string, Session[]> = new Map(); // userId -> sessions[]
  private readonly MAX_SESSIONS = 2; // Máximo de 2 sessões por usuário
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos

  static getInstance(): MultiSessionManager {
    if (!MultiSessionManager.instance) {
      MultiSessionManager.instance = new MultiSessionManager();
    }
    return MultiSessionManager.instance;
  }

  /**
   * Registra uma nova sessão
   */
  registerSession(userId: string, ip: string, userAgent: string): MultiSessionValidation {
    const sessionId = this.generateSessionId();
    const now = Date.now();

    // Limpar sessões expiradas
    this.cleanupExpiredSessions(userId);

    // Obter sessões atuais do usuário
    const userSessions = this.sessions.get(userId) || [];

    // Verificar se este IP já está logado
    const existingSession = userSessions.find((s) => s.ip === ip);
    if (existingSession) {
      // Atualizar sessão existente
      existingSession.lastActivity = now;
      existingSession.userAgent = userAgent;

      return {
        allowed: true,
        sessions: userSessions,
      };
    }

    // Verificar se excede o limite
    if (userSessions.length >= this.MAX_SESSIONS) {
      // Encontrar a sessão mais antiga
      const sortedSessions = [...userSessions].sort((a, b) => a.loginAt - b.loginAt);
      const oldestSession = sortedSessions[0];

      // Remover a sessão mais antiga
      this.removeSession(userId, oldestSession.sessionId);

      // Registrar nova sessão
      const newSession: Session = {
        userId,
        ip,
        userAgent,
        loginAt: now,
        lastActivity: now,
        sessionId,
      };

      userSessions.push(newSession);
      this.sessions.set(userId, userSessions);

      return {
        allowed: true,
        reason: `Sessão anterior encerrada (${oldestSession.ip}). Máximo de ${this.MAX_SESSIONS} sessões permitidas.`,
        sessions: userSessions,
        kickedSession: oldestSession,
      };
    }

    // Registrar nova sessão
    const newSession: Session = {
      userId,
      ip,
      userAgent,
      loginAt: now,
      lastActivity: now,
      sessionId,
    };

    userSessions.push(newSession);
    this.sessions.set(userId, userSessions);

    return {
      allowed: true,
      sessions: userSessions,
    };
  }

  /**
   * Remove uma sessão específica
   */
  removeSession(userId: string, sessionId: string): void {
    const userSessions = this.sessions.get(userId) || [];
    const filtered = userSessions.filter((s) => s.sessionId !== sessionId);

    if (filtered.length > 0) {
      this.sessions.set(userId, filtered);
    } else {
      this.sessions.delete(userId);
    }
  }

  /**
   * Remove sessão por IP
   */
  removeSessionByIP(userId: string, ip: string): void {
    const userSessions = this.sessions.get(userId) || [];
    const session = userSessions.find((s) => s.ip === ip);

    if (session) {
      this.removeSession(userId, session.sessionId);
    }
  }

  /**
   * Atualiza última atividade de uma sessão
   */
  updateActivity(userId: string, ip: string): void {
    const userSessions = this.sessions.get(userId) || [];
    const session = userSessions.find((s) => s.ip === ip);

    if (session) {
      session.lastActivity = Date.now();
    }
  }

  /**
   * Obtém todas as sessões de um usuário
   */
  getUserSessions(userId: string): Session[] {
    this.cleanupExpiredSessions(userId);
    return this.sessions.get(userId) || [];
  }

  /**
   * Verifica se um IP está logado
   */
  isIPLoggedIn(userId: string, ip: string): boolean {
    const userSessions = this.sessions.get(userId) || [];
    return userSessions.some((s) => s.ip === ip);
  }

  /**
   * Conta sessões ativas de um usuário
   */
  countActiveSessions(userId: string): number {
    this.cleanupExpiredSessions(userId);
    return this.sessions.get(userId)?.length || 0;
  }

  /**
   * Limpa sessões expiradas
   */
  private cleanupExpiredSessions(userId: string): void {
    const userSessions = this.sessions.get(userId) || [];
    const now = Date.now();

    const activeSessions = userSessions.filter((s) => {
      return now - s.lastActivity < this.SESSION_TIMEOUT;
    });

    if (activeSessions.length !== userSessions.length) {
      if (activeSessions.length > 0) {
        this.sessions.set(userId, activeSessions);
      } else {
        this.sessions.delete(userId);
      }
    }
  }

  /**
   * Gera ID único para sessão
   */
  private generateSessionId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Invalida todas as sessões de um usuário (logout global)
   */
  invalidateAllSessions(userId: string): void {
    this.sessions.delete(userId);
  }

  /**
   * Retorna estatísticas
   */
  getStats(): { totalUsers: number; totalSessions: number } {
    let totalSessions = 0;

    for (const sessions of this.sessions.values()) {
      totalSessions += sessions.length;
    }

    return {
      totalUsers: this.sessions.size,
      totalSessions,
    };
  }
}

// Instância singleton
export const multiSessionManager = MultiSessionManager.getInstance();

/**
 * Hook para gerenciamento de múltiplas sessões
 */
export function useMultiSessionManager() {
  const registerSession = (
    userId: string,
    ip: string,
    userAgent: string,
  ): MultiSessionValidation => {
    return multiSessionManager.registerSession(userId, ip, userAgent);
  };

  const removeSession = (userId: string, sessionId: string): void => {
    multiSessionManager.removeSession(userId, sessionId);
  };

  const getUserSessions = (userId: string): Session[] => {
    return multiSessionManager.getUserSessions(userId);
  };

  const isIPLoggedIn = (userId: string, ip: string): boolean => {
    return multiSessionManager.isIPLoggedIn(userId, ip);
  };

  const countActiveSessions = (userId: string): number => {
    return multiSessionManager.countActiveSessions(userId);
  };

  const invalidateAllSessions = (userId: string): void => {
    multiSessionManager.invalidateAllSessions(userId);
  };

  const updateActivity = (userId: string, ip: string): void => {
    multiSessionManager.updateActivity(userId, ip);
  };

  return {
    registerSession,
    removeSession,
    getUserSessions,
    isIPLoggedIn,
    countActiveSessions,
    invalidateAllSessions,
    updateActivity,
  };
}

/**
 * Middleware para verificação de sessões múltiplas
 */
export class MultiSessionMiddleware {
  /**
   * Verifica se usuário pode criar nova sessão
   */
  static canCreateSession(userId: string, ip: string): { allowed: boolean; reason?: string } {
    const manager = MultiSessionManager.getInstance();

    // Limpar sessões expiradas
    const userSessions = manager.getUserSessions(userId);

    // Verificar se IP já está logado
    const existingSession = userSessions.find((s) => s.ip === ip);
    if (existingSession) {
      return {
        allowed: true,
        reason: "Sessão existente atualizada",
      };
    }

    // Verificar limite
    if (userSessions.length >= 2) {
      return {
        allowed: false,
        reason: `Máximo de 2 sessões simultâneas atingido. Faça logout em outro dispositivo.`,
      };
    }

    return {
      allowed: true,
    };
  }

  /**
   * Força logout de todas as outras sessões
   */
  static async logoutOtherSessions(userId: string, currentIP: string): Promise<void> {
    const manager = MultiSessionManager.getInstance();
    const userSessions = manager.getUserSessions(userId);

    // Remover todas as sessões exceto a atual
    for (const session of userSessions) {
      if (session.ip !== currentIP) {
        manager.removeSession(userId, session.sessionId);

        // Opcional: Notificar o usuário (email, push, etc.)
        console.log(`Sessão encerrada: ${session.ip} para usuário ${userId}`);
      }
    }
  }

  /**
   * Força logout de todas as sessões
   */
  static async logoutAllSessions(userId: string): Promise<void> {
    const manager = MultiSessionManager.getInstance();
    manager.invalidateAllSessions(userId);

    // Fazer logout no Supabase
    await supabase.auth.signOut();
  }
}
