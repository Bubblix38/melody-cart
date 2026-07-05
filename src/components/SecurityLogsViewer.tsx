import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ShieldAlert, Shield, Globe, MapPin, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function SecurityLogsViewer() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["security_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    // Poll every 30 seconds for live attacks
    refetchInterval: 30000, 
  });

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Carregando logs de segurança...</div>;
  }

  const filteredLogs = logs?.filter(log => 
    log.ip_address?.includes(searchTerm) || 
    log.action?.includes(searchTerm) ||
    JSON.stringify(log.geolocation)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShieldAlert className="text-destructive w-5 h-5" /> 
          Monitoramento Ativo (Logs de Segurança)
        </h2>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar IP ou localização..." 
            className="pl-8" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {filteredLogs?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
            <Shield className="w-12 h-12 text-primary/30 mb-2" />
            <p>Nenhuma ameaça detectada recentemente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3">Data/Hora</th>
                  <th className="px-4 py-3">Ação / Gatilho</th>
                  <th className="px-4 py-3">IP do Invasor</th>
                  <th className="px-4 py-3">Geolocalização & Anti-VPN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs?.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3">
                      {log.action === 'honeypot_triggered' ? (
                        <Badge variant="destructive">Honeypot Trap</Badge>
                      ) : log.action === 'login_failed' ? (
                        <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">Falha de Login</Badge>
                      ) : (
                        <Badge variant="secondary">{log.action}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {log.ip_address}
                    </td>
                    <td className="px-4 py-3">
                      {log.geolocation ? (
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {log.geolocation.city}, {log.geolocation.country}
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-muted-foreground" />
                            <span className="truncate max-w-[200px]" title={log.geolocation.org}>
                              {log.geolocation.org}
                            </span>
                          </div>
                          {log.geolocation.is_vpn && (
                            <Badge variant="destructive" className="mt-1 w-max text-[10px] h-4">ALERTA: VPN / PROXY</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Sem rastreio</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
