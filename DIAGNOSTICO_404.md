# 🔍 Diagnóstico do Erro 404 no Lovable

## Passos para Investigar

### 1️⃣ Abra o Lovable Preview
- URL do seu projeto Lovable

### 2️⃣ Abra o DevTools (F12)

### 3️⃣ Vá para a aba **Network**

### 4️⃣ Recarregue a página (Ctrl+R ou F5)

### 5️⃣ Procure pela requisição que retorna **404**

Pode ser:
- `/ (GET)` - Página principal
- `/loja` - Rota de loja
- `/admin` - Rota de admin
- Qualquer arquivo `.js`, `.css`, etc

### 6️⃣ Clique na requisição 404

Veja:
- **URL exata** que está falhando
- **Tipo** (document, script, stylesheet, etc)
- **Response** - o que o servidor retornou

---

## Possíveis Causas

### ❌ 1. Variáveis de Ambiente Não Carregadas
```javascript
// No Console (F12 → Console):
console.log({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
})
```

Se mostrar `undefined` = Falta configurar no Lovable Settings

### ❌ 2. Servidor Não Respondendo
Se a requisição para `/` retorna 404, o servidor pode estar:
- Fora do ar
- Com erro de inicialização
- Mal configurado

### ❌ 3. Rota Não Encontrada
Se é uma rota específica (`/loja`, `/admin`), verifique se existe em `src/routes/`

### ❌ 4. Build Desatualizado
```bash
npm run build
```

E depois redeploy no Lovable

---

## Se Continuar Errando

### Teste Local Primeiro
```bash
npm run build
npx vite preview
```

Acesse: `http://localhost:4173`

Se funcionar local mas não no Lovable = Problema de deploy/environment

### Se der erro local também
1. Verifique `.env.local` tem as chaves corretas
2. Rode `npm install` novamente
3. Verifique se há erros de build

---

## O que Me Enviar

1. **URL exata** que está dando 404
2. **Screenshot** do erro no Network tab
3. **Output do Console** (F12 → Console)
4. **Se está testando local ou no Lovable**

Com isso consigo diagnosticar melhor! 🔧

