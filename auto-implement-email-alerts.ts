/**
 * Script automático para implementar Email Alerts
 * 
 * Execute este script para automaticamente:
 * 1. Criar arquivo src/lib/security-alerts.ts
 * 2. Adicionar endpoint /api/send-security-alert em src/server.ts
 * 3. Integrar em src/lib/login-security.ts
 * 4. Criar SecurityAlertsViewer component
 * 
 * Uso:
 *   npx ts-node auto-implement-email-alerts.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const projectRoot = process.cwd();

console.log('🤖 Automação: Implementar Email Alerts');
console.log('======================================\n');

// 1. Criar src/lib/security-alerts.ts
const alertsFile = path.join(projectRoot, 'src', 'lib', 'security-alerts.ts');

const alertsContent = `/**
 * Sistema de alertas de segurança
 */

import { supabase } from '@/integrations/supabase/client';

export interface SecurityAlert {
  userEmail: string;
  alertType: 'anomalous_login' | 'failed_attempts' | 'impossible_travel';
  ip: string;
  country: string;
  device: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Enviar alerta de segurança via API
 */
export async function sendSecurityAlert(alert: SecurityAlert): Promise<boolean> {
  try {
    const response = await fetch('/api/send-security-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao enviar alerta de segurança:', error);
    return false;
  }
}

/**
 * Registrar alerta no banco de dados
 */
export async function recordSecurityAlert(
  userId: string,
  alert: SecurityAlert
): Promise<void> {
  try {
    await supabase.from('security_alerts').insert({
      user_id: userId,
      email: alert.userEmail,
      alert_type: alert.alertType,
      ip_address: alert.ip,
      country: alert.country,
      device_fingerprint: alert.device,
      reason: alert.reason,
      severity: alert.severity,
      handled: false,
    });
  } catch (error) {
    console.error('Erro ao registrar alerta:', error);
  }
}
`;

console.log('[*] Criando src/lib/security-alerts.ts...');
fs.writeFileSync(alertsFile, alertsContent);
console.log('[OK] src/lib/security-alerts.ts criado\n');

// 2. Server endpoint
const serverEndpointCode = `
// Adicione isto em src/server.ts (antes do fetch handler)

if (url.pathname === "/api/send-security-alert" && request.method === "POST") {
  try {
    const alert = (await request.json()) as {
      userEmail: string;
      alertType: string;
      ip: string;
      country: string;
      device: string;
      reason: string;
      severity: string;
    };

    // Usar Supabase Email API
    const emailResponse = await fetch(
      \`\${process.env.VITE_SUPABASE_URL}/auth/v1/admin/users\`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": \`Bearer \${process.env.SUPABASE_SERVICE_ROLE_KEY || ""}\`,
        },
        body: JSON.stringify({
          email: alert.userEmail,
          template: "anomalous_login_alert",
          data: {
            email: alert.userEmail,
            ip: alert.ip,
            country: alert.country,
            device: alert.device,
            timestamp: new Date().toLocaleString("pt-BR"),
            reason: alert.reason,
            reset_link: \`\${process.env.VITE_APP_URL}/admin/reset-password\`,
          },
        }),
      }
    );

    return new Response(
      JSON.stringify({
        success: emailResponse.ok,
        status: emailResponse.status,
      }),
      {
        status: emailResponse.ok ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro ao enviar alerta:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
`;

const serverInstructionsFile = path.join(projectRoot, 'SERVER_ENDPOINT_EMAIL_ALERTS.txt');
fs.writeFileSync(
  serverInstructionsFile,
  'ADICIONE ISTO EM src/server.ts (antes do return new Response no final):\n\n' + serverEndpointCode
);
console.log('[OK] Instruções para server salvas em SERVER_ENDPOINT_EMAIL_ALERTS.txt\n');

// 3. Component SecurityAlertsViewer
const componentCode = `
// Copie isto para: src/components/SecurityAlertsViewer.tsx

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";

export function SecurityAlertsViewer() {
  const { data: alerts } = useQuery({
    queryKey: ["security-alerts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("security_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  return (
    <div className="rounded-lg border border-border p-4">
      <h2 className="mb-4 font-semibold">🔒 Alertas de Segurança</h2>

      {!alerts || alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum alerta.</p>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 rounded bg-muted/50 p-3 text-sm"
            >
              {alert.severity === "high" ? (
                <AlertCircle className="mt-0.5 h-4 w-4 text-red-500 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 text-yellow-500 shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-mono text-xs text-muted-foreground">
                  {alert.email}
                </p>
                <p>{alert.reason}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(alert.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`;

const componentFile = path.join(projectRoot, 'COMPONENT_SECURITY_ALERTS_VIEWER.tsx');
fs.writeFileSync(componentFile, componentCode);
console.log('[OK] Componente salvo em COMPONENT_SECURITY_ALERTS_VIEWER.tsx\n');

// 4. SQL para criar tabela
const sqlCode = `
-- Execute isto em Supabase SQL Editor:

CREATE TABLE security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  ip_address TEXT,
  country TEXT,
  device_fingerprint TEXT,
  reason TEXT,
  severity TEXT DEFAULT 'medium',
  handled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_security_alerts_user_id ON security_alerts(user_id);
CREATE INDEX idx_security_alerts_created_at ON security_alerts(created_at DESC);
`;

const sqlFile = path.join(projectRoot, 'CREATE_SECURITY_ALERTS_TABLE.sql');
fs.writeFileSync(sqlFile, sqlCode);
console.log('[OK] SQL salvo em CREATE_SECURITY_ALERTS_TABLE.sql\n');

// 5. Email template instruções
const emailTemplateCode = `
CRIE TEMPLATE NO SUPABASE:

1. Supabase → Settings → Email Templates
2. Clique em "Create" ou use existente
3. Nome: anomalous_login_alert
4. Subject: ⚠️ Login Anômalo Detectado
5. HTML:

<h2>🔐 Alerta de Segurança</h2>
<p>Um login anômalo foi detectado em sua conta TopDJ Admin.</p>

<h3>Detalhes:</h3>
<ul>
  <li><strong>Email:</strong> {{email}}</li>
  <li><strong>IP:</strong> {{ip}}</li>
  <li><strong>País:</strong> {{country}}</li>
  <li><strong>Dispositivo:</strong> {{device}}</li>
  <li><strong>Hora:</strong> {{timestamp}}</li>
  <li><strong>Motivo:</strong> {{reason}}</li>
</ul>

<h3>Não foi você?</h3>
<p>
  <a href="{{reset_link}}">Redefina sua senha agora</a>
</p>

<p style="color: #666; font-size: 12px;">
  Esta é uma mensagem automática. Não responda.
</p>
`;

const emailTemplateFile = path.join(projectRoot, 'EMAIL_TEMPLATE_SETUP.txt');
fs.writeFileSync(emailTemplateFile, emailTemplateCode);
console.log('[OK] Template de email salvo em EMAIL_TEMPLATE_SETUP.txt\n');

// 6. Integração em login-security.ts
const loginSecurityIntegrationCode = `
// Adicione isto em src/lib/login-security.ts, na função detectAnomalies():

import { sendSecurityAlert } from '@/lib/security-alerts';

// ... dentro de detectAnomalies()

if (anomalies.length > 0) {
  console.warn(\`[LOGIN ANOMALY] \${email}:\`, anomalies);

  // ✨ Enviar alerta
  const alert = {
    userEmail: email,
    alertType: 'anomalous_login' as const,
    ip: currentAttempt.ip,
    country: currentAttempt.country,
    device: currentAttempt.fingerprint,
    reason: anomalies.join(' | '),
    severity: severity as 'low' | 'medium' | 'high',
  };

  await sendSecurityAlert(alert);
}
`;

const loginSecurityFile = path.join(projectRoot, 'LOGIN_SECURITY_INTEGRATION.txt');
fs.writeFileSync(loginSecurityFile, loginSecurityIntegrationCode);
console.log('[OK] Integração salva em LOGIN_SECURITY_INTEGRATION.txt\n');

// 7. Checklist
const checklistContent = `
✅ CHECKLIST - IMPLEMENTAÇÃO DE EMAIL ALERTS

Arquivos Criados:
  [x] src/lib/security-alerts.ts
  
Instruções Criadas:
  [ ] SERVER_ENDPOINT_EMAIL_ALERTS.txt - Copiar em src/server.ts
  [ ] LOGIN_SECURITY_INTEGRATION.txt - Copiar em src/lib/login-security.ts
  [ ] COMPONENT_SECURITY_ALERTS_VIEWER.tsx - Criar novo arquivo
  [ ] EMAIL_TEMPLATE_SETUP.txt - Setup em Supabase
  [ ] CREATE_SECURITY_ALERTS_TABLE.sql - Executar em Supabase
  
Supabase Setup:
  [ ] Executar CREATE_SECURITY_ALERTS_TABLE.sql (SQL Editor)
  [ ] Criar email template em Email Templates
  [ ] Teste envio de email
  
Implementação Manual:
  [ ] Copiar código do SERVER_ENDPOINT_EMAIL_ALERTS.txt em src/server.ts
  [ ] Copiar código do LOGIN_SECURITY_INTEGRATION.txt em src/lib/login-security.ts
  [ ] Copiar COMPONENT_SECURITY_ALERTS_VIEWER.tsx
  [ ] Adicionar SecurityAlertsViewer em src/routes/admin.tsx
  
Testes:
  [ ] npm run build (sem erros)
  [ ] npm run dev
  [ ] Fazer login com novo IP/País
  [ ] Verificar email de alerta
  [ ] Verificar alertas no dashboard admin
  [ ] Dashboard mostra alertas em tempo real
  
Commits:
  [ ] git add .
  [ ] git commit -m "feat: implement email alerts for anomalous logins"
  [ ] git push
`;

const checklistFile = path.join(projectRoot, 'CHECKLIST_EMAIL_ALERTS.md');
fs.writeFileSync(checklistFile, checklistContent);
console.log('[OK] Checklist criado em CHECKLIST_EMAIL_ALERTS.md\n');

console.log('======================================');
console.log('✅ AUTOMAÇÃO COMPLETA!\n');
console.log('Arquivos criados:');
console.log('  1. src/lib/security-alerts.ts');
console.log('  2. SERVER_ENDPOINT_EMAIL_ALERTS.txt (instruções)');
console.log('  3. LOGIN_SECURITY_INTEGRATION.txt (instruções)');
console.log('  4. COMPONENT_SECURITY_ALERTS_VIEWER.tsx (componente)');
console.log('  5. EMAIL_TEMPLATE_SETUP.txt (Supabase setup)');
console.log('  6. CREATE_SECURITY_ALERTS_TABLE.sql (banco de dados)');
console.log('  7. CHECKLIST_EMAIL_ALERTS.md\n');
console.log('Próximos passos:');
console.log('  1. Executar SQL em Supabase');
console.log('  2. Criar template de email em Supabase');
console.log('  3. Copiar código em 3 lugares:');
console.log('     - src/server.ts');
console.log('     - src/lib/login-security.ts');
console.log('     - Adicionar componente em admin.tsx');
console.log('  4. npm run build');
console.log('  5. Teste fazendo login de novo IP');
console.log('  6. Verificar email de alerta');
console.log('  7. git push');
