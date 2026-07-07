# 🎯 Orquestrador de Automação - TopDJ Security

**Sistema automático completo para implementar todas as vulnerabilidades em sequência**

---

## Visão Geral

Este guia organiza **3 fases de automação** em sequência:

```
FASE 1: Setup Básico
├─ Criar .env.local
├─ npm install
└─ npm run build

FASE 2: reCAPTCHA v3
├─ Criar src/lib/recaptcha.ts
├─ Adicionar endpoint /api/verify-recaptcha
├─ Integrar em admin.tsx
└─ Testar

FASE 3: Email Alerts
├─ Criar tabela Supabase
├─ Criar email template
├─ Criar src/lib/security-alerts.ts
├─ Adicionar endpoint /api/send-security-alert
├─ Integrar em login-security.ts
└─ Testar
```

---

## ⏱️ Cronograma

```
HOJE (30 min - Setup):
  └─ Execute: auto-setup.ps1 (Windows) ou bash auto-setup.sh (Linux/Mac)

AMANHÃ (3 horas - reCAPTCHA):
  ├─ npx ts-node auto-implement-recaptcha.ts
  ├─ Copiar código em 2 arquivos
  ├─ npm run build
  └─ Testar

PRÓXIMA SEMANA (2 horas - Email):
  ├─ npx ts-node auto-implement-email-alerts.ts
  ├─ Executar SQL em Supabase
  ├─ Criar template de email
  ├─ Copiar código em 2 arquivos
  ├─ npm run build
  └─ Testar
```

---

## FASE 1: Setup Básico (HOJE - 30 min)

### Passo 1.1: Executar script de setup

**Windows (PowerShell)**:
```powershell
.\auto-setup.ps1
```

**Windows (CMD/Batch)**:
```cmd
auto-setup.bat
```

**Linux/Mac**:
```bash
bash auto-setup.sh
```

### Resultado:
- ✅ `.env.local` criado com template
- ✅ `npm install` completo
- ✅ `npm run build` passou

### Passo 1.2: Editar .env.local

```
# Supabase (de https://app.supabase.com)
VITE_SUPABASE_URL=https://nwsjgacmraijqyvvghoh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SEU_ANON_KEY_AQUI

# Google reCAPTCHA (de https://www.google.com/recaptcha/admin)
VITE_RECAPTCHA_SITE_KEY=SEU_SITE_KEY_AQUI
VITE_RECAPTCHA_SECRET_KEY=SEU_SECRET_KEY_AQUI
```

