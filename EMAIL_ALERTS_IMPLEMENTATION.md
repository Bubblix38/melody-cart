# Email Alerts for Anomalous Logins

## Overview

Send email notifications to admin when suspicious login patterns are detected.

## Detection Triggers

- 🚩 **New IP Address**: User logs in from a different IP than their last login
- 🚩 **New Country**: Geolocation indicates different country
- 🚩 **New Device**: Browser fingerprint (user agent, screen resolution, timezone) differs from last session
- 🚩 **Rapid Location Change**: Impossible travel time between logins (e.g., New York to Tokyo in 30 minutes)

---

## Step 1: Set Up Email Service

### Option A: Supabase Email (Recommended for Lovable)

Already integrated. Just use the `@supabase/supabase-js` client.

### Option B: SendGrid

```bash
npm install @sendgrid/mail
```

### Option C: Resend (Modern Alternative)

```bash
npm install resend
```

---

## Step 2: Update Login Security Module

File: `src/lib/login-security.ts`

Replace the `detectAnomalies()` function:

```typescript
import { createClient } from "@supabase/supabase-js";

/**
 * Envia email de alerta para anomalias de login
 */
async function sendAnomalyAlert(
  email: string,
  anomalies: string[],
  currentAttempt: LoginAttempt
): Promise<void> {
  try {
    // Option 1: Use Supabase Email (need to set up SMTP or external service)
    const sbAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const adminEmail = process.env.ADMIN_ALERT_EMAIL || "admin@topdj.com.br";
    
    const emailBody = `
🚨 ALERTA DE SEGURANÇA - ATIVIDADE SUSPEITA

Usuário: ${email}
Data/Hora: ${new Date(currentAttempt.timestamp).toLocaleString("pt-BR")}

Anomalias Detectadas:
${anomalies.map((a) => `• ${a}`).join("\n")}

IP: ${currentAttempt.ip}
País: ${currentAttempt.country}
Cidade: ${currentAttempt.city}
Dispositivo: ${currentAttempt.fingerprint}
User-Agent: ${currentAttempt.userAgent}

Ações Recomendadas:
1. Verificar se foi realmente o usuário
2. Se não foi autorizado, mudar senha
3. Revisar histórico de login recente

Dashboard: https://topdj.com/admin/security
    `;

    // Option 1: Send via Supabase Email (if configured)
    // Note: This requires Supabase to have email provider configured
    // Alternatively, use an edge function
    
    // For now, log to database and create notification
    await sbAdmin
      .from("security_alerts")
      .insert({
        user_email: email,
        alert_type: "anomalous_login",
        anomalies: anomalies,
        ip_address: currentAttempt.ip,
        country: currentAttempt.country,
        city: currentAttempt.city,
        device_fingerprint: currentAttempt.fingerprint,
        user_agent: currentAttempt.userAgent,
        created_at: new Date().toISOString(),
        sent_to_admin: true,
      })
      .catch((err) => console.error("Failed to log alert:", err));

    // Option 2: Use SendGrid (if configured)
    if (process.env.SENDGRID_API_KEY) {
      const sgMail = require("@sendgrid/mail");
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      await sgMail.send({
        to: adminEmail,
        from: process.env.SENDGRID_FROM_EMAIL || "noreply@topdj.com.br",
        subject: `🚨 Alerta de Segurança: Login Suspeito de ${email}`,
        html: `
          <h2>Alerta de Segurança - TopDJ</h2>
          <p><strong>Usuário:</strong> ${email}</p>
          <p><strong>Data/Hora:</strong> ${new Date(currentAttempt.timestamp).toLocaleString("pt-BR")}</p>
          
          <h3>Anomalias Detectadas:</h3>
          <ul>
            ${anomalies.map((a) => `<li>${a}</li>`).join("")}
          </ul>
          
          <h3>Detalhes:</h3>
          <ul>
            <li><strong>IP:</strong> ${currentAttempt.ip}</li>
            <li><strong>País:</strong> ${currentAttempt.country}</li>
            <li><strong>Cidade:</strong> ${currentAttempt.city}</li>
            <li><strong>Dispositivo:</strong> ${currentAttempt.fingerprint}</li>
          </ul>
          
          <p><a href="https://topdj.com/admin/security">Ver Dashboard de Segurança</a></p>
        `,
      });
    }
    
    // Option 3: Use Resend
    if (process.env.RESEND_API_KEY) {
      const { Resend } = require("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: "security@topdj.com.br",
        to: adminEmail,
        subject: `🚨 Login Suspeito: ${email}`,
        html: `...same HTML as SendGrid...`,
      });
    }

    console.log(`[ALERT] Anomalous login alert sent for ${email}`);
  } catch (err) {
    console.error("[ALERT] Failed to send anomaly alert:", err);
  }
}

/**
 * Detecta anomalias de segurança (novo IP, país, dispositivo)
 */
function detectAnomalies(email: string, currentAttempt: LoginAttempt): void {
  const previousLogins = LOGIN_HISTORY.filter((a) => a.email === email && a.success);

  if (previousLogins.length === 0) {
    // Primeiro login conhecido - log sem alerta
    console.log(`[LOGIN] First successful login for ${email}`);
    return;
  }

  const lastSuccessful = previousLogins[previousLogins.length - 1];
  const anomalies: string[] = [];

  // Detectar novo IP
  if (lastSuccessful.ip !== currentAttempt.ip) {
    anomalies.push(`Novo IP: ${currentAttempt.ip} (anterior: ${lastSuccessful.ip})`);
  }

  // Detectar novo país
  if (lastSuccessful.country !== currentAttempt.country) {
    anomalies.push(`Novo país: ${currentAttempt.country} (anterior: ${lastSuccessful.country})`);
  }

  // Detectar novo dispositivo (fingerprint)
  if (lastSuccessful.fingerprint !== currentAttempt.fingerprint) {
    anomalies.push(`Novo dispositivo: ${currentAttempt.fingerprint}`);
  }

  // Detectar viagem impossível (mudança de país em tempo muito curto)
  const timeDiffMinutes = (currentAttempt.timestamp - lastSuccessful.timestamp) / 60000;
  if (
    lastSuccessful.country !== currentAttempt.country &&
    timeDiffMinutes < 60 &&
    lastSuccessful.country !== "unknown"
  ) {
    anomalies.push(
      `⚠️ VIAGEM IMPOSSÍVEL: ${lastSuccessful.country} → ${currentAttempt.country} em ${timeDiffMinutes.toFixed(
        0
      )} minutos`
    );
  }

  if (anomalies.length > 0) {
    console.warn(`[LOGIN ANOMALY] ${email}:`, anomalies);
    
    // Send alert email
    sendAnomalyAlert(email, anomalies, currentAttempt).catch((err) =>
      console.error("Error sending alert:", err)
    );
  }
}
```

