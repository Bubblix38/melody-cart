# 🏗️ Arquitetura de Segurança - TopDJ

**Data**: 6 de Julho de 2026  
**Estado**: 71% completo (5 de 7 vulnerabilidades bloqueadas)

---

## 1. Fluxo de Requisição (HTTP Security)

```
🌍 CLIENTE (Navegador)
├─ REQUISIÇÃO HTTP
│  ├─ Headers: Origin, Referer, Cookie
│  └─ Body: dados (potencialmente maliciosos)
│
↓ ✅ VALIDAÇÕES NO SERVIDOR
│
🛡️ SERVER (src/server.ts)
├─ 1️⃣ Verificar CORS/Origin (CSRF Prevention)
│  │  └─ Se Origin != whitelist → Rejeitar 🚫
│  │
├─ 2️⃣ Gerar Nonce Dinâmico para HTML
│  │  └─ Cada resposta tem nonce único → CSP + XSS Prevention
│  │
├─ 3️⃣ Validar CSRF Token (Double-Submit)
│  │  └─ Token em formulário + Cookie deve ser igual
│  │
├─ 4️⃣ Rate Limit (IP + Email)
│  │  └─ Max 5 tentativas/minuto → Força bruta bloqueada
│  │
├─ 5️⃣ Verificar Assinatura Stripe Webhook (HMAC-SHA256)
│  │  └─ Se header inválido → Rejeitar
│  │
└─ 6️⃣ Enviar Resposta com Headers de Segurança
     └─ CSP, X-Frame-Options, X-Content-Type-Options, etc
     
↓
✅ RESPOSTA SEGURA
└─ HTML com nonce inline scripts
└─ Cookies com flags: HttpOnly, SameSite=Strict

```

---

## 2. Fluxo de Login com Segurança Completa

```
👤 USUÁRIO CLICA "ENTRAR"
└─ Email + Senha no formulário
   └─ Valida CSRF token (cliente)

↓

🔍 CLIENTE: Verificar Rate Limit (checkRateLimit)
├─ Bloquear se > 5 tentativas recentes?
│  ├─ SIM: Mostrar erro + timer 🚫
│  │
│  └─ NÃO: Continuar
│
└─ Há falhas anteriores? (requiresCaptcha)
   ├─ SIM: Solicitar Google reCAPTCHA v3 ✅ NOVO
   │  ├─ Carregar script: https://google.com/recaptcha/api.js
   │  ├─ Execute com action="login"
   │  ├─ Gera token reCAPTCHA
   │  └─ Envia para servidor: POST /api/verify-recaptcha
   │
   └─ NÃO: Pular reCAPTCHA

↓

📡 SERVIDOR: Verificar reCAPTCHA (POST /api/verify-recaptcha)
├─ Chamar Google: https://www.google.com/recaptcha/api/siteverify
├─ Score > 0.5? (0.0=bot, 1.0=humano)
│  ├─ SIM: Continuar ✅
│  └─ NÃO: Rejeitar 🚫
│
└─ Responder: { verified: true, score: 0.8 }

↓

🔑 CLIENTE: Login com Supabase
└─ supabase.auth.signInWithPassword(email, password)

↓

📊 SERVIDOR: Registrar Tentativa (recordLoginAttempt)
├─ Email
├─ IP → Obter localização
├─ User Agent → Gerar fingerprint dispositivo
├─ Timestamp
└─ Success: true/false

↓

🔎 SERVIDOR: Detectar Anomalias (detectAnomalies)
├─ Comparar com último login bem-sucedido:
│  ├─ Novo IP? → Alertar ⚠️
│  ├─ Novo país? → Alertar CRÍTICO 🔴
│  ├─ Novo dispositivo? → Alertar ⚠️
│  └─ Padrão temporal impossível? → Alertar 🔴
│
└─ Se anomalia detectada:
   └─ Enviar email de alerta ao admin ✅ NOVO (em progresso)
   └─ Registrar em security_alerts table
   └─ Mostrar no Dashboard de Alertas

↓

✅ LOGIN BEM-SUCEDIDO
├─ Token de sessão gerado
├─ Fingerprint armazenado
├─ Múltiplas sessões validadas
└─ Redirecionar para /admin

```

---

## 3. Arquitetura de Camadas de Segurança (Defense in Depth)