### Passo 1.3: Adicionar ao Lovable

Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_RECAPTCHA_SITE_KEY`

### Passo 1.4: Testar

```bash
npm run dev
# Abra http://localhost:5173/loja
# Deve carregar sem erro "No API key found"
```

---

## FASE 2: reCAPTCHA v3 (AMANHÃ - 3 horas)

### Passo 2.1: Executar automação de reCAPTCHA

```bash
npx ts-node auto-implement-recaptcha.ts
```

**O script cria**:
- ✅ `src/lib/recaptcha.ts` (pronto para usar)
- 📝 `SERVER_ENDPOINT_RECAPTCHA.txt` (instruções)
- 📝 `ADMIN_INTEGRATION_RECAPTCHA.txt` (instruções)
- ✅ `CHECKLIST_RECAPTCHA.md` (checklist)

### Passo 2.2: Implementar no servidor

Abra `SERVER_ENDPOINT_RECAPTCHA.txt` e copie o código.

Abra `src/server.ts` e:
1. Procure por `if (url.pathname === "/api/webhook"...` 
2. **ANTES** disso, adicione o código do reCAPTCHA

### Passo 2.3: Implementar no admin

Abra `ADMIN_INTEGRATION_RECAPTCHA.txt` e copie o código.

Abra `src/routes/admin.tsx` e:
1. Procure pela função `handleLogin()`
2. **APÓS** `const rateCheckEmail = checkRateLimit...`, adicione o código

### Passo 2.4: Testar

```bash
npm run build
npm run dev

# Faça 3 logins falhados
# Na 4ª tentativa, deve aparecer reCAPTCHA
# Passa no reCAPTCHA, login deve ser bloqueado
```

### Passo 2.5: Commit

```bash
git add .
git commit -m "feat: implement Google reCAPTCHA v3"
git push
```

---

## FASE 3: Email Alerts (PRÓXIMA SEMANA - 2 horas)

### Passo 3.1: Executar automação de Email

```bash
npx ts-node auto-implement-email-alerts.ts
```

**O script cria**:
- ✅ `src/lib/security-alerts.ts` (pronto para usar)
- 📝 `SERVER_ENDPOINT_EMAIL_ALERTS.txt` (instruções)
- 📝 `LOGIN_SECURITY_INTEGRATION.txt` (instruções)
- 📝 `COMPONENT_SECURITY_ALERTS_VIEWER.tsx` (componente)
- 📝 `CREATE_SECURITY_ALERTS_TABLE.sql` (banco de dados)
- 📝 `EMAIL_TEMPLATE_SETUP.txt` (template Supabase)
- ✅ `CHECKLIST_EMAIL_ALERTS.md` (checklist)

### Passo 3.2: Setup Supabase

1. Abra `CREATE_SECURITY_ALERTS_TABLE.sql`
2. Vá em Supabase → SQL Editor
3. Cole e execute o SQL
4. Resultado: Tabela `security_alerts` criada

### Passo 3.3: Criar template de email

1. Abra `EMAIL_TEMPLATE_SETUP.txt`
2. Vá em Supabase → Settings → Email Templates
3. Clique "Create"
4. Nome: `anomalous_login_alert`
5. Assunto: `⚠️ Login Anômalo Detectado`
6. Cole o HTML do arquivo

### Passo 3.4: Copiar código - Servidor

Abra `SERVER_ENDPOINT_EMAIL_ALERTS.txt` e copie.

Abra `src/server.ts` e:
1. Procure por `if (url.pathname === "/api/verify-recaptcha"...`
2. **ANTES** disso, adicione o código do email

### Passo 3.5: Copiar código - Login Security

Abra `LOGIN_SECURITY_INTEGRATION.txt` e copie.

Abra `src/lib/login-security.ts` e:
1. Procure pela função `detectAnomalies()`
2. Procure por `if (anomalies.length > 0)`
3. **DENTRO** disso, adicione o código

### Passo 3.6: Adicionar componente

1. Crie novo arquivo: `src/components/SecurityAlertsViewer.tsx`
2. Copie conteúdo de `COMPONENT_SECURITY_ALERTS_VIEWER.tsx`
3. Salve

### Passo 3.7: Integrar no admin

Abra `src/routes/admin.tsx` e:
1. Adicione import: `import { SecurityAlertsViewer } from '@/components/SecurityAlertsViewer';`
2. Procure pelo componente `SecurityLogsViewer`
3. **ABAIXO** dele, adicione: `<SecurityAlertsViewer />`

### Passo 3.8: Testar

```bash
npm run build
npm run dev

# Fazer login com novo IP/País
# Deve receber email de alerta
# Dashboard deve mostrar alerta
```

### Passo 3.9: Commit

```bash
git add .
git commit -m "feat: implement email alerts for anomalous logins"
git push
```

---

## 🎯 Checklist Geral

### FASE 1 (Hoje)
- [ ] Execute `auto-setup.ps1` ou similar
- [ ] Edite `.env.local` com chaves
- [ ] Adicione ao Lovable Settings
- [ ] Teste `/loja` carrega

### FASE 2 (Amanhã)
- [ ] Execute `auto-implement-recaptcha.ts`
- [ ] Copie código em `src/server.ts`
- [ ] Copie código em `src/routes/admin.tsx`
- [ ] `npm run build` passou
- [ ] Teste 3 logins falhados
- [ ] 4ª tentativa mostra reCAPTCHA
- [ ] Commit e push

### FASE 3 (Próxima semana)
- [ ] Execute `auto-implement-email-alerts.ts`
- [ ] Executar SQL em Supabase
- [ ] Criar email template
- [ ] Copie código em `src/server.ts`
- [ ] Copie código em `src/lib/login-security.ts`
- [ ] Crie componente SecurityAlertsViewer
- [ ] Integre em `src/routes/admin.tsx`
- [ ] `npm run build` passou
- [ ] Teste login com novo IP
- [ ] Verificar email recebido
- [ ] Commit e push

---

## 📊 Progresso

```
ANTES:
  ██░░░░░░░░ 20% (Fase 1 não iniciada)

APÓS FASE 1:
  ████░░░░░░ 40% (Setup completo)

APÓS FASE 2:
  ██████░░░░ 60% (reCAPTCHA implementado)

APÓS FASE 3:
  ██████████ 100% (Tudo completo!)
```

---

## 🚀 Comandos Rápidos

```bash
# FASE 1
.\auto-setup.ps1

# FASE 2
npx ts-node auto-implement-recaptcha.ts
npm run build

# FASE 3
npx ts-node auto-implement-email-alerts.ts
npm run build

# Geral
npm run dev              # Dev server
npm run build            # Build prod
npm run lint             # Lint code
npm run test             # Tests (if available)
git status               # Ver mudanças
git add .                # Add tudo
git commit -m "msg"      # Commit
git push                 # Push
```

---

## ⚠️ Se Der Erro

### Erro: "npm não encontrado"
```
→ Instale Node.js: https://nodejs.org/
→ Reinicie computador
→ Execute novamente
```

### Erro: "Permission denied"
```
# PowerShell:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Depois tente novamente
.\auto-setup.ps1
```

### Erro: "npm install falhou"
```
→ Delete node_modules
→ Delete package-lock.json
→ Execute novamente: npm install
```

### Erro: "Build falhou"
```
→ Verifique console para erro
→ Procure erro na lista acima
→ Se persistir, execute: npm run build (manual)
```

### Erro: "Chave reCAPTCHA não funciona"
```
→ Verificar em Google reCAPTCHA Admin que chave está correta
→ Verificar que está em .env.local E no Lovable Settings
→ Limpar cache do navegador
→ Reiniciar npm run dev
```

---

## 📚 Documentos de Referência

```
├─ COMO_CONTINUAR.md              (O que fazer)
├─ CONFIGURAR_LOVABLE_SUPABASE.md  (Setup Supabase)
├─ PROXIMOS_PASSOS_SEGURANCA.md    (Detalhes técnicos)
├─ AUTOMACAO_SETUP.md              (Automação detalhada)
├─ ORQUESTRADOR_AUTOMACAO.md       (Este arquivo)
├─ ARQUITETURA_SEGURANCA.md        (Como tudo funciona)
└─ INDICE_SEGURANCA.md             (Índice completo)
```

---

## 🎓 O que você Aprenderá

✅ Como automatizar setup de projeto  
✅ Como usar scripts para gerar código  
✅ Como integrar reCAPTCHA v3  
✅ Como implementar alertas de email  
✅ Como trabalhar com Supabase  
✅ Como usar GitHub + Lovable  

---

**Total de Automação**: 100%  
**Tempo Total**: ~5-6 horas (distribuído)  
**Resultado**: Sistema de segurança completo!

