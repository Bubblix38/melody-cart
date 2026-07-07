# 🔒 Próximos Passos de Hardening de Segurança

**Status Atual**: 5 de 7 vulnerabilidades bloqueadas  
**Data**: 6 de Julho de 2026  
**Prioridade**: 🔴 ALTA

---

## Resumo do Estado Atual

```
✅ BLOQUEADO - Stripe Webhook Signature Verification
✅ BLOQUEADO - CSP Domain Correto (Supabase)
✅ BLOQUEADO - Dynamic CSP Nonces
✅ BLOQUEADO - CSRF Token Storage (In-Memory + HttpOnly)
✅ BLOQUEADO - Rate Limiting Server-Side (5 tentativas/minuto)
⏳ PENDENTE - Google reCAPTCHA v3 no Login Admin (3-5 falhas)
⏳ PENDENTE - Email Alerts para Anomalias de Login

Risco Geral: 🟡 MÉDIO → 🟢 ALTO (após próximos 2 passos)
```

---

## PASSO 1: Google reCAPTCHA v3 no Login Admin (HOJE)

### Objetivo
Adicionar proteção de bot usando reCAPTCHA v3 após 3-5 tentativas falhadas de login.

### Por Quê?
- Protege contra força bruta automatizada
- Silencioso (sem interferência UX)
- Funciona com rate limiter
- Score de risco (0.0 - 1.0)

### Implementação

#### 1.1 Configurar Chaves do reCAPTCHA

**URL**: https://www.google.com/recaptcha/admin

1. Abra Google reCAPTCHA Console
2. Clique "Create" (novo)
3. Configure:
   - **Label**: TopDJ Login
   - **reCAPTCHA type**: reCAPTCHA v3
   - **Domains**: `seu-dominio.lovable.app`, `localhost`
4. Copie:
   - `SITE KEY` → será `VITE_RECAPTCHA_SITE_KEY`
   - `SECRET KEY` → será `VITE_RECAPTCHA_SECRET_KEY` (servidor)

**Exemplo**:
```
SITE KEY: 6Lc...GV5lA
SECRET KEY: 6Lc...GV5lA_senha_super_secreta
```

#### 1.2 Adicionar ao Lovable

**Settings → Environment Variables**:

```
Nome: VITE_RECAPTCHA_SITE_KEY
Valor: 6Lc...GV5lA
Escopo: Production & Preview
```

```
Nome: VITE_RECAPTCHA_SECRET_KEY
Valor: 6Lc...GV5lA_senha_super_secreta
Escopo: Production (apenas servidor!)
```

#### 1.3 Implementar Verificação no Cliente

**Arquivo**: `src/routes/admin.tsx`

Na função `handleLogin()`, adicionar:

```typescript
async function handleLogin(e: React.FormEvent) {
  e.preventDefault();
  setLoginError("");

  const email = loginEmail.trim().toLowerCase();
  const password = loginPassword;

  // Verificar rate limiting (já existe)
  const { checkRateLimit, recordLoginAttempt } = await import("@/lib/login-security");
  const rateCheckEmail = checkRateLimit("admin-login", email);

  if (!rateCheckEmail.allowed) {
    setLoginError(rateCheckEmail.reason || "Muitas tentativas");
    return;
  }

  // ✨ NOVO: Se há falhas anteriores, solicitar reCAPTCHA
  if (rateCheckEmail.requiresCaptcha) {
    // Carregar Google reCAPTCHA
    const token = await executeRecaptcha("login");
    
    if (!token) {
      setLoginError("Verificação reCAPTCHA falhou. Tente novamente.");
      return;
    }

    // Verificar no servidor
    const verified = await verifyRecaptcha(token);
    if (!verified) {
      setLoginError("Você parece ser um bot. Tente novamente mais tarde.");
      return;
    }
  }

  // Continuar com login Supabase (código existente)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  // ... resto do código
}
```

#### 1.4 Criar Função de Execução (Cliente)

**Arquivo**: `src/lib/recaptcha.ts` (novo)

```typescript
/**
 * Execute Google reCAPTCHA v3
 */
export async function executeRecaptcha(action: string): Promise<string | null> {
  // Carregar script se não carregado
  if (!window.grecaptcha) {
    await loadRecaptchaScript();
  }

  try {
    const token = await window.grecaptcha.execute(
      import.meta.env.VITE_RECAPTCHA_SITE_KEY,
      { action }
    );
    return token;
  } catch (error) {
    console.error("Erro ao executar reCAPTCHA:", error);
    return null;
  }
}

/**
 * Carregar script do Google reCAPTCHA
 */
function loadRecaptchaScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar reCAPTCHA"));
    document.head.appendChild(script);
  });
}

/**
 * Tipo para window.grecaptcha
 */
declare global {
  interface Window {
    grecaptcha?: {
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}
```

#### 1.5 Criar Função de Verificação (Servidor)

**Arquivo**: `src/server.ts`

Adicionar novo endpoint `/api/verify-recaptcha`:

