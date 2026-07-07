# 🔑 ERRO: "No API key found in request" - Solução Lovable

## ❌ O ERRO

```json
{
  "message": "No API key found in request",
  "hint": "No `apikey` request header or url param was found."
}
```

Este erro significa: **Supabase não consegue autenticar porque faltam as chaves de API**.

---

## 🔍 POR QUE ACONTECE?

No seu código, você usa:

```typescript
// src/lib/packs.ts
import { supabase } from "@/integrations/supabase/client";

const { data } = await supabase
  .from("packs")
  .select("*");
```

Supabase precisa de **2 variáveis de ambiente**:
- `VITE_SUPABASE_URL` (URL do projeto)
- `VITE_SUPABASE_PUBLISHABLE_KEY` (Chave pública)

Se não tiver no Lovable, **não consegue conectar**.

---

## ✅ SOLUÇÃO: CONFIGURAR NO LOVABLE

### Passo 1: Obter as Chaves do Supabase

**URL do Supabase**: https://app.supabase.com/

1. Login com sua conta
2. Selecione projeto: `nwsjgacmraijqyvvghoh`
3. Vá para: **Settings** → **API**
4. Copie:
   - `Project URL` (será `VITE_SUPABASE_URL`)
   - `anon public` key (será `VITE_SUPABASE_PUBLISHABLE_KEY`)

**Exemplo de valores** (NUNCA compartilhe isso):
```
VITE_SUPABASE_URL=https://nwsjgacmraijqyvvghoh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Passo 2: Adicionar no Lovable

**Método 1: Via UI do Lovable** (Recomendado)

1. Abra seu projeto no Lovable
2. Clique no ícone de **⚙️ Settings** (canto superior direito)
3. Vá para **Environment Variables**
4. Clique **+ Add Variable**
5. Adicione cada uma:

```
Nome: VITE_SUPABASE_URL
Valor: https://nwsjgacmraijqyvvghoh.supabase.co
Escopo: Production & Preview
```

```
Nome: VITE_SUPABASE_PUBLISHABLE_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Escopo: Production & Preview
```

**Método 2: Via `.env.local` (Desenvolvimento Local)**

Se quiser testar localmente antes de colocar no Lovable:

Criar arquivo: `.env.local`
```
VITE_SUPABASE_URL=https://nwsjgacmraijqyvvghoh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Não commitar esse arquivo (já está no `.gitignore`):
```bash
git status
# .env.local não deve aparecer
```

---

## 🔐 VARIÁVEIS NECESSÁRIAS

### Essenciais (Para Supabase Funcionar)

| Variável | Valor | Onde Copiar |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://nwsjgacmraijqyvvghoh.supabase.co` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase → Settings → API → anon public |

### Opcionais (Para Recursos Extras)

| Variável | Para Quê | Status |
|---|---|---|
| `STRIPE_WEBHOOK_SECRET` | Webhook Stripe | ✅ Já configurado no código |
| `RECAPTCHA_SITE_KEY` | Google reCAPTCHA | ⏳ Próximo a implementar |
| `SENDGRID_API_KEY` | Email alerts | ⏳ Próximo a implementar |

---

## 📝 PASSO A PASSO VISUAL

### No Supabase (Obter Chaves)

```
1. Abra: https://app.supabase.com/
2. Login
3. Selecione projeto: "melody-cart" (nwsjgacmraijqyvvghoh)
4. Menu lateral → Settings → API
5. Copie "Project URL"
6. Copie "anon public" em "API Tokens"
```

### No Lovable (Configurar)

```
1. Abra seu projeto no Lovable
2. Canto superior direito → ⚙️ Settings
3. Menu lateral → Environment Variables
4. Clique: + Add Variable
5. Cole as 2 variáveis
6. Salve
7. Recarregue a página
```

---

## 🧪 COMO TESTAR

### Teste 1: Verificar Se Está Configurado

**No Lovable Console** (F12 → Console):
```javascript
// Se estiver configurado, isso vai funcionar
const url = process.env.VITE_SUPABASE_URL;
console.log("URL:", url);
// Deve mostrar: "URL: https://nwsjgacmraijqyvvghoh.supabase.co"
```

