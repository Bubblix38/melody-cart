/**
 * Detecção e bloqueio de VPN, TOR, VPS e proxies
 * Identifica IPs que estão tentando esconder sua identidade
 */

export interface IPRiskAssessment {
  ip: string;
  isVPN: boolean;
  isTOR: boolean;
  isProxy: boolean;
  isVPS: boolean;
  isHosting: boolean;
  riskScore: number;
  reasons: string[];
}

/**
 * Lista de IPs e redes TOR conhecidas
 */
const TOR_NODES = [
  // TOR Exit Nodes (exemplos comuns)
  "185.220.101.0/24",
  "185.220.102.0/24",
  "185.220.103.0/24",
  "185.220.104.0/24",
  "185.220.105.0/24",
  "51.15.0.0/16",
  "62.102.148.0/24",
  "62.113.207.0/24",
  "78.47.18.0/24",
  "81.7.16.0/24",
  "89.58.17.0/24",
  "91.208.197.0/24",
  "94.102.49.0/24",
  "171.25.193.0/24",
  "176.10.104.0/24",
];

/**
 * Lista de provedores de VPN conhecidos
 */
const VPN_PROVIDERS = [
  // NordVPN
  "104.238.0.0/16",
  "185.216.0.0/16",
  // ExpressVPN
  "108.168.0.0/16",
  "173.244.0.0/16",
  // CyberGhost
  "91.207.0.0/16",
  // Surfshark
  "185.216.0.0/16",
  // Private Internet Access
  "209.222.0.0/16",
  // ProtonVPN
  "185.159.0.0/16",
  // Mullvad
  "185.159.0.0/16",
];

/**
 * Lista de provedores de VPS/Hosting
 */
const VPS_PROVIDERS = [
  // AWS
  "13.32.0.0/15",
  "13.224.0.0/14",
  "18.192.0.0/10",
  "18.208.0.0/13",
  "18.240.0.0/16",
  "52.0.0.0/8",
  "54.0.0.0/8",
  // Google Cloud
  "8.34.208.0/20",
  "8.35.192.0/20",
  "35.198.0.0/16",
  "35.199.0.0/16",
  // Azure
  "13.64.0.0/11",
  "13.96.0.0/13",
  "13.104.0.0/13",
  "20.0.0.0/8",
  "40.64.0.0/10",
  // DigitalOcean
  "104.236.0.0/16",
  "138.197.0.0/16",
  "159.65.0.0/16",
  "164.90.0.0/16",
  // Linode
  "45.33.0.0/16",
  "45.56.0.0/16",
  "45.79.0.0/16",
  // Vultr
  "149.28.0.0/16",
  "168.138.0.0/16",
  "207.148.0.0/16",
  // OVH
  "1.9.0.0/16",
  "5.135.0.0/16",
  "15.188.0.0/16",
  "37.59.0.0/16",
  "51.38.0.0/16",
  "51.68.0.0/16",
  "54.36.0.0/16",
  "91.121.0.0/16",
  "94.23.0.0/16",
  "135.125.0.0/16",
  "137.74.0.0/16",
  "146.59.0.0/16",
  "151.80.0.0/16",
  "158.69.0.0/16",
  "164.132.0.0/16",
  "178.32.0.0/16",
  "188.165.0.0/16",
  "192.95.0.0/16",
  "203.57.0.0/16",
  "213.186.0.0/16",
  "217.182.0.0/16",
];

/**
 * Detecta se um IP pertence a uma rede TOR
 */
function isTORNode(ip: string): boolean {
  const ipParts = ip.split(".").map(Number);

  for (const cidr of TOR_NODES) {
    const [network, prefixLength] = cidr.split("/");
    const networkParts = network.split(".").map(Number);
    const prefix = parseInt(prefixLength);

    let matches = true;
    const fullBytes = Math.floor(prefix / 8);
    const remainingBits = prefix % 8;

    for (let i = 0; i < fullBytes; i++) {
      if (ipParts[i] !== networkParts[i]) {
        matches = false;
        break;
      }
    }

    if (matches && remainingBits > 0) {
      const mask = 0xff << (8 - remainingBits);
      if ((ipParts[fullBytes] & mask) !== (networkParts[fullBytes] & mask)) {
        matches = false;
      }
    }

    if (matches) return true;
  }

  return false;
}