---

## Step 3: Create Security Alerts Table (Supabase)

If using Supabase to log alerts, create this table:

```sql
CREATE TABLE security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'anomalous_login', 'rate_limit', 'csrf_block'
  anomalies TEXT[] NOT NULL,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  device_fingerprint TEXT,
  user_agent TEXT,
  reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_security_alerts_email ON security_alerts(user_email);
CREATE INDEX idx_security_alerts_created ON security_alerts(created_at DESC);
```

---

## Step 4: Environment Variables

Add to Lovable settings:

```
# Email Service (choose one)
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@topdj.com.br

# OR use Resend
RESEND_API_KEY=re_xxxxx

# Admin alert email
ADMIN_ALERT_EMAIL=admin@topdj.com.br

# Supabase (already configured)
SUPABASE_URL=https://nwsjgacmraijqyvvghoh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxx...
```

---

## Step 5: Create Admin Dashboard View (Optional)

File: `src/components/SecurityAlertsViewer.tsx`

```typescript
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function SecurityAlertsViewer() {
  const [alerts, setAlerts] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ["security-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) return <p>Carregando alertas...</p>;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <h3 className="font-bold text-red-900">Alertas de Segurança</h3>
      <ul className="mt-2 space-y-2">
        {data?.map((alert: any) => (
          <li key={alert.id} className="text-sm text-red-800">
            <strong>{alert.user_email}</strong> - {alert.anomalies.join(", ")}
            <br />
            <span className="text-xs text-red-600">
              {new Date(alert.created_at).toLocaleString("pt-BR")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Then add to admin dashboard:

```tsx
import { SecurityAlertsViewer } from "@/components/SecurityAlertsViewer";

export function Admin() {
  return (
    <div>
      {/* ... existing admin content ... */}
      <div className="mt-8">
        <SecurityAlertsViewer />
      </div>
    </div>
  );
}
```

---

## Testing

1. **Test IP Change**:
   - Use VPN to change IP
   - Try login with same credentials
   - Should trigger "Novo IP" alert
   - Check admin inbox for email

2. **Test Device Change**:
   - Login from different browser
   - Should trigger "Novo dispositivo" alert

3. **Test Impossible Travel**:
   - Manually update database to simulate new country
   - Should trigger travel warning

4. **Check Dashboard**:
   - Navigate to `/admin/security`
   - Should see recent alerts

---

## References

- [Supabase Email](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [SendGrid Email API](https://docs.sendgrid.com/for-developers/sending-email/api-overview)
- [Resend Email API](https://resend.com/docs)
- [OWASP - Detecting Account Takeover](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Estimate**: 1-2 hours
**Priority**: HIGH
**Blockers**: Need to choose email service + get API key
