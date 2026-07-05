/**
 * Sistema de Autorização e Validação de Acesso
 * Previne modificações não autorizadas em dados de usuário
 * Protege contra ataques de modificação de créditos/saldo
 */

import { supabase } from "@/integrations/supabase/client";

export interface AuthorizationContext {
  userId: string;
  resourceType: "user" | "profile" | "purchase" | "cart" | "pack";
  resourceId?: string;
  action: "read" | "write" | "delete" | "update";
}

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  userId?: string;
}

/**
 * Valida se o usuário pode acessar/modificar um recurso
 */
export async function authorize(context: AuthorizationContext): Promise<AuthorizationResult> {
  try {
    // 1. Verificar se há sessão ativa
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        allowed: false,
        reason: "Não autenticado",
      };
    }

    const currentUserId = session.user.id;

    // 2. Verificar se o usuário está acessando seus próprios dados
    if (context.resourceType === "user" || context.resourceType === "profile") {
      // Usuário só pode modificar SEU PRÓPRIO perfil
      if (context.resourceId && context.resourceId !== currentUserId) {
        console.warn(
          `🚨 Tentativa de acesso a perfil de outro usuário: ${context.resourceId} por ${currentUserId}`,
        );
        return {
          allowed: false,
          reason: "Acesso negado: você só pode modificar seu próprio perfil",
        };
      }

      return {
        allowed: true,
        userId: currentUserId,
      };
    }

    // 3. Verificar ownership de recursos específicos
    if (context.resourceId) {
      const isOwner = await verifyOwnership(
        currentUserId,
        context.resourceType,
        context.resourceId,
      );

      if (!isOwner) {
        console.warn(
          `🚨 Tentativa de acesso não autorizado: ${context.resourceType}/${context.resourceId} por usuário ${currentUserId}`,
        );
        return {
          allowed: false,
          reason: `Acesso negado: você não tem permissão para modificar este ${context.resourceType}`,
        };
      }

      return {
        allowed: true,
        userId: currentUserId,
      };
    }

    // 4. Ações gerais (sem resourceId específico)
    if (context.action === "read") {
      return {
        allowed: true,
        userId: currentUserId,
      };
    }

    // 5. Ações de escrita sem resourceId específico
    // Verificar se é admin (para operações administrativas)
    const isAdmin = await checkIfAdmin(currentUserId);

    if (!isAdmin) {
      return {
        allowed: false,
        reason: "Acesso negado: apenas administradores podem realizar esta operação",
      };
    }

    return {
      allowed: true,
      userId: currentUserId,
    };
  } catch (error) {
    console.error("Erro na autorização:", error);
    return {
      allowed: false,
      reason: "Erro na validação de autorização",
    };
  }
}

/**
 * Verifica se o usuário é dono de um recurso
 */
