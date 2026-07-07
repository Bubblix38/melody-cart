# 🚀 Como Continuar - TopDJ Segurança

**Você está aqui**: 5 de 7 vulnerabilidades de segurança bloqueadas

---

## O Que Já Foi Feito ✅

```
1. ✅ Assinatura Webhook Stripe (HMAC-SHA256)
2. ✅ CSP Correto (domínio Supabase)
3. ✅ Nonces Dinâmicos (sem unsafe-inline)
4. ✅ CSRF Token (in-memory + HttpOnly)
5. ✅ Rate Limiting Server-Side (5 tentativas/minuto)
6. ⏳ Google reCAPTCHA v3 (FALTA)
7. ⏳ Email Alerts para Anomalias (FALTA)
```

---

## O Que Você Precisa Fazer Agora

### 1️⃣ Configurar Supabase no Lovable (URGENTE)

**Por quê?** Sem isso, `/loja` não carrega.

**Tempo**: 5 minutos

**Passos**:

1. Abra **Supabase** → https://app.supabase.com/
2. Selecione projeto `nwsjgacmraijqyvvghoh` (melody-cart)
3. **Settings** → **API**
4. Copie 2 valores:
   - `Project URL`
   - `anon public` (em "API Tokens")

5. Abra **Lovable** → seu projeto
6. **⚙️ Settings** → **Environment Variables**
7. Adicione:
   ```
   VITE_SUPABASE_URL=https://nwsjgacmraijqyvvghoh.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

8. F5 (recarregar Lovable)
9. Teste `/loja` → deve carregar packs sem erro

**ℹ️ Detalhes**: Ver `CONFIGURAR_LOVABLE_SUPABASE.md`

---

### 2️⃣ Implementar Google reCAPTCHA v3 (HOJE/AMANHÃ)

**Por quê?** Protege admin contra bots.

**Tempo**: 2-3 horas

**Passos**:

1. Abra **Google reCAPTCHA** → https://www.google.com/recaptcha/admin
2. Clique **Create**
3. Configure:
   - Label: `TopDJ Login`
   - Type: `reCAPTCHA v3`
   - Domains: `seu-domain.lovable.app`, `localhost`
4. Copie:
   - **SITE KEY**
   - **SECRET KEY**

5. Adicione ao Lovable (Environment Variables):
   ```
   VITE_RECAPTCHA_SITE_KEY=6Lc...
   VITE_RECAPTCHA_SECRET_KEY=6Lc...
   ```

6. Implemente código:
   - Criar `src/lib/recaptcha.ts`
   - Adicionar endpoint `/api/verify-recaptcha` em `src/server.ts`
   - Integrar em `src/routes/admin.tsx` no `handleLogin()`

7. Teste:
   - Faça 3 logins falhados
   - Deve aparecer proteção reCAPTCHA
   - 4º login deve ser bloqueado até passar

**ℹ️ Detalhes**: Ver `PROXIMOS_PASSOS_SEGURANCA.md` seção "PASSO 1"

---

### 3️⃣ Email Alerts para Anomalias (SEMANA QUE VEM)

**Por quê?** Detecta logins suspeitos automaticamente.

**Tempo**: 1-2 horas

**Passos**:

1. Supabase → **Email Templates** → Criar novo
2. Nome: `anomalous_login_alert`
3. Assunto: `⚠️ Login Anômalo Detectado`
4. HTML: (ver template em `PROXIMOS_PASSOS_SEGURANCA.md`)

5. Supabase → **SQL Editor** → Criar tabela:
   ```sql
   CREATE TABLE security_alerts (...)
   ```

6. Código:
   - Criar `src/lib/security-alerts.ts`
   - Adicionar endpoint `/api/send-security-alert` em `src/server.ts`
   - Modificar `src/lib/login-security.ts` para enviar alertas
   - Criar `src/components/SecurityAlertsViewer.tsx`
   - Adicionar viewer no admin

7. Teste:
   - Faça login com nova localização
   - Deve receber e-mail de alerta

**ℹ️ Detalhes**: Ver `PROXIMOS_PASSOS_SEGURANCA.md` seção "PASSO 2"

---

## Cronograma Sugerido

```
HOJE (6 de Julho):
  ☐ Configurar Supabase no Lovable (5 min)
  ☐ Testar /loja carrega
  