### Teste 2: Tentar Carregar Packs

1. Abra: `https://seu-lovable-preview.app/loja`
2. Deve carregar a lista de packs
3. Sem erro de "No API key found"

### Teste 3: Verificar Erro

Se ainda der erro:
```json
{
  "message": "No API key found in request"
}
```

Significa: Variáveis **não estão no Lovable** ainda.

---

## ⚠️ ERROS COMUNS

### Erro 1: "Invalid Request"
```json
{
  "message": "Invalid request"
}
```

**Causa**: Chave está errada ou expirou
**Solução**: Copiar novamente do Supabase

---

### Erro 2: "Unauthorized"
```json
{
  "message": "Unauthorized"
}
```

**Causa**: Usando `service_role` em vez de `anon public`
**Solução**: Usar a chave `anon public` (não `service_role`)

---

### Erro 3: Variáveis Aparecem em "Local" mas não em "Preview"

**Causa**: Configuradas apenas no `.env.local`, não no Lovable
**Solução**: Adicionar via Settings → Environment Variables no Lovable

---

## 🔒 SEGURANÇA

### ✅ Seguro Compartilhar

- ✅ `VITE_SUPABASE_URL` - URL pública (seguro)
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY` - Chave "anon" (seguro)

### ❌ NUNCA Compartilhar

- ❌ `SUPABASE_SERVICE_ROLE_KEY` - Chave privada (secret)
- ❌ Tokens JWT pessoais
- ❌ Chaves de banco de dados

**Por quê?** A chave `anon` só pode ler/escrever dados públicos. A chave `service_role` tem acesso total.

---

## 📊 CHECKLIST

- [ ] Abrir Supabase
- [ ] Copiar `VITE_SUPABASE_URL`
- [ ] Copiar `VITE_SUPABASE_PUBLISHABLE_KEY` (anon public)
- [ ] Abrir Lovable → Settings
- [ ] Adicionar 2 variáveis de ambiente
- [ ] Recarregar página no Lovable
- [ ] Testar: `/loja` deve carregar packs
- [ ] Testar: `/admin` deve carregar login
- [ ] Nenhum erro "No API key found"

---

## 🚀 DEPOIS DE CONFIGURAR

### Teste de Funcionalidade

1. **Homepage** - Deve carregar ✅
2. **Loja** - Deve listar packs ✅
3. **Admin Login** - Deve aparecer formulário ✅
4. **Rate Limiter** - Deve bloquear após 5 tentativas ✅

### Se Algo Quebrar

1. Verificar console (F12)
2. Ver se há erro relacionado a API
3. Confirmar que variáveis estão no Lovable
4. Limpar cache (Ctrl+Shift+Delete)
5. Recarregar página

---

## 📚 REFERÊNCIAS

- [Supabase API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Lovable Environment Variables](https://lovable.dev/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## 🎯 RESUMO

| Passo | O Quê | Onde |
|---|---|---|
| 1 | Copiar chaves | Supabase → Settings → API |
| 2 | Adicionar variáveis | Lovable → Settings → Environment Variables |
| 3 | Recarregar | F5 ou Ctrl+R |
| 4 | Testar | Abrir `/loja` |

**Tempo**: 5 minutos  
**Dificuldade**: Fácil  
**Impacto**: Crítico (sem isso, app não funciona)

---

## 💡 DICA: Verificar Se Está Funcionando

No seu navegador, vá para **DevTools** (F12) → **Console**:

```javascript
// Se tiver sucesso, deve aparecer a resposta
fetch('https://nwsjgacmraijqyvvghoh.supabase.co/rest/v1/packs?select=*', {
  headers: {
    'apikey': 'SUA_CHAVE_AQUI',
    'Authorization': 'Bearer SUA_CHAVE_AQUI'
  }
}).then(r => r.json()).then(console.log)
```

Se retornar lista de packs = ✅ Funcionando!

Se retornar `{"message":"No API key found"}` = ❌ Chave não configurada

---

**Status**: 🔴 ERRO (faltam variáveis)  
**Solução**: Configurar 2 variáveis no Lovable  
**Tempo**: 5 minutos  
**Criticidade**: CRÍTICA (app não funciona sem isso)