export async function verifyOwnership(
  userId: string,
  resourceType: "user" | "profile" | "purchase" | "cart" | "pack",
  resourceId: string,
): Promise<boolean> {
  try {
    switch (resourceType) {
      case "profile":
      case "user":
        // Perfil pertence ao usuário se o ID bater
        return userId === resourceId;

      case "purchase":
        // Verificar se a compra pertence ao usuário
        // Nota: Tabela purchases não existe ainda
        // Quando implementar, adicionar verificação:
        // const { data } = await supabase
        //   .from('purchases')
        //   .select('user_id')
        //   .eq('id', resourceId)
        //   .single();
        // return data?.user_id === userId;
        return false;

      case "cart":
        // Carrinho sempre pertence ao usuário logado
        return true;

      case "pack":
        // Packs são públicos para leitura
        // Apenas admins podem modificar (verificado por RLS)
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
 * Verifica se o usuário é administrador
 */
export async function checkIfAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (error || !data) return false;
    return data.role === "admin";
  } catch (error) {
    console.error("Erro ao verificar admin:", error);
    return false;
  }
}

/**
 * Middleware de autorização para APIs
 */
export class AuthorizationMiddleware {
  /**
   * Valida autorização em uma requisição
   */
  static async validateRequest(
    request: Request,
    requiredAction: "read" | "write" | "delete" | "update",
    resourceType?: "user" | "profile" | "purchase" | "cart" | "pack",
  ): Promise<AuthorizationResult> {
    try {
      // 1. Extrair token do header
      const authHeader = request.headers.get("Authorization");
      if (!authHeader) {
        return {
          allowed: false,
          reason: "Token de autenticação não fornecido",
        };
      }

      // 2. Extrair resourceId da URL (se aplicável)
      const url = new URL(request.url);
      const pathParts = url.pathname.split("/");
      const resourceId = pathParts[pathParts.length - 1];

      // 3. Validar autorização
      const result = await authorize({
        userId: "", // Será preenchido pela sessão
        resourceType: resourceType || "user",
        resourceId: resourceId || undefined,
        action: requiredAction,
      });

      return result;
    } catch (error) {
      console.error("Erro no middleware de autorização:", error);
      return {
        allowed: false,
        reason: "Erro na validação de autorização",
      };
    }
  }

  /**
   * Valida se o usuário pode modificar créditos/saldo
   */
  static async canModifyCredits(
    userId: string,
    targetUserId: string,
  ): Promise<AuthorizationResult> {
    // Apenas o próprio usuário pode modificar seus créditos
    // (e apenas através de pagamentos legítimos)

    if (userId !== targetUserId) {
      console.warn(
        `🚨 Tentativa de modificar créditos de outro usuário: ${targetUserId} por ${userId}`,
      );
      return {
        allowed: false,
        reason: "Acesso negado: você só pode modificar seus próprios créditos",
      };
    }

    // Verificar se a modificação é através de pagamento
    // (implementar validação de payment intent aqui)

    return {
      allowed: true,
      userId,
    };
  }

  /**
   * Valida se o usuário pode acessar dados sensíveis
   */
  static async canAccessSensitiveData(
    userId: string,
    targetUserId: string,
  ): Promise<AuthorizationResult> {
    // Apenas o próprio usuário ou admin pode acessar dados sensíveis
    if (userId !== targetUserId) {
      const isAdmin = await checkIfAdmin(userId);

      if (!isAdmin) {
        console.warn(`🚨 Tentativa de acesso a dados sensíveis: ${targetUserId} por ${userId}`);
        return {
          allowed: false,
          reason: "Acesso negado: você não tem permissão para acessar estes dados",
        };
      }
    }

    return {
      allowed: true,
      userId,
    };
  }
}

/**
 * Hook para validação de autorização
 */
export function useAuthorization() {
  const authorizeAction = async (
    resourceType: "user" | "profile" | "purchase" | "cart" | "pack",
    action: "read" | "write" | "delete" | "update",
    resourceId?: string,
  ): Promise<AuthorizationResult> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return {
        allowed: false,
        reason: "Não autenticado",
      };
    }

    return authorize({
      userId: session.user.id,
      resourceType,
      resourceId,
      action,
    });
  };

  const canModifyUser = async (targetUserId: string): Promise<boolean> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return false;

    const result = await AuthorizationMiddleware.canModifyCredits(session.user.id, targetUserId);

    return result.allowed;
  };

  const canAccessUserData = async (targetUserId: string): Promise<boolean> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return false;

    const result = await AuthorizationMiddleware.canAccessSensitiveData(
      session.user.id,
      targetUserId,
    );

    return result.allowed;
  };

  return {
    authorizeAction,
    canModifyUser,
    canAccessUserData,
    authorize,
    verifyOwnership,
  };
}

/**
 * Decorator para proteger funções que modificam dados
 */
export function requireAuthorization(
  resourceType: "user" | "profile" | "purchase" | "cart" | "pack",
  action: "read" | "write" | "delete" | "update" = "write",
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Não autenticado");
      }

      // Extrair resourceId dos argumentos (primeiro argumento geralmente é o ID)
      const resourceId = args[0];

      const result = await authorize({
        userId: session.user.id,
        resourceType,
        resourceId,
        action,
      });

      if (!result.allowed) {
        console.warn(`🚨 Acesso não autorizado: ${propertyKey}`, result.reason);
        throw new Error(result.reason || "Acesso negado");
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