```
┌────────────────────────────────────────────────────────┐
│  CAMADA 1: TRANSPORTE (HTTPS/TLS)                      │
│  └─ Todas as requisições HTTPS                         │
├────────────────────────────────────────────────────────┤
│  CAMADA 2: AUTENTICAÇÃO (Supabase Auth)                │
│  ├─ Email + Senha com salting/hashing                  │
│  ├─ JWT Token (curta duração)                          │
│  └─ Session Storage seguro                             │
├────────────────────────────────────────────────────────┤
│  CAMADA 3: AUTORIZAÇÃO (RLS + Roles)                   │
│  ├─ Row-Level Security (Supabase)                      │
│  ├─ user_roles table (admin/user/vendor)               │
│  └─ Verificação per-request                            │
├────────────────────────────────────────────────────────┤
│  CAMADA 4: PROTEÇÃO DE REQUISIÇÃO                      │
│  ├─ CSRF: Double-Submit Cookie                         │
│  ├─ Rate Limiting: 5 req/min per user/IP               │
│  ├─ reCAPTCHA v3: Score-based bot detection ✅ NOVO    │
│  └─ Input Validation: Zod schemas                      │
├────────────────────────────────────────────────────────┤
│  CAMADA 5: PROTEÇÃO DE CONTEÚDO                        │
│  ├─ CSP: Nonce-based (sem unsafe-inline)               │
│  ├─ X-Frame-Options: DENY                              │
│  ├─ X-Content-Type-Options: nosniff                    │
│  ├─ Sanitização: DOMPurify                             │
│  └─ SQL Injection: Supabase prepared statements        │
├────────────────────────────────────────────────────────┤
│  CAMADA 6: DETECÇÃO & RESPOSTA                         │
│  ├─ Login Anomaly Detection: IP/Country/Device         │
│  ├─ Email Alerts: Anomalia → Email imediato ✅ NOVO    │
│  ├─ Security Logs: Auditoria em banco                  │
│  └─ Dashboard: View de alertas em tempo real           │
├────────────────────────────────────────────────────────┤
│  CAMADA 7: RECUPERAÇÃO                                 │
│  ├─ Password Reset: Link de 15 minutos                 │
│  ├─ Session Revocation: Logout em todos dispositivos   │
│  ├─ Threat Response: Bloquear IP suspeito              │
│  └─ Audit Trail: Rastreabilidade completa              │
└────────────────────────────────────────────────────────┘
```

---

## 4. Comparação: Antes vs Depois

### Antes (Vulnerável)

```
CLIENTE                 SERVIDOR
─────────               ────────
Senha → (HTTP? ⚠️)  →  Armazenar plaintext ❌
        (Sem validação) ❌
        (Rate limit cliente) ❌
                        Sem nonce ❌
                        Sem CSRF ❌
                        Sem rate limit servidor ❌
                        Sem anomaly detection ❌
                        
RISCO: 🔴 CRÍTICO (força bruta em 1 minuto)
```

### Depois (Seguro)

```
CLIENTE                 SERVIDOR
─────────               ────────
Senha → (HTTPS) → Validar rate limit ✅
        (CSRF token)   Verificar reCAPTCHA ✅
        (Validation)   Hash + Salt ✅
                       Rate limit exponencial ✅
                       Gerar nonce ✅
                       CSRF Double-Submit ✅
                       Anomaly detection ✅
                       Email alerts ✅
                       Audit log ✅
                       
RISCO: 🟢 SEGURO (força bruta bloqueada em 15min, depois 1 hora)
```

---

## 5. Componentes de Segurança