```typescript
// Dentro do handler de fetch, adicionar:

if (url.pathname === "/api/verify-recaptcha" && request.method === "POST") {
  try {
    const { token } = (await request.json()) as { token: string };

    if (!token) {
      return new Response(JSON.stringify({ verified: false, reason: "Token ausente" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Chamar Google para verificar
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.VITE_RECAPTCHA_SECRET_KEY || "",
        response: token,
      }).toString(),
    });

    const data = (await response.json()) as {
      success: boolean;
      score: number;
      action: string;
      challenge_ts: string;
      hostname: string;
    };

    // Score > 0.5 é bom
    const verified = data.success && data.score > 0.5;

    if (!verified) {
      console.warn(
        `[reCAPTCHA] Score baixo: ${data.score} (ação: ${data.action})`
      );
    }

    return new Response(
      JSON.stringify({
        verified,
        score: data.score,
        action: data.action,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro ao verificar reCAPTCHA:", error);
    return new Response(
      JSON.stringify({ verified: false, reason: "Erro interno" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

#### 1.6 Criar Função de Verificação (Cliente)

Na mesma função de `admin.tsx`:

```typescript
async function verifyRecaptcha(token: string): Promise<boolean> {
  try {
    const response = await fetch("/api/verify-recaptcha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = (await response.json()) as { verified: boolean };
    return data.verified;
  } catch (error) {
    console.error("Erro ao verificar reCAPTCHA:", error);
    return false;
  }
}
```

### Checklist - Passo 1

- [ ] Obter Site Key e Secret Key do Google reCAPTCHA
- [ ] Adicionar variáveis ao Lovable (`VITE_RECAPTCHA_SITE_KEY`, `VITE_RECAPTCHA_SECRET_KEY`)
- [ ] Criar `src/lib/recaptcha.ts` com funções de carregamento/execução
- [ ] Adicionar endpoint `/api/verify-recaptcha` em `src/server.ts`
- [ ] Integrar em `src/routes/admin.tsx` função `handleLogin()`
- [ ] Testar com 3+ tentativas falhadas
- [ ] Verificar score de reCAPTCHA no console do Google
- [ ] Commit: `feat: add Google reCAPTCHA v3 to admin login`

**Tempo Estimado**: 2-3 horas

---

## PASSO 2: Email Alerts para Anomalias de Login (SEMANA)

### Objetivo
Enviar e-mail ao admin quando detectar:
- Login de novo IP
- Login de novo país
- Login de novo dispositivo
- Padrão anómalo de tentativas

### Por Quê?
- Detecta contas comprometidas
- Permite resposta rápida
- Log de auditoria
- Conformidade de segurança (LGPD/GDPR)

### Implementação

#### 2.1 Escolher Serviço de Email

**Opções**:

| Serviço | Setup | Custo | Recomendação |
|---|---|---|---|
| **Supabase Email** | 5 min | Grátis (100/dia) | 🟢 Melhor (já integrado) |
| **SendGrid** | 10 min | Grátis (100/dia) | 🟡 Bom (integração direta) |
| **Resend** | 5 min | Grátis (100/dia) | 🟡 Bom (React email) |
| **AWS SES** | 20 min | Pago | 🔴 Complexo |

**Recomendação**: **Supabase Email** (já está no Supabase)

#### 2.2 Configurar Supabase Email

**Via Console Supabase**:

1. Abra https://app.supabase.com/
2. Projeto: `nwsjgacmraijqyvvghoh`
3. Menu → **Email Templates**
4. Criar novo template:
   - **Nome**: `anomalous_login_alert`
   - **Assunto**: `⚠️ Login Anômalo Detectado`
   - **HTML**:

```html
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
  Esta é uma mensagem de segurança automática. 
  Não responda a este e-mail.
</p>
```

#### 2.3 Criar Tabela de Auditoria

**Via Supabase Console → SQL Editor**:

```sql
CREATE TABLE security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'anomalous_login', 'failed_attempts', etc
  ip_address TEXT,
  country TEXT,
  device_fingerprint TEXT,
  reason TEXT,
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  handled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_security_alerts_user_id ON security_alerts(user_id);
CREATE INDEX idx_security_alerts_created_at ON security_alerts(created_at DESC);
```

#### 2.4 Implementar Envio de Email

**Arquivo**: `src/lib/security-alerts.ts` (novo)

```typescript
import { supabase } from "@/integrations/supabase/client";

export interface SecurityAlert {
  userEmail: string;
  alertType: "anomalous_login" | "failed_attempts" | "impossible_travel";
  ip: string;
  country: string;
  device: string;
  reason: string;
  severity: "low" | "medium" | "high";
}

/**
 * Enviar alerta de segurança via Supabase Email
 */
export async function sendSecurityAlert(alert: SecurityAlert): Promise<boolean> {
  try {
    // Enviar email via Supabase
    const response = await fetch("/api/send-security-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alert),
    });

    return response.ok;
  } catch (error) {
    console.error("Erro ao enviar alerta de segurança:", error);
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
    await supabase.from("security_alerts").insert({
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
    console.error("Erro ao registrar alerta:", error);
  }
}
```

#### 2.5 Adicionar Endpoint de Email

**Arquivo**: `src/server.ts`

Adicionar novo endpoint `/api/send-security-alert`:

```typescript
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

    // Usar Supabase Auth API para enviar email
    const emailResponse = await fetch(
      `${process.env.VITE_SUPABASE_URL}/auth/v1/admin/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ""}`,
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
            reset_link: `${process.env.VITE_APP_URL}/admin/reset-password`,
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
```

#### 2.6 Integrar com Detecção de Anomalias

**Arquivo**: `src/lib/login-security.ts`

Modificar função `detectAnomalies()`:

```typescript
async function detectAnomalies(email: string, currentAttempt: LoginAttempt): Promise<void> {
  const previousLogins = LOGIN_HISTORY.filter((a) => a.email === email && a.success);

  if (previousLogins.length === 0) {
    return;
  }

  const lastSuccessful = previousLogins[previousLogins.length - 1];
  const anomalies: string[] = [];
  let severity: "low" | "medium" | "high" = "low";

  // Detectar novo IP
  if (lastSuccessful.ip !== currentAttempt.ip) {
    anomalies.push(`Novo IP: ${currentAttempt.ip}`);
    severity = "medium";
  }

  // Detectar novo país (anomalia ALTA)
  if (lastSuccessful.country !== currentAttempt.country) {
    anomalies.push(`Novo país: ${currentAttempt.country}`);
    severity = "high";
  }

  // Detectar novo dispositivo
  if (lastSuccessful.fingerprint !== currentAttempt.fingerprint) {
    anomalies.push(`Novo dispositivo`);
    severity = "medium";
  }

  if (anomalies.length > 0) {
    console.warn(`[LOGIN ANOMALY] ${email}:`, anomalies);

    // ✨ NOVO: Enviar alerta
    const { sendSecurityAlert, recordSecurityAlert } = await import(
      "@/lib/security-alerts"
    );

    const alert = {
      userEmail: email,
      alertType: "anomalous_login" as const,
      ip: currentAttempt.ip,
      country: currentAttempt.country,
      device: currentAttempt.fingerprint,
      reason: anomalies.join(" | "),
      severity,
    };

    await sendSecurityAlert(alert);
    // await recordSecurityAlert(userId, alert); // TODO: quando tiver userId
  }
}
```

#### 2.7 Criar Dashboard de Alertas

**Arquivo**: `src/components/SecurityAlertsViewer.tsx` (novo)

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle } from "lucide-react";

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
        <p className="text-sm text-muted-foreground">Nenhum alerta de segurança.</p>
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
```

### Checklist - Passo 2

- [ ] Criar template de email em Supabase
- [ ] Criar tabela `security_alerts` no Supabase
- [ ] Criar `src/lib/security-alerts.ts`
- [ ] Adicionar endpoint `/api/send-security-alert` em `src/server.ts`
- [ ] Modificar `detectAnomalies()` para enviar alertas
- [ ] Criar `src/components/SecurityAlertsViewer.tsx`
- [ ] Adicionar viewer no admin dashboard
- [ ] Testar fazendo login de nova localização
- [ ] Verificar e-mail de alerta recebido
- [ ] Commit: `feat: add email alerts for anomalous logins`

**Tempo Estimado**: 1-2 horas

---

## Resumo Final

### Antes (Estado Atual)
```
🔴 CRÍTICO - Admin sem proteção contra força bruta
🟡 MÉDIO   - Sem verificação de bot
🟡 MÉDIO   - Sem alertas de anomalias
```

### Depois (Após 2 Passos)
```
🟢 SEGURO  - Rate limiting + reCAPTCHA + Email alerts
🟢 SEGURO  - Anomalias detectadas automaticamente
🟢 SEGURO  - Admin pode responder rápido a ameaças
```

### Impacto de Segurança

| Ataque | Antes | Depois |
|---|---|---|
| Força bruta | ⚠️ Bloqueado em 15min | ✅ Bloqueado + Captcha em 3 tentativas |
| Bot automatizado | ❌ Nada | ✅ reCAPTCHA v3 |
| Account takeover | ⚠️ Sem detecção | ✅ Email alert imediato |
| Localização impossível | ❌ Nada | ✅ Detectada + alertada |

---

## Próximas Semanas (LOW PRIORITY)

### Passo 3: Dashboard de Segurança
- Ver histórico de login
- Kickar sessões anômalas
- 2FA (TOTP)
- Análise de risco em tempo real

### Passo 4: Auditoria Completa
- Log em banco de dados (não apenas memória)
- Relatórios de segurança
- Conformidade LGPD/GDPR

---

## 📞 Suporte

Se encontrar erros:

1. Verificar console (F12) para erros JavaScript
2. Ver logs do servidor (Cloudflare Workers)
3. Confirmar variáveis de ambiente no Lovable
4. Limpar cache do navegador (Ctrl+Shift+Del)

---

**Status**: 🔴 BLOQUEADO AGUARDANDO AÇÃO
**Próximo Passo**: Implementar reCAPTCHA v3
**Tempo Total**: ~4 horas
**Criticidade**: 🔴 ALTA (admin é ponto crítico)

