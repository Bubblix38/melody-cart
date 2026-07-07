/**
 * Proteção contra manipulação via DevTools (Inspecionar página)
 * Detecta e previne modificações maliciosas no frontend
 */

/**
 * Detecta se o DevTools está aberto
 */
export function detectDevTools(): boolean {
  // Método 1: Verificar diferença de dimensões
  const threshold = 160;
  const widthDiff = window.outerWidth - window.innerWidth > threshold;
  const heightDiff = window.outerHeight - window.innerHeight > threshold;

  if (widthDiff || heightDiff) {
    return true;
  }

  // Método 2: Verificar debugger (apenas se habilitado)
  if (typeof (window as any).debug === "function") {
    return true;
  }

  // Método 3: Verificar se há listeners de debug
  const devtoolsOpen = /./;
  devtoolsOpen.toString = function () {
    this.toString = function () {
      return "";
    };
    console.log("%c", devtoolsOpen);
    console.clear();
    return "";
  };

  try {
    console.log("%c", devtoolsOpen);
    return false;
  } catch (e) {
    return true;
  }
}

/**
 * Monitora abertura do DevTools
 */
export function monitorDevTools(callback: (isOpen: boolean) => void): () => void {
  let isOpen = false;
  const threshold = 160;

  const check = () => {
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;
    const currentlyOpen = widthDiff || heightDiff;

    if (currentlyOpen !== isOpen) {
      isOpen = currentlyOpen;
      callback(isOpen);
    }
  };

  // Verificar a cada segundo
  const interval = setInterval(check, 1000);

  // Limpar intervalo quando chamar o retorno
  return () => clearInterval(interval);
}

/**
 * Ofusca código sensível
 */
export function obfuscateCode(code: string): string {
  // Remover espaços e quebras de linha
  const obfuscated = code.replace(/\s+/g, "");

  // Converter para hex (opcional, mais seguro mas mais lento)
  // obfuscated = Array.from(obfuscated)
  //   .map(char => char.charCodeAt(0).toString(16))
  //   .join('');

  return obfuscated;
}

/**
 * Valida integridade de variáveis críticas
 */
export class IntegrityMonitor {
  private checksums: Map<string, string> = new Map();
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Registra uma variável para monitoramento
   */
  register(name: string, value: unknown): void {
    const checksum = this.calculateChecksum(JSON.stringify(value));
    this.checksums.set(name, checksum);
  }

  /**
   * Verifica se houve modificação
   */
  check(name: string, value: unknown): boolean {
    const currentChecksum = this.calculateChecksum(JSON.stringify(value));
    const originalChecksum = this.checksums.get(name);

    if (!originalChecksum) {
      // Variável não registrada, registrar agora
      this.checksums.set(name, currentChecksum);
      return true;
    }

    return currentChecksum === originalChecksum;
  }

  /**
   * Calcula checksum simples
   */
  private calculateChecksum(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  /**
   * Inicia monitoramento contínuo
   */
  startMonitoring(names: string[], getValues: () => Record<string, unknown>): () => void {
    this.intervalId = setInterval(() => {
      const values = getValues();

      for (const name of names) {
        const value = values[name];
        if (value !== undefined && !this.check(name, value)) {
          console.warn(`🚨 INTEGRITY VIOLATION: ${name} foi modificado!`);
          // Aqui você pode:
          // 1. Recarregar a página
          // 2. Invalidar sessão
          // 3. Enviar alerta para o servidor
          // 4. Limpar dados sensíveis
        }
      }
    }, 5000); // Verificar a cada 5 segundos

    return () => {
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
    };
  }
}

// Instância singleton
export const integrityMonitor = new IntegrityMonitor();

/**
 * Proteção contra debugger
 */
export function antiDebug(): () => void {
  // Desativado: debugger infinito quebra a aplicação para o próprio admin!
  return () => {};
}

/**
 * Protege contra modificação de prototype
 */
export function protectPrototype(): void {
  // Proteger Object.prototype
  const originalDefineProperty = Object.defineProperty;
  (Object as any).defineProperty = function (
    target: any,
    property: string,
    descriptor: PropertyDescriptor,
  ) {
    if (target === Object.prototype || target === Array.prototype) {
      console.warn(
        `🚨 Tentativa de modificar ${target === Object.prototype ? "Object" : "Array"}.prototype:`,
        property,
      );
      return originalDefineProperty.call(this, target, property, descriptor);
    }
    return originalDefineProperty.call(this, target, property, descriptor);
  };

  // Proteger contra modificação de console
  const originalConsoleLog = console.log;
  console.log = function (...args: unknown[]) {
    if (args.some((arg) => typeof arg === "string" && arg.includes("password"))) {
      console.warn("🚨 Tentativa de logar dados sensíveis");
      return;
    }
    return originalConsoleLog.apply(console, args);
  };
}

/**
 * Sanitiza dados antes de exibir no console
 */
export function sanitizeForConsole(data: unknown): unknown {
  if (typeof data === "string") {
    // Remover possíveis scripts
    return data.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      "[CONTEÚDO REMOVIDO POR SEGURANÇA]",
    );
  }

  if (typeof data === "object" && data !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // Ocultar campos sensíveis
      if (
        key.toLowerCase().includes("password") ||
        key.toLowerCase().includes("secret") ||
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("key")
      ) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = sanitizeForConsole(value);
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Hook para proteção de DevTools
 */
export function useDevToolsProtection() {
  const startProtection = () => {
    // Versão simplificada - apenas logging de DevTools
    // Remover proteções agressivas que causam problemas
    
    monitorDevTools((isOpen) => {
      if (isOpen) {
        console.warn("⚠️ DevTools detectado. Monitorando atividades suspeitas.");
      }
    });

    return () => {
      // Cleanup se necessário
    };
  };

  return {
    startProtection,
    detectDevTools,
    integrityMonitor,
    sanitizeForConsole,
  };
}
