# 🔧 Como Corrigir Erro 404 no Lovable

## O Que Fazer AGORA (3 minutos)

### Passo 1: Clear Cache do Lovable

No seu navegador, acesse o Lovable e:

1. Pressione: **Ctrl + Shift + Delete**
2. Selecione: **"All time"**
3. Marque: **"Cookies and other site data"** + **"Cached images and files"**
4. Clique: **"Clear data"**

### Passo 2: Hard Reload

Pressione: **Ctrl + Shift + R** (Windows) ou **Cmd + Shift + R** (Mac)

### Passo 3: Aguarde 10 segundos

O Lovable vai reconectar e fazer rebuild.

---

## Se AINDA Não Funcionar

### Passo 4: Verificar Environment Variables

1. Abra seu projeto no Lovable
2. **⚙️ Settings** → **Environment Variables**
3. Procure por: `VITE_SUPABASE_PUBLISHABLE_KEY`

**Deve estar assim:**

```
Nome: VITE_SUPABASE_PUBLISHABLE_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjem5hb3phb3NjaWlmZnFuY2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MTA5NjksImV4cCI6MjA5ODE4Njk2OX0.G3daYi6_LqZ2hWE8qT_pWtWZDFfnBnqd71af2V2idc8
Status: ✅ Active
```

Se estiver faltando ou errado = **Adicione novamente**

### Passo 5: Reconnect do Lovable

1. Clique no menu do Lovable (canto superior esquerdo)
2. Procure por "Reconnect" ou "Redeploy"
3. Clique

Aguarde o deploy finalizar.

---

## Se AINDA Não Funcionar

### Passo 6: Verificar o Console

1. F12 → **Console** tab
2. Procure por mensagens de erro em **vermelho**
3. Anote exatamente o que diz

**Exemplos de erros comuns:**

```
❌ TypeError: Cannot read property 'supabase' of undefined
→ Falta variável de ambiente

❌ SyntaxError: Unexpected token
→ Erro no código JavaScript

❌ Failed to load module from XXX
→ Arquivo faltando ou caminho errado
```

---

## Se CONTINUAR Não Funcionando

### Nuclear Option: Force Rebuild

1. Abra seu projeto no Lovable
2. **⚙️ Settings** → **Advanced** (se existir)
3. Procure por: **"Force rebuild"** ou **"Clear cache"**
4. Clique

Se não existir essa opção:

1. Faça uma pequena mudança em qualquer arquivo (ex: adicione espaço em branco)
2. Commit
3. Push para a branch
4. Lovable vai fazer rebuild automático

---

## Status Esperado Depois de Funcionar

- ✅ Homepage (`/`) carrega
- ✅ Loja (`/loja`) carrega com packs
- ✅ Admin (`/admin`) carrega com login
- ✅ Console (F12) sem erros vermelhos

---

## Checklist Final

- [ ] Clear cache (Ctrl+Shift+Delete)
- [ ] Hard reload (Ctrl+Shift+R)
- [ ] Esperou 10 segundos
- [ ] Verificou Environment Variables
- [ ] Não há erros no Console
- [ ] Página carrega normalmente

---

**Próximo Passo:** Execute esses passos e me diga:
- ✅ Agora funciona!
- ❌ Ainda não funciona (e compartilhe o erro do console)

