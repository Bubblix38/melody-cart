/**
 * Componente de validação de checkout
 * Valida preços antes de finalizar a compra
 */

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { validateCartPrices } from "@/lib/price-protection";
import type { CartItem } from "@/lib/cart";

interface CheckoutValidationProps {
  items: CartItem[];
  onValidated: (validatedItems: CartItem[], total: number) => void;
  onCancel: () => void;
}

export function CheckoutValidation({ items, onValidated, onCancel }: CheckoutValidationProps) {
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    manipulatedItems: string[];
    actualTotal: number;
  } | null>(null);

  const handleValidate = async () => {
    setValidating(true);

    try {
      const result = await validateCartPrices(items);
      setValidationResult({
        isValid: result.isValid,
        manipulatedItems: result.manipulatedItems,
        actualTotal: result.actualPrice,
      });

      if (result.isValid) {
        toast.success("Preços validados com sucesso!");
        // Prosseguir com o checkout
        onValidated(items, result.actualPrice);
      } else {
        toast.error("Manipulação de preço detectada!", {
          description: `${result.manipulatedItems.length} item(ns) com preço alterado`,
        });
      }
    } catch (error) {
      console.error("Erro na validação:", error);
      toast.error("Erro ao validar preços");
    } finally {
      setValidating(false);
    }
  };

  if (validationResult && !validationResult.isValid) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <h3 className="mb-2 font-bold text-destructive">⚠️ Alerta de Segurança</h3>
        <p className="mb-3 text-sm">
          Detectamos tentativa de manipulação de preços nos seguintes itens:
        </p>
        <ul className="mb-4 list-inside list-disc space-y-1 text-sm">
          {validationResult.manipulatedItems.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
        <p className="mb-4 text-sm">
          <strong>Preço correto total:</strong> R$ {validationResult.actualTotal.toFixed(2)}
        </p>
        <div className="flex gap-2">
          <Button onClick={handleValidate} disabled={validating} className="flex-1">
            {validating ? "Validando..." : "Aceitar Preço Correto"}
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-2 font-bold">Finalizar Compra</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Os preços serão validados diretamente do banco de dados antes da compra.
      </p>
      <div className="flex gap-2">
        <Button onClick={handleValidate} disabled={validating} className="flex-1">
          {validating ? "Validando..." : "Validar e Continuar"}
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Voltar
        </Button>
      </div>
    </div>
  );
}
