import { supabase } from "@/integrations/supabase/client";

export interface GeoLocation {
  ip: string;
  country: string;
  city: string;
  org: string; // Provedor de Internet (ISP) - revela VPNs, Hosting (DigitalOcean, AWS, etc)
  is_vpn: boolean;
}

export async function captureGeolocation(): Promise<GeoLocation | null> {
  try {
    // Usando um serviço gratuito para capturar IP e Geo
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();

    if (data.error) return null;

    // ISPs comuns de VPN e Hospedagem na nuvem
    const suspiciousOrgs = [
      "digitalocean", "aws", "amazon", "google cloud", "azure", "linode", 
      "ovh", "vultr", "hetzner", "expressvpn", "nordvpn", "protonvpn",
      "mullvad", "cyberghost", "private internet access"
    ];

    const orgLower = (data.org || "").toLowerCase();
    const isVpn = suspiciousOrgs.some(suspicious => orgLower.includes(suspicious));

    return {
      ip: data.ip,
      country: data.country_name,
      city: data.city,
      org: data.org,
      is_vpn: isVpn,
    };
  } catch (err) {
    console.error("Falha ao capturar geolocalização", err);
    return null;
  }
}

export async function logSecurityEvent(
  action: string,
  details: Record<string, any> = {}
) {
  try {
    const geo = await captureGeolocation();
    
    await supabase.from("security_logs").insert({
      action,
      ip_address: geo?.ip || "Desconhecido",
      geolocation: geo,
      user_agent: navigator.userAgent,
      details,
    });
  } catch (e) {
    console.error("Falha ao registrar log de segurança", e);
  }
}
