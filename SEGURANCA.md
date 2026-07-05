# Documentação de Segurança - TopDJ

## 📋 Correções Implementadas

### ✅ Vulnerabilidades Corrigidas

#### 1. Validação de Dados com Zod (Crítica)

- **Arquivo:** `src/lib/packs.ts`
- **Implementação:** Schema de validação completo para todos os campos
- **Proteção:** Previne SQL Injection, XSS e dados inválidos
- **Validações:**
  - Nome: obrigatório, máximo 200 caracteres
  - Gênero: enum restrito aos valores permitidos
  - Preço: positivo, múltiplo de 0.01
  - Descrição: máximo 1000 caracteres
  - URL: formato válido de URL

#### 2. Ocultação de Erros em Produção (Crítica)

- **Arquivos:** `src/routes/index.tsx`, `src/routes/loja.tsx`
- **Implementação:** Mensagens genéricas em produção, detalhes apenas em DEV
- **Proteção:** Não expõe stack traces, estrutura do banco ou caminhos

#### 3. Validação de Preço Mínimo (Média)

- **Arquivo:** `src/routes/admin.tsx`
- **Implementação:** `min="0.01"` no input
- **Proteção:** Previne preços zero ou negativos

#### 4. Criptografia de Dados no LocalStorage (Média)

- **Arquivos:** `src/lib/secure-storage.ts`, `src/lib/cart.tsx`
- **Implementação:** AES-GCM com PBKDF2 (100k iterações)
- **Proteção:** Dados do carrinho criptografados no navegador
- **Algoritmo:** AES-256-GCM com salt aleatório por operação

#### 5. Proteção CSRF (Grave)

- **Arquivos:** `src/lib/csrf.ts`, `src/routes/admin.tsx`
- **Implementação:** Token CSRF em formulários com validação
- **Proteção:** Previne ataques Cross-Site Request Forgery
- **Armazenamento:** sessionStorage (expira ao fechar navegador)

#### 6. Validação de URL de Imagem (Grave)

- **Arquivo:** `src/routes/admin.tsx`
- **Implementação:** Campo `type="url"` + validação Zod
- **Proteção:** Previne XSS via `javascript:` URLs

#### 7. Proteção Contra Manipulação de Preços (Crítica)

- **Arquivos:** `src/lib/price-protection.ts` (novo), `src/lib/cart.tsx`, `src/components/CheckoutValidation.tsx` (novo)
- **Implementação:**
  - Validação de preços contra banco de dados antes do checkout
  - Atualização automática de preços ao carregar carrinho
  - Componente de alerta para manipulação detectada
  - Hook `usePriceProtection` para monitoramento
- **Proteção:** Impede que usuários alterem preços via DevTools/localStorage
- **Mecanismo:**
  - Ao carregar o carrinho, busca preços atuais do Supabase
  - No checkout, valida todos os preços novamente
  - Exibe alerta se detectar manipulação
  - Usa sempre o preço do banco para calcular total

#### 8. Proteção Contra Burp Suite e Ferramentas de Scanning (Crítica)

- **Arquivos:** `src/lib/security-headers.ts` (novo), `src/lib/server-security.ts` (novo), `src/server.ts`
- **Implementação:**
  - Detecção de 30+ ferramentas de scanning (Burp Suite, OWASP ZAP, Nmap, SQLMap, etc.)
  - Headers de segurança HTTP (CSP, HSTS, X-Frame-Options, etc.)
  - Validação de headers suspeitos (x-burp-, x-scanner, etc.)
  - Detecção de padrões de ataque (SQL Injection, XSS, Path Traversal, Command Injection, SSRF)
  - Sistema de logging de segurança
  - Rate limiting (100 req/min por IP)
  - Bloqueio automático de IPs suspeitos
- **Proteção:** Bloqueia ferramentas de teste de penetração e detecta ataques
- **Ferramentas Bloqueadas:**
  - Burp Suite (todas as versões)
  - OWASP ZAP
  - Nmap, Nikto, SQLMap
  - DirBuster, Gobuster, WFuzz
  - Hydra, Medusa
  - WPScan, JoomScan
  - Acunetix, Nessus, OpenVAS
  - E mais 15 ferramentas

---

## ⚠️ Vulnerabilidades que Requerem Ação Manual

### 🔴 CRÍTICAS - Ação Imediata Necessária

#### 1. Credenciais Supabase Expostas

**Status:** NÃO CORRIGIDO  
**Arquivo:** `.env`  
**Ação Necessária:**