/**
 * Verifica se IP pertence a provedor de VPN
 */
function isVPNProvider(ip: string): boolean {
  const ipParts = ip.split(".").map(Number);

  for (const cidr of VPN_PROVIDERS) {
    const [network, prefixLength] = cidr.split("/");
    const networkParts = network.split(".").map(Number);
    const prefix = parseInt(prefixLength);

    let matches = true;
    const fullBytes = Math.floor(prefix / 8);
    const remainingBits = prefix % 8;

    for (let i = 0; i < fullBytes; i++) {
      if (ipParts[i] !== networkParts[i]) {
        matches = false;
        break;
      }
    }

    if (matches && remainingBits > 0) {
      const mask = 0xff << (8 - remainingBits);
      if ((ipParts[fullBytes] & mask) !== (networkParts[fullBytes] & mask)) {
        matches = false;
      }
    }

    if (matches) return true;
  }

  return false;
}

/**
 * Verifica se IP pertence a provedor de VPS/Hosting
 */
function isVPSProvider(ip: string): boolean {
  const ipParts = ip.split(".").map(Number);

  for (const cidr of VPS_PROVIDERS) {
    const [network, prefixLength] = cidr.split("/");
    const networkParts = network.split(".").map(Number);
    const prefix = parseInt(prefixLength);

    let matches = true;
    const fullBytes = Math.floor(prefix / 8);
    const remainingBits = prefix % 8;

    for (let i = 0; i < fullBytes; i++) {
      if (ipParts[i] !== networkParts[i]) {
        matches = false;
        break;
      }
    }

    if (matches && remainingBits > 0) {
      const mask = 0xff << (8 - remainingBits);
      if ((ipParts[fullBytes] & mask) !== (networkParts[fullBytes] & mask)) {
        matches = false;
      }
    }

    if (matches) return true;
  }

  return false;
}

/**
 * Detecta headers suspeitos de proxy
 */
function detectProxyHeaders(headers: Headers): string[] {
  const proxyHeaders = [
    "x-forwarded-for",
    "x-real-ip",
    "x-cluster-client-ip",
    "x-forwarded",
    "forwarded-for",
    "forwarded",
    "via",
    "x-proxy-id",
    "x-request-id",
    "x-https",
    "x-forwarded-proto",
    "x-forwarded-scheme",
    "x-forwarded-host",
    "x-forwarded-port",
    "x-forwarded-server",
  ];

  const suspiciousHeaders: string[] = [];

  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (proxyHeaders.includes(lowerKey)) {
      // Verificar se é um IP público real ou suspeito
      const valueStr = Array.isArray(value) ? value[0] : value;
      if (valueStr && valueStr !== "") {
        suspiciousHeaders.push(`Header de proxy: ${key}`);
      }
    }
  });

  return suspiciousHeaders;
}

/**
 * Analisa risco de um IP
 */
export function assessIPRisk(ip: string, headers?: Headers): IPRiskAssessment {
  const reasons: string[] = [];
  let riskScore = 0;

  // Verificar TOR
  const isTOR = isTORNode(ip);
  if (isTOR) {
    riskScore += 100;
    reasons.push("IP é um nó TOR");
  }

  // Verificar VPN
  const isVPN = isVPNProvider(ip);
  if (isVPN) {
    riskScore += 80;
    reasons.push("IP pertence a provedor de VPN");
  }

  // Verificar VPS/Hosting
  const isVPS = isVPSProvider(ip);
  if (isVPS) {
    riskScore += 60;
    reasons.push("IP pertence a provedor de VPS/Hosting");
  }

  // Verificar headers de proxy
  let isProxy = false;
  if (headers) {
    const proxyHeaders = detectProxyHeaders(headers);
    if (proxyHeaders.length > 0) {
      isProxy = true;
      riskScore += 40;
      reasons.push(...proxyHeaders);
    }
  }

  // Verificar se é IP privado (não deveria estar acessando)
  const ipParts = ip.split(".").map(Number);
  const isPrivate =
    ipParts[0] === 10 ||
    (ipParts[0] === 172 && ipParts[1] >= 16 && ipParts[1] <= 31) ||
    (ipParts[0] === 192 && ipParts[1] === 168) ||
    ip === "127.0.0.1" ||
    ip === "::1";

  if (isPrivate) {
    riskScore += 50;
    reasons.push("IP privado detectado");
  }

  return {
    ip,
    isVPN,
    isTOR,
    isProxy,
    isVPS,
    isHosting: isVPS,
    riskScore,
    reasons,
  };
}

