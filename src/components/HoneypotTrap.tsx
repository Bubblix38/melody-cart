import { useEffect, useState } from "react";
import { Terminal } from "lucide-react";
import { logSecurityEvent } from "@/lib/security-logger";

export function HoneypotTrap({ pathName }: { pathName: string }) {
  const [text, setText] = useState("");
  const fullText = `TENTATIVA DE INVASÃO DETECTADA EM [${pathName}]...\n\nENDEREÇO IP REGISTRADO E RASTREADO.\nIMPRESSÃO DIGITAL DO DISPOSITIVO CAPTURADA.\n\nINICIANDO CONTRA-MEDIDAS...\nENVIANDO PAYLOAD PARA O SISTEMA DO INVASOR...\n\nADEUS.`;

  useEffect(() => {
    // Marca o intruso para sempre no armazenamento local do navegador dele
    localStorage.setItem("HONEYPOT_BANNED", "true");
    
    // Registra a invasão no banco de dados via RPC/Log
    logSecurityEvent("honeypot_triggered", { 
      route: pathName, 
      userAgent: navigator.userAgent 
    });

    let index = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) {
        clearInterval(interval);
        setTimeout(() => {
          window.location.href = "https://www.fbi.gov/investigate/cyber";
        }, 2000);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [fullText]);

  return (
    <div className="min-h-screen bg-black text-[#00ff00] font-mono p-8 overflow-hidden flex flex-col justify-center items-center cursor-none select-none">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden mt-10">
        <div className="bg-zinc-800 px-4 py-2 flex items-center justify-between border-b border-zinc-700">
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <Terminal className="w-4 h-4" />
            <span>cmd.exe - TRACING INTRUDER</span>
          </div>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </div>
        <div className="p-6 h-[400px] whitespace-pre-wrap text-lg relative">
          {text}
          <span className="animate-pulse inline-block w-2 h-5 bg-[#00ff00] ml-1 align-middle"></span>
        </div>
      </div>
    </div>
  );
}
