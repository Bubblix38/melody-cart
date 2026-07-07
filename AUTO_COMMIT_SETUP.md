# 🤖 Auto-Commit e Auto-Push Setup

## O Que É?

Este script **monitora mudanças** em seus arquivos e **automaticamente**:
1. ✅ Faz `git add -A`
2. ✅ Faz `git commit` com mensagem de timestamp
3. ✅ Faz `git push` para o remoto

Assim que você salva um arquivo, o script detecta, agrupa mudanças, e faz push automático!

---

## 🚀 Como Usar

### Opção 1: Node.js Script (Recomendado - Windows/Mac/Linux)

```bash
npm run auto-commit
```

Isso vai:
- Monitorar todas as mudanças em tempo real
- Fazer commit automático a cada mudança
- Fazer push automático

Pressione **Ctrl+C** para parar.

---

### Opção 2: PowerShell Script (Windows Only)

```powershell
.\auto-commit-push.ps1
```

Mesmo comportamento que Opção 1.

---

## 📋 Fluxo de Trabalho

### Com Auto-Commit Ativado

1. **Abra 2 terminais**:
   - Terminal 1: `npm run dev` (desenvolvimento)
   - Terminal 2: `npm run auto-commit` (monitoramento)

2. **Edite arquivos normalmente** no seu editor

3. **Salve o arquivo** (Ctrl+S)

4. **Automático acontece**:
   ```
   📝 Detectado: src/routes/__root.tsx
   📝 Fazendo commit automático...
   ✅ Commit: auto: update 14:30:45
   🚀 Fazendo push automático...
   ✅ Push para origin/main
   ```

5. **Vercel vê o push** e faz deploy automaticamente

---

## ⚙️ Configuração

### Arquivos Ignorados

O script **ignora automaticamente**:
- `node_modules/`
- `.git/`
- `dist/`
- `.output/`
- `.env` e `.env.local`
- `package-lock.json`

### Débounce

O script aguarda **3 segundos** após a última mudança antes de fazer commit. Isso agrupa mudanças rápidas em um único commit.

### Mínimo Entre Commits

No máximo, faz um commit a cada **30 segundos**, mesmo que haja mudanças contínuas.

---

## 🔄 Fluxo Completo

```
Você edita arquivo
    ↓
Salva (Ctrl+S)
    ↓
Script detecta mudança
    ↓
Aguarda 3 segundos (agrupa mudanças)
    ↓
git add -A
    ↓
git commit -m "auto: update HH:MM:SS"
    ↓
git push origin main
    ↓
GitHub recebe push
    ↓
Vercel detecta push
    ↓
Vercel faz rebuild + deploy
    ↓
Site atualizado em https://melody-cart-5uzi.vercel.app/
```

---

## 📊 Exemplo Real

```bash
$ npm run auto-commit

🚀 Auto-Commit ativado!
📂 Monitorando mudanças em: C:\Users\Admin\Desktop\TODJ
Pressione Ctrl+C para parar

✅ Monitoramento ativo

[Você edita e salva um arquivo...]

📝 Detectado: src/lib/security-headers.ts
📝 Fazendo commit automático...
✅ Commit: auto: update 15:42:33
🚀 Fazendo push automático...
✅ Push para origin/main

[Aguarda próxima mudança...]

📝 Detectado: src/routes/__root.tsx
📝 Fazendo commit automático...
✅ Commit: auto: update 15:44:12
🚀 Fazendo push automático...
✅ Push para origin/main
```

---

## 🛑 Para Parar

Pressione **Ctrl+C** no terminal.

---

## ⚠️ Cuidados

### 1. Não Fazer Commit Manual

Se você fizer `git commit` manualmente enquanto o script está rodando, pode haver conflitos. **Recomendação**: Deixe o script fazer tudo.

### 2. Múltiplos Terminais

Se o script estiver rodando, não faça `git push` manualmente em outro terminal. Deixe o script fazer.

### 3. Merge Conflicts

Se houver merge conflicts, o script vai falhar. **Você precisa resolver manualmente** e depois o script vai continuar.

---

## 🐛 Troubleshooting

### Erro: "git: command not found"

Verifique se Git está instalado:
```bash
git --version
```

### Erro: "EACCES: permission denied"

No Linux/Mac, talvez precise de permissão:
```bash
chmod +x auto-commit.js
```

### Script não detecta mudanças

1. Verifique se você está no diretório correto
2. Verifique se arquivo não está na lista de ignored patterns
3. Reinicie o script

---

## ✅ Checklist

- [ ] `npm install` (dependências)
- [ ] `npm run auto-commit` em um terminal
- [ ] `npm run dev` em outro terminal
- [ ] Editar um arquivo
- [ ] Salvar (Ctrl+S)
- [ ] Ver commit automático no terminal
- [ ] Verificar GitHub e ver novo commit
- [ ] Verificar Vercel e ver novo deployment

---

## 🎯 Resultado Final

**Fluxo Antigo:**
1. Editar arquivo
2. `git add -A`
3. `git commit -m "..."`
4. `git push`
5. Vercel deploy
6. Esperar 2-3 minutos

**Fluxo Novo (Com Auto-Commit):**
1. Editar arquivo
2. ✅ **Automático!**
3. ✅ **Automático!**
4. ✅ **Automático!**
5. ✅ **Automático!**
6. ✅ **Deploy em tempo real!**

---

## 📝 Notas

- O script roda **indefinidamente** até você pressionar Ctrl+C
- Ideal para desenvolvimento local
- **NÃO recomendado** para produção
- Cada mudança = novo commit (pode ficar poluído no histórico)

---

**Curtiu? Agora tudo é automático!** 🚀

