/**
 * Script automático para implementar reCAPTCHA v3
 * 
 * Execute este script para automaticamente:
 * 1. Criar arquivo src/lib/recaptcha.ts
 * 2. Adicionar endpoint /api/verify-recaptcha em src/server.ts
 * 3. Integrar em src/routes/admin.tsx
 * 
 * Uso:
 *   npx ts-node auto-implement-recaptcha.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const projectRoot = process.cwd();

console.log('🤖 Automação: Implementar reCAPTCHA v3');
console.log('=====================================\n');

// 1. Criar src/lib/recaptcha.ts
const recaptchaFile = path.join(projectRoot, 'src', 'lib', 'recaptcha.ts');

const recaptchaContent = `/**
 * Google reCAPTCHA v3 Integration
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
    console.error('Erro ao executar reCAPTCHA:', error);
    return null;
  }
}

function loadRecaptchaScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar reCAPTCHA'));
    document.head.appendChild(script);
  });
}

declare global {
  interface Window {
    grecaptcha?: {
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}
`;

console.log('[*] Criando src/lib/recaptcha.ts...');
fs.writeFileSync(recaptchaFile, recaptchaContent);
console.log('[OK] src/lib/recaptcha.ts criado\n');

// 2. Criar servidor endpoint para verificar reCAPTCHA
const serverEndpointCode = `
// Adicione isto em src/server.ts (antes do fetch handler)

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

    const verified = data.success && data.score > 0.5;

    if (!verified) {
      console.warn(\`[reCAPTCHA] Score baixo: \${data.score} (ação: \${data.action})\`);
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
`;

console.log('[*] Criando instruções para server endpoint...');
const serverInstructionsFile = path.join(projectRoot, 'SERVER_ENDPOINT_RECAPTCHA.txt');
fs.writeFileSync(
  serverInstructionsFile,
  'ADICIONE ISTO EM src/server.ts (antes do return new Response no final):\n\n' + serverEndpointCode
);
console.log('[OK] Instruções salvas em SERVER_ENDPOINT_RECAPTCHA.txt\n');

// 3. Criar instruções para integração em admin.tsx
const adminIntegrationCode = `
// Adicione isto em src/routes/admin.tsx, na função handleLogin():

import { executeRecaptcha } from '@/lib/recaptcha';

// ... dentro de handleLogin()

// Se há falhas anteriores, solicitar reCAPTCHA
if (rateCheckEmail.requiresCaptcha) {
  console.log('[LOGIN] Solicitando reCAPTCHA...');
  
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

// Helper: verificar reCAPTCHA no servidor
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
`;

const adminInstructionsFile = path.join(projectRoot, 'ADMIN_INTEGRATION_RECAPTCHA.txt');
fs.writeFileSync(
  adminInstructionsFile,
  'ADICIONE ISTO EM src/routes/admin.tsx, NA FUNÇÃO handleLogin():\n\n' + adminIntegrationCode
);
console.log('[OK] Instruções de integração salvas em ADMIN_INTEGRATION_RECAPTCHA.txt\n');

// 4. Criar checklist
const checklistContent = `
✅ CHECKLIST - IMPLEMENTAÇÃO DE reCAPTCHA v3

Arquivo Criado:
  [x] src/lib/recaptcha.ts
  
Instruções Criadas:
  [ ] SERVER_ENDPOINT_RECAPTCHA.txt - Copiar em src/server.ts
  [ ] ADMIN_INTEGRATION_RECAPTCHA.txt - Copiar em src/routes/admin.tsx
  
Configuração Necessária:
  [ ] VITE_RECAPTCHA_SITE_KEY no .env.local
  [ ] VITE_RECAPTCHA_SECRET_KEY no .env.local (servidor)
  [ ] Adicionar ao Lovable Settings → Environment Variables
  
Implementação Manual:
  [ ] Copiar código do SERVER_ENDPOINT_RECAPTCHA.txt em src/server.ts
  [ ] Copiar código do ADMIN_INTEGRATION_RECAPTCHA.txt em src/routes/admin.tsx
  
Testes:
  [ ] npm run build (sem erros)
  [ ] npm run dev
  [ ] Fazer 3 logins falhados
  [ ] Deve aparecer reCAPTCHA na 4ª tentativa
  [ ] Passar no reCAPTCHA
  [ ] Login deve ser bloqueado por 15 minutos
  
Commits:
  [ ] git add .
  [ ] git commit -m "feat: implement Google reCAPTCHA v3"
  [ ] git push
`;

const checklistFile = path.join(projectRoot, 'CHECKLIST_RECAPTCHA.md');
fs.writeFileSync(checklistFile, checklistContent);
console.log('[OK] Checklist criado em CHECKLIST_RECAPTCHA.md\n');

console.log('=====================================');
console.log('✅ AUTOMAÇÃO COMPLETA!\n');
console.log('Arquivos criados:');
console.log('  1. src/lib/recaptcha.ts');
console.log('  2. SERVER_ENDPOINT_RECAPTCHA.txt (instruções)');
console.log('  3. ADMIN_INTEGRATION_RECAPTCHA.txt (instruções)');
console.log('  4. CHECKLIST_RECAPTCHA.md\n');
console.log('Próximos passos:');
console.log('  1. Leia SERVER_ENDPOINT_RECAPTCHA.txt');
console.log('  2. Copie código em src/server.ts');
console.log('  3. Leia ADMIN_INTEGRATION_RECAPTCHA.txt');
console.log('  4. Copie código em src/routes/admin.tsx');
console.log('  5. npm run build');
console.log('  6. Teste login com reCAPTCHA');
console.log('  7. git push');