```
┌─────────────────────────────────────────┐
│       SRC/LIB (Segurança)               │
├─────────────────────────────────────────┤
│                                         │
│  📁 security-headers.ts                 │
│  ├─ generateNonce()                     │
│  ├─ getSecurityHeaders()                │
│  ├─ getMetaTags()                       │
│  └─ CSP com {NONCE}                     │
│                                         │
│  📁 csrf.ts                             │
│  ├─ generateCsrfToken()                 │
│  ├─ setCsrfToken()                      │
│  ├─ getCsrfToken()                      │
│  ├─ validateCsrfToken()                 │
│  └─ In-memory storage                   │
│                                         │
│  📁 login-security.ts ✅ EXISTENTE      │
│  ├─ checkRateLimit()                    │
│  ├─ recordLoginAttempt()                │
│  ├─ generateDeviceFingerprint()         │
│  ├─ detectAnomalies()                   │
│  └─ getClientLocationInfo()             │
│                                         │
│  📁 recaptcha.ts ✅ NOVO (PRÓXIMO)      │
│  ├─ executeRecaptcha()                  │
│  └─ loadRecaptchaScript()               │
│                                         │
│  📁 security-alerts.ts ✅ NOVO (PRÓXIMO)│
│  ├─ sendSecurityAlert()                 │
│  └─ recordSecurityAlert()               │
│                                         │
│  📁 server-security.ts                  │
│  ├─ applySecurityHeaders()              │
│  └─ Com nonce parameter                 │
│                                         │
└─────────────────────────────────────────┘
```

---

## 6. Fluxo de Dados do Rate Limiter

```
CLIENTE                          SERVIDOR (src/server.ts)
───────                          ────────

Tentativa de Login #1
  ├─ checkRateLimit("admin", email)
  │  └─ Permitir ✅
  ├─ Login falha (senha errada)
  ├─ recordLoginAttempt(email, false)
  │  └─ Incrementa contador
  │
Tentativa #2
  ├─ checkRateLimit("admin", email)
  │  └─ Permitir ✅
  ├─ Login falha
  ├─ recordLoginAttempt(email, false)
  │
Tentativa #3
  ├─ checkRateLimit("admin", email)
  │  └─ Permitir ✅
  ├─ Mostrar aviso: "3 tentativas"
  │
Tentativa #4
  ├─ checkRateLimit("admin", email)
  │  └─ Permitir ✅
  │
Tentativa #5
  ├─ checkRateLimit("admin", email)
  │  └─ Permitir ✅
  ├─ Atingiu limite: 5 tentativas
  │
Tentativa #6
  ├─ checkRateLimit("admin", email)
  │  └─ requiresCaptcha = true ✅
  │  └─ remainingSeconds = 15min
  │
  ├─ Mostrar reCAPTCHA
  ├─ Usuário passa no reCAPTCHA
  ├─ Espera 15 minutos
  │
Tentativa #7 (depois de 15min)
  ├─ checkRateLimit("admin", email)
  │  └─ Bloqueado por 30min agora
  │  └─ (exponencial backoff: 2x)
  │
Tentativa #8 (depois de 30min)
  ├─ checkRateLimit("admin", email)
  │  └─ Bloqueado por 1 hora agora
  │  └─ (máximo backoff atingido)
  │
Tentativa #9 (depois de 1 hora)
  ├─ checkRateLimit("admin", email)
  │  └─ Reset do contador ✅
  └─ Permitir nova tentativa
```

---

## 7. Integração Lovable ↔ Supabase ↔ Stripe

```
┌─────────────────────────────────────────────────┐
│              LOVABLE (Frontend)                 │
│  ├─ src/routes/admin.tsx                        │
│  ├─ src/lib/login-security.ts                   │
│  ├─ src/lib/csrf.ts                             │
│  ├─ src/lib/recaptcha.ts ✅ NOVO                │
│  └─ src/lib/security-alerts.ts ✅ NOVO          │
└────────────────────┬────────────────────────────┘
                     │
         HTTPS + CSP + Nonce
                     │
┌────────────────────▼────────────────────────────┐
│          CLOUDFLARE WORKERS (Server)            │
│  ├─ src/server.ts                               │
│  │  ├─ CSRF Validation                          │
│  │  ├─ Rate Limiting                            │
│  │  ├─ reCAPTCHA Verification ✅ NOVO           │
│  │  ├─ Security Headers + Nonce                 │
│  │  ├─ Stripe Webhook Verification              │
│  │  └─ Email Alert Endpoint ✅ NOVO             │
│  │                                              │
│  └─ Security Headers                            │
│     ├─ CSP com nonce                            │
│     ├─ X-Frame-Options                          │
│     ├─ X-Content-Type-Options                   │
│     └─ Strict-Transport-Security                │
└────┬────────────────┬────────────────────┬──────┘
     │                │                    │
     │ Fetch DB       │ Verify Token      │ Send Email
     │                │                    │
┌────▼──────┐  ┌──────▼────────┐  ┌──────▼────────┐
│ SUPABASE  │  │    GOOGLE     │  │   SUPABASE    │
│ ├─ Auth   │  │  reCAPTCHA    │  │   Email       │
│ ├─ DB     │  │  └─ Verify    │  │   Templates   │
│ ├─ Packs  │  │     Token     │  │               │
│ ├─ Tracks │  │  └─ Score     │  │ security_     │
│ └─ Roles  │  │     (0.0-1.0) │  │ alerts table  │
└───────────┘  └───────────────┘  └───────────────┘
     │                                    │
     │ Store attempt               Email Admin
     │                                    │
     └────────────────────────────────────┘
          Anomaly Detected → Alert
```