```bash
# 1. Acesse o painel do Supabase: https://supabase.com/dashboard
# 2. Vá em Settings > API
# 3. Clique em "Rotate publishable key" ou crie uma nova chave
# 4. Atualize o arquivo .env com a nova chave
# 5. NUNCA comite o arquivo .env (já está no .gitignore ✅)
```

**Nova Chave:** Deve ser obtida em: https://supabase.com/dashboard/project/nwsjgacmraijqyvvghoh/settings/api

#### 2. Políticas RLS Excessivamente Permissivas

**Status:** NÃO CORRIGIDO  
**Arquivo:** `supabase/migrations/20260628063625_b2793862-3b8d-44c3-9f25-d3cb06acefed.sql`  
**Ação Necessária:**

Execute no SQL Editor do Supabase:

```sql
-- Remover políticas antigas
DROP POLICY IF EXISTS "Qualquer um pode ver os packs" ON public.packs;
DROP POLICY IF EXISTS "Qualquer um pode criar packs" ON public.packs;
DROP POLICY IF EXISTS "Qualquer um pode editar packs" ON public.packs;
DROP POLICY IF EXISTS "Qualquer um pode excluir packs" ON public.packs;

-- Criar novas políticas seguras
-- Qualquer um pode VER os packs (público)
CREATE POLICY "Público pode ver packs" ON public.packs
  FOR SELECT USING (true);

-- Apenas usuários autenticados podem CRIAR packs
CREATE POLICY "Apenas autenticados podem criar packs" ON public.packs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem EDITAR packs
CREATE POLICY "Apenas autenticados podem editar packs" ON public.packs
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem EXCLUIR packs
CREATE POLICY "Apenas autenticados podem excluir packs" ON public.packs
  FOR DELETE USING (auth.role() = 'authenticated');
```

**Nota:** Para maior segurança, implemente verificação de roles de admin:

```sql
-- Opcional: Apenas admins podem modificar
-- Primeiro, crie uma tabela de roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Depois, use esta política (mais restritiva)
CREATE POLICY "Apenas admins podem modificar packs" ON public.packs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

#### 3. Autenticação no /admin

**Status:** NÃO IMPLEMENTADA  
**Arquivo:** `src/routes/admin.tsx`  
**Ação Necessária:**

Implementar autenticação com Supabase Auth:

```typescript
// 1. Instalar dependência (se necessário)
// npm install @supabase/auth-ui-react @supabase/auth-ui-shared

// 2. Criar página de login (src/routes/login.tsx)
// 3. Adicionar loader com verificação de auth no admin:

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ context }) => {
    const {
      data: { session },
    } = await context.supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    // Opcional: verificar se é admin
    // const { data } = await context.supabase
    //   .from('user_roles')
    //   .select('role')
    //   .eq('user_id', session.user.id)
    //   .single();
    // if (data?.role !== 'admin') {
    //   throw redirect({ to: '/' });
    // }
  },
  head: () => ({/* ... */}),
  component: Admin,
});
```

---

### 🟠 GRAVES - Ação Urgente Necessária

#### 4. Sanitização de URLs de Imagem

**Status:** PARCIALMENTE CORRIGIDO  
**Implementado:** Campo `type="url"` + validação Zod  
**Recomendação Adicional:**

Adicione allowlist de domínios permitidos:

```typescript
// Em src/lib/packs.ts
const ALLOWED_IMAGE_DOMAINS = [
  "supabase.co",
  "amazonaws.com",
  "cloudinary.com",
  "imgur.com",
  // Adicione seus domínios permitidos
];

function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_IMAGE_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

// Atualize o schema
const PackSchema = z.object({
  // ... outros campos
  imagem_url: z
    .string()
    .url("URL inválida")
    .refine((url) => isValidImageUrl(url), "Domínio de imagem não permitido")
    .nullable()
    .optional()
    .or(z.literal("")),
});
```

---

### 🟡 MÉDIAS - Planejamento Recomendado

#### 5. Rate Limiting

**Status:** NÃO IMPLEMENTADO  
**Recomendação:**

Use Supabase Edge Functions com rate limiting:

```typescript
// Em supabase/functions/rate-limit/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const rateLimits = new Map<string, { count: number; resetAt: number }>();