/**
 * Verifica se IP deve ser bloqueado
 */
export function shouldBlockIP(assessment: IPRiskAssessment): boolean {
  // Bloquear se:
  // - TOR (risco >= 100)
  // - VPN + VPS (risco >= 140)
  // - Múltiplos indicadores (risco >= 100)

  if (assessment.isTOR) return true;
  if (assessment.isVPN && assessment.isVPS) return true;
  if (assessment.riskScore >= 100) return true;

  return false;
}

/**
 * Middleware de detecção de VPN/TOR/VPS
 */
export class VPNTORDetector {
  private blockedIPs: Map<string, { timestamp: number; reasons: string[] }> = new Map();
  private readonly BLOCK_DURATION = 24 * 60 * 60 * 1000; // 24 horas

  /**
   * Verifica se IP está bloqueado
   */
  isBlocked(ip: string): boolean {
    const record = this.blockedIPs.get(ip);
    if (!record) return false;

    const now = Date.now();

    // Verificar se ainda está no período de bloqueio
    if (now - record.timestamp > this.BLOCK_DURATION) {
      this.blockedIPs.delete(ip);
      return false;
    }

    return true;
  }

  /**
   * Bloqueia um IP
   */
  blockIP(ip: string, reasons: string[]): void {
    this.blockedIPs.set(ip, {
      timestamp: Date.now(),
      reasons,
    });

    console.warn(`🚨 IP BLOQUEADO: ${ip}`, reasons);
  }

  /**
   * Analisa e bloqueia IP se necessário
   */
  analyzeAndBlock(ip: string, headers?: Headers): IPRiskAssessment | null {
    const assessment = assessIPRisk(ip, headers);

    if (shouldBlockIP(assessment)) {
      this.blockIP(ip, assessment.reasons);
      return assessment;
    }

    // Log de IP suspeito (mas não bloqueado)
    if (assessment.riskScore > 30) {
      console.warn(`⚠️ IP suspeito: ${ip}`, assessment.reasons);
    }

    return null;
  }

  /**
   * Limpa IPs antigos do bloqueio
   */
  cleanup(): void {
    const now = Date.now();

    for (const [ip, record] of this.blockedIPs.entries()) {
      if (now - record.timestamp > this.BLOCK_DURATION) {
        this.blockedIPs.delete(ip);
      }
    }
  }

  /**
   * Retorna estatísticas
   */
  getStats(): { blocked: number; total: number } {
    return {
      blocked: this.blockedIPs.size,
      total: this.blockedIPs.size,
    };
  }
}

// Instância singleton
export const vpnTorDetector = new VPNTORDetector();

/**
 * Hook para detecção de VPN/TOR
 */
export function useVPNTORDetection() {
  const checkIP = (ip: string, headers?: Headers): IPRiskAssessment => {
    return assessIPRisk(ip, headers);
  };

  const isBlocked = (ip: string): boolean => {
    return vpnTorDetector.isBlocked(ip);
  };

  const blockIP = (ip: string, reasons: string[]): void => {
    vpnTorDetector.blockIP(ip, reasons);
  };

  const analyzeAndBlock = (ip: string, headers?: Headers): IPRiskAssessment | null => {
    return vpnTorDetector.analyzeAndBlock(ip, headers);
  };

  return {
    checkIP,
    isBlocked,
    blockIP,
    analyzeAndBlock,
    assessIPRisk,
    shouldBlockIP,
  };
}