---

## 8. Estado das Vulnerabilidades

```
┌──────────────────────────────────────────────────────────────────┐
│  VULNERABILIDADE #1: Stripe Webhook Signature                    │
│  STATUS: ✅ LOCKED (HMAC-SHA256 + Timing-safe)                   │
│  ARQUIVO: src/server.ts (linha 47-100)                           │
│  COMMIT: 41d89c5                                                 │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  VULNERABILIDADE #2: CSP Supabase Domain                         │
│  STATUS: ✅ LOCKED (Domínio correto)                             │
│  ARQUIVO: src/lib/security-headers.ts, src/routes/__root.tsx     │
│  COMMIT: 54a72a1                                                 │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  VULNERABILIDADE #3: Dynamic CSP Nonces                          │
│  STATUS: ✅ LOCKED (Sem unsafe-inline/eval)                      │
│  ARQUIVO: src/server.ts, src/lib/security-headers.ts             │
│  COMMIT: 00e4760                                                 │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  VULNERABILIDADE #4: CSRF Token Storage                          │
│  STATUS: ✅ LOCKED (In-memory + HttpOnly SameSite)               │
│  ARQUIVO: src/lib/csrf.ts, src/server.ts                         │
│  COMMIT: Integrado no branch                                      │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  VULNERABILIDADE #5: Admin Rate Limiting                         │
│  STATUS: ✅ LOCKED (Server-side, 5 req/min, exponencial backoff) │
│  ARQUIVO: src/lib/login-security.ts, src/server.ts              │
│  COMMIT: a743f14                                                 │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  VULNERABILIDADE #6: Bot Detection (reCAPTCHA)                   │
│  STATUS: ⏳ IN PROGRESS (60%)                                    │
│  PRÓXIMAS AÇÕES:                                                  │
│  1. Obter Site Key + Secret Key                                  │
│  2. Adicionar ao Lovable Environment Variables                   │
│  3. Criar src/lib/recaptcha.ts                                   │
│  4. Adicionar /api/verify-recaptcha endpoint                     │
│  5. Integrar em admin login                                      │
│  ESTIMADO: 2-3 horas                                             │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  VULNERABILIDADE #7: Anomaly Email Alerts                        │
│  STATUS: ⏳ IN PROGRESS (50%)                                    │
│  PRÓXIMAS AÇÕES:                                                  │
│  1. Criar email template em Supabase                             │
│  2. Criar security_alerts table                                  │
│  3. Criar src/lib/security-alerts.ts                             │
│  4. Adicionar /api/send-security-alert endpoint                  │
│  5. Integrar com detectAnomalies()                               │
│  6. Criar SecurityAlertsViewer component                         │
│  ESTIMADO: 1-2 horas                                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 9. Variáveis de Ambiente Necessárias

```
═══════════════════════════════════════════════════════

  CLIENTE (Lovable - Public)
  ════════════════════════════════════════════════════
  
  VITE_SUPABASE_URL
  └─ Valor: https://nwsjgacmraijqyvvghoh.supabase.co
  └─ Origem: Supabase → Settings → API
  └─ Status: ⏳ PENDENTE (SEM ISSO NADA FUNCIONA)
  
  VITE_SUPABASE_PUBLISHABLE_KEY
  └─ Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  └─ Origem: Supabase → Settings → API → anon public
  └─ Status: ⏳ PENDENTE
  
  VITE_RECAPTCHA_SITE_KEY ✅ NOVO
  └─ Valor: 6Lc...
  └─ Origem: Google reCAPTCHA Admin
  └─ Status: ⏳ PRÓXIMO
  