serve(async (req) => {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();

  const limit = rateLimits.get(ip) || { count: 0, resetAt: now + 60000 };

  if (now > limit.resetAt) {
    limit.count = 0;
    limit.resetAt = now + 60000;
  }

  limit.count++;

  if (limit.count > 100) {
    // 100 requisições por minuto
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  rateLimits.set(ip, limit);

  return new Response(JSON.stringify({ success: true }));
});
```

---

## 🔧 Configurações de Segurança Adicionais

### Content Security Policy (CSP)

Adicione ao `src/routes/__root.tsx`:

```typescript
head: () => ({
  meta: [
    // ... meta existentes
    {
      "http-equiv": "Content-Security-Policy",
      content:
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://nwsjgacmraijqyvvghoh.supabase.co;",
    },
  ],
});
```

### HTTPS Obrigatório

Configure no Supabase:

1. Vá em Settings > API
2. Ative "Enforce HTTPS"
3. Configure HSTS headers

### Logging e Monitoramento

Adicione logging de ações administrativas:

```typescript
// Em src/lib/packs.ts
async function logAdminAction(action: string, packId: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const log = {
    action,
    pack_id: packId,
    user_id: session?.user?.id,
    timestamp: new Date().toISOString(),
    ip: "capturar-ip-aqui", // Implementar captura de IP
  };
  // Salvar em tabela de logs ou enviar para serviço de monitoramento
}
```

---

## 📊 Status Final das Correções

| Vulnerabilidade                                | Severidade | Status       |
| ---------------------------------------------- | ---------- | ------------ |
| Validação de Dados                             | 🔴 Crítica | ✅ CORRIGIDO |
| Erros em Produção                              | 🔴 Crítica | ✅ CORRIGIDO |
| Preço Mínimo                                   | 🟡 Média   | ✅ CORRIGIDO |
| Criptografia LocalStorage                      | 🟡 Média   | ✅ CORRIGIDO |
| CSRF Protection                                | 🟠 Grave   | ✅ CORRIGIDO |
| Validação de URL                               | 🟠 Grave   | ✅ CORRIGIDO |
| Credenciais Supabase                           | 🔴 Crítica | ⚠️ MANUAL    |
| Políticas RLS                                  | 🔴 Crítica | ✅ CORRIGIDO |
| Autenticação /admin                            | 🔴 Crítica | ✅ CORRIGIDO |
| Sanitização Avançada                           | 🟠 Grave   | ⚠️ MANUAL    |
| Rate Limiting                                  | 🟡 Média   | ✅ PARCIAL   |
| CSP `unsafe-eval`                              | 🟠 Grave   | ✅ CORRIGIDO |
| Security Check Fail-Open                       | 🟠 Grave   | ✅ CORRIGIDO |
| Price Protection Fail-Silent                   | 🟡 Média   | ✅ CORRIGIDO |
| Secure-Storage Fallback                        | 🟡 Média   | ✅ CORRIGIDO |
| Chave Cripto Previsível                        | 🟡 Média   | ✅ CORRIGIDO |
| Origin CSRF Server-Side                        | 🟠 Grave   | ✅ CORRIGIDO |
| Payment Amount Validation                      | 🔴 Crítica | ✅ CORRIGIDO |
| addComment sem auth                            | 🔴 Crítica | ✅ CORRIGIDO |
| Upload sem validação tipo/tamanho              | 🟠 Grave   | ✅ CORRIGIDO |
| RLS perfis/comentarios/curtidas/musicas_salvas | 🟠 Grave   | ✅ CORRIGIDO |
| Endpoint Stripe duplicado inseguro             | 🔴 Crítica | ✅ CORRIGIDO |

---

## 🚀 Próximos Passos

1. **Imediato (Hoje):**
   - [ ] Rotacionar chave Supabase (manual via painel Supabase)
   - [x] Executar SQL para corrigir RLS (já atualizado na migration)
   - [ ] Testar aplicação com novas políticas

2. **Esta Semana:**
   - [x] Implementar autenticação no /admin
   - [ ] Adicionar allowlist de domínios de imagem
   - [ ] Configurar CSP headers (parcial — ajustar nonce no lugar de unsafe-inline)

3. **Próximas 2 Semanas:**
   - [ ] Implementar rate limiting persistente (Redis/Upstash)
   - [ ] Adicionar logging de auditoria
   - [ ] Configurar monitoramento
   - [ ] Migrar `stripe.ts` obsoleto (substituído por API route)

---

## 📞 Suporte

Para dúvidas sobre as correções:

- Documentação Supabase: https://supabase.com/docs
- Segurança em React: https://react.dev/learn/escape-hatches
- OWASP Top 10: https://owasp.org/www-project-top-ten/

**Última atualização:** 28/06/2026  
**Próxima revisão:** 12/07/2026
