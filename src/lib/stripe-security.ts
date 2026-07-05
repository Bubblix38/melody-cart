/**
 * Segurança no processamento de pagamentos Stripe
 * Previne manipulação de valores e garante integridade
 */

import { supabase } from "@/integrations/supabase/client";

export interface PaymentValidation {
  isValid: boolean;
  reason?: string;
  expectedAmount: number;
  actualAmount?: number;
}

/**
 * Valida se o valor do pagamento está correto
 * Compara com o valor real dos itens no carrinho
 */
export async function validatePaymentAmount(
  userId: string,
  requestedAmount: number,
): Promise<PaymentValidation> {
  try {
    // Nota: Esta função requer uma tabela de carrinho no banco de dados
    // Por enquanto, retornar validação básica

    // TODO: Quando implementar tabela de carrinho:
    // 1. Buscar carrinho do usuário
    // 2. Buscar preços dos packs
    // 3. Calcular valor total esperado
    // 4. Comparar com valor solicitado

    // Por enquanto, apenas validar se o valor é positivo
    if (requestedAmount <= 0) {
      return {
        isValid: false,
        reason: "Valor inválido",
        expectedAmount: 0,
      };
    }

    return {
      isValid: true,
      expectedAmount: requestedAmount,
    };
  } catch (error) {
    console.error("Erro na validação de pagamento:", error);
    return {
      isValid: false,
      reason: "Erro interno na validação",
      expectedAmount: 0,
    };
  }
}

/**
 * Gera hash de integridade para o carrinho
 * Usado para detectar manipulação
 */
export function generateCartHash(
  cartItems: Array<{ pack_id: string; quantidade: number }>,
): string {
  const data = JSON.stringify(cartItems);

  // Hash simples (em produção, use SHA-256)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(16);
}

/**
 * Valida se o carrinho foi manipulado
 */
export async function validateCartIntegrity(userId: string, cartHash: string): Promise<boolean> {
  try {
    // Nota: Esta função requer uma tabela de carrinho no banco de dados
    // Por enquanto, retornar true (validação desabilitada)

    // TODO: Quando implementar tabela de carrinho:
    // 1. Buscar carrinho atual do banco
    // 2. Gerar hash do carrinho
    // 3. Comparar com hash fornecido

    return true;
  } catch (error) {
    console.error("Erro na validação de integridade:", error);
    return false;
  }
}

/**
 * Middleware de validação de pagamento
 */
export class PaymentSecurityMiddleware {
  /**
   * Valida requisição de criação de payment intent
   */
  static async validatePaymentIntentRequest(
    userId: string,
    amount: number,
    cartHash?: string,
  ): Promise<{ valid: boolean; reason?: string; expectedAmount?: number }> {
    // 1. Validar valor do pagamento
    const amountValidation = await validatePaymentAmount(userId, amount);

    if (!amountValidation.isValid) {
      return {
        valid: false,
        reason: amountValidation.reason,
        expectedAmount: amountValidation.expectedAmount,
      };
    }

    // 2. Validar integridade do carrinho (se hash fornecido)
    if (cartHash) {
      const integrityValid = await validateCartIntegrity(userId, cartHash);

      if (!integrityValid) {
        return {
          valid: false,
          reason: "Carrinho foi modificado. Por favor, recarregue a página.",
        };
      }
    }

    return {
      valid: true,
      expectedAmount: amountValidation.expectedAmount,
    };
  }

  /**
   * Valida se o pagamento foi realmente processado pelo Stripe
   */
  static async validateStripePayment(
    paymentIntentId: string,
    expectedAmount: number,
  ): Promise<boolean> {
    try {
      // Buscar payment intent no Stripe
      // Nota: Isso deve ser feito no backend com a secret key

      // Por enquanto, retornar true
      // Implementar quando integrar com Stripe backend

      return true;
    } catch (error) {
      console.error("Erro na validação do Stripe:", error);
      return false;
    }
  }
}

/**
 * Hook para segurança de pagamentos
 */
export function usePaymentSecurity() {
  const validateAmount = async (userId: string, amount: number): Promise<PaymentValidation> => {
    return validatePaymentAmount(userId, amount);
  };

  const validateRequest = async (
    userId: string,
    amount: number,
    cartHash?: string,
  ): Promise<{ valid: boolean; reason?: string; expectedAmount?: number }> => {
    return PaymentSecurityMiddleware.validatePaymentIntentRequest(userId, amount, cartHash);
  };

  const generateHash = (cartItems: Array<{ pack_id: string; quantidade: number }>): string => {
    return generateCartHash(cartItems);
  };

  return {
    validateAmount,
    validateRequest,
    generateHash,
  };
}