HOJE OU AMANHÃ (7 de Julho):
  ☐ Obter chaves Google reCAPTCHA (10 min)
  ☐ Adicionar ao Lovable (5 min)
  ☐ Implementar reCAPTCHA v3 (2-3 horas)
  ☐ Testar login com reCAPTCHA
  ☐ Commit

SEMANA (8-12 de Julho):
  ☐ Implementar Email Alerts (1-2 horas)
  ☐ Testar com login de novo IP
  ☐ Criar dashboard de alertas
  ☐ Commit
```

---

## Checklist Hoje (CRÍTICO)

- [ ] Supabase URL no Lovable
- [ ] Supabase Key no Lovable
- [ ] `/loja` carrega sem erro
- [ ] `/admin` abre sem erro

**Sem isso**, NADA funciona. Isso é BLOQUEADOR.

---

## Checklist Amanhã (IMPORTANTE)

- [ ] Google reCAPTCHA chaves obtidas
- [ ] Adicionadas ao Lovable
- [ ] `src/lib/recaptcha.ts` criado
- [ ] `/api/verify-recaptcha` funciona
- [ ] Login admin com reCAPTCHA
- [ ] Build passa
- [ ] Commit feito

---

## Verificação Rápida

Abra console do navegador (F12) e rode:

```javascript
// Verificar se Supabase está carregando
console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL)

// Verificar se reCAPTCHA está pronto
console.log("reCAPTCHA Site Key:", import.meta.env.VITE_RECAPTCHA_SITE_KEY)
```

Se mostrar valores → Configurado ✅
Se mostrar `undefined` → Falta configurar ❌

---

## Arquivos de Referência

Já criados para você:

- `CONFIGURAR_LOVABLE_SUPABASE.md` - Setup Supabase (HOJE)
- `PROXIMOS_PASSOS_SEGURANCA.md` - Guia completo (referência)
- `SECURITY-AUDIT-STATUS.md` - Status detalhado
- `ANALISE_SEGURANCA_ACESSO_ADMIN.md` - Por que é importante
- `ANALISE_SQL_INJECTION.md` - Site está seguro contra SQL injection

---

## Comandos Úteis

Depois de implementar código:

```bash
# Build
npm run build

# Teste (se tiver)
npm run test

# Dev local
npm run dev
```

---

## Dúvidas Frequentes

**P: Preciso fazer tudo hoje?**
R: Não. Hoje é CRÍTICO apenas Supabase. reCAPTCHA é importante, email é desejável.

**P: E se reCAPTCHA der erro?**
R: Veja console (F12), procure por erros. Verifique se SITE_KEY está correto.

**P: Posso deployar sem reCAPTCHA?**
R: Sim, mas admin fica vulnerável a força bruta. Recomendo fazer logo.

**P: Email não funciona?**
R: Supabase precisa de SMTP configurado. Veja docs Supabase.

---

## Status Segurança Atual

```
Risco: 🟡 MÉDIO (admin sem reCAPTCHA)

Depois de reCAPTCHA:
Risco: 🟢 ALTO (muito seguro)

Depois de Email Alerts:
Risco: 🟢 MUITO ALTO (máxima proteção)
```

---

## Próximo Passo: AGORA

👉 **Abra `CONFIGURAR_LOVABLE_SUPABASE.md` e configure Supabase no Lovable**

Isso é BLOQUEADOR. Sem isso, nada funciona.

---

**Data**: 6 de Julho de 2026
**Repositório**: `fix/duplicate-url-declarations`
**Próximo Commit**: `feat: add Google reCAPTCHA v3`