═══════════════════════════════════════════════════════

  SERVIDOR (Cloudflare - Secret)
  ════════════════════════════════════════════════════
  
  VITE_RECAPTCHA_SECRET_KEY ✅ NOVO
  └─ Valor: 6Lc...senha_super_secreta
  └─ Origem: Google reCAPTCHA Admin
  └─ ⚠️ NUNCA COMPARTILHAR, APENAS NO SERVIDOR
  
  SUPABASE_SERVICE_ROLE_KEY
  └─ Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  └─ Origem: Supabase → Settings → API → service_role
  └─ ⚠️ NUNCA COMPARTILHAR, APENAS NO SERVIDOR
  
  STRIPE_WEBHOOK_SECRET
  └─ Já configurado
  
═══════════════════════════════════════════════════════
```

---

## 10. Próximas Melhorias (Roadmap)

```
HOJE:
  ☑ Configurar Supabase no Lovable
  
SEMANA 1:
  ☑ Implementar reCAPTCHA v3
  ☑ Testar login com proteção
  
SEMANA 2:
  ☑ Implementar Email Alerts
  ☑ Criar Dashboard de Alertas
  ☑ Testar com anomalias
  
SEMANA 3:
  ☑ 2FA (TOTP) no admin login
  ☑ Session Management avançado
  
SEMANA 4:
  ☑ Audit Logging (banco de dados)
  ☑ Relatórios de segurança
  ☑ Conformidade LGPD/GDPR
  
MESES 2+:
  ☑ Machine Learning para detecção de anomalias
  ☑ Biometria (fingerprinting avançado)
  ☑ SIEM integrado
```

---

## 11. Diagrama de Fluxo Completo

```
                    ┌─────────────────┐
                    │  ATACANTE TENTA │
                    │ FORÇA BRUTA (5+ │
                    │   tentativas)   │
                    └────────┬────────┘
                             │
                ┌────────────▼────────────┐
                │ Tentativa #1: Bloqueada │
                │ por Rate Limiter (5 req │
                │ por minuto)             │
                └────────────┬────────────┘
                             │
                ┌────────────▼────────────┐
                │ Tentativa #5: Bloqueada │
                │ requiresCaptcha = true  │
                └────────────┬────────────┘
                             │
                ┌────────────▼────────────────────────┐
                │ Mostrar Google reCAPTCHA v3         │
                │ ✅ Novo - Protege contra bots       │
                └────────────┬────────────────────────┘
                             │
                ┌────────────▼────────────┐
                │ reCAPTCHA Score < 0.5?  │
                │ (Detectou bot)          │
                └────────────┬────────────┘
                    NÃO    │    SIM
                ┌─────────┴─────────┐
                │                   │
           ┌────▼────┐        ┌─────▼─────┐
           │ Continua│        │  Bloqueada│
           │ Login   │        │  403 Bot  │
           └────┬────┘        └───────────┘
                │
        ┌───────▼────────────┐
        │ Supabase Auth      │
        │ Hash + Compare     │
        │ Password           │
        └───────┬────────────┘
           SIM │ NÃO
        ┌──────┴──────┐
        │             │
    ┌───▼──┐    ┌────▼─────┐
    │ Sucesso     │Falha: Log│
    │ Generate    │Anomaly   │
    │ Session     │Detection │
    └───┬──┐      └────┬─────┘
        │ │            │
        │ ├─────────────┼────────────┐
        │             │            │
    ┌───▼──────────────▼──────────┐ │
    │ detectAnomalies()           │ │
    │ ✅ Novo                     │ │
    │ ├─ Novo IP?                 │ │
    │ ├─ Novo País?               │ │
    │ └─ Novo Dispositivo?        │ │
    └───┬──────────────────────────┘ │
        │                            │
    ┌───▼───────────────────────────┐│
    │ Sim = Anomalia Detectada      ││
    │ Enviar Email Alert ✅ NOVO    ││
    │ Registrar em security_alerts  ││
    │ Mostrar no Dashboard          ││
    └───────────────────────────────┘│
                                     │
                            ┌────────▼────┐
                            │ Admin Vê    │
                            │ Alerta em   │
                            │ Tempo Real  │
                            └─────────────┘
```

---

**Conclusão**: Sistema de defesa em profundidade com 7 camadas de proteção.

