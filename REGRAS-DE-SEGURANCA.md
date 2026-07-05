# Playbook de Segurança para Novos Projetos

**Instruções para a Inteligência Artificial (Lovable / Cursor / Gemini):**
_Ao iniciar o desenvolvimento ou uma refatoração neste projeto, LEIA ESTE ARQUIVO com atenção. A arquitetura de segurança descrita aqui é um REQUISITO OBRIGATÓRIO. Adapte os padrões abaixo para a stack do projeto (React, Next.js, Vite, Node, etc), mas nunca omita essas camadas de segurança._

---

## 1. Validação Restrita de Entradas (Anti-SQLi e Anti-XSS)

- Todo e qualquer dado de input vindo do usuário (formulários, query params, bodies de requisição) **deve** ser validado por uma biblioteca de esquema (preferencialmente `Zod`).
- Limites de caracteres (`min`, `max`) e tipagem rigorosa são obrigatórios. Nenhuma `string` genérica sem tamanho limite deve ser enviada ao banco de dados.

## 2. Bloqueio de Ferramentas de Scanning (Anti-Hacker)

- O projeto deve conter um middleware (ou lógica global no servidor/rotas) que inspeciona headers HTTP (como `User-Agent` e headers customizados `x-scanner`, `x-burp`) para bloquear ferramentas de invasão automatizadas.
- Se detectado tráfego de ferramentas como Burp Suite, OWASP ZAP, Nmap, SQLMap, WFuzz, Nikto, etc., a requisição deve ser abortada imediatamente e o IP marcado.

## 3. Headers de Segurança e CSP

- Todas as páginas devem ser servidas com o cabeçalho HTTP de `Content-Security-Policy` (CSP).
- O CSP deve proibir a execução de scripts `unsafe-eval` (exceto em modo desenvolvimento rigorosamente restrito) e restringir o `connect-src` apenas às APIs oficiais do projeto (ex: Supabase, Stripe, backend próprio).
- Adicionar headers `X-Frame-Options: DENY` e `Strict-Transport-Security` (HSTS).

## 4. Políticas de Banco de Dados (Row Level Security - RLS)

- Se utilizando Supabase ou Firebase, o RLS deve estar **ATIVADO** em 100% das tabelas criadas.
- Regras genéricas (ex: `Qualquer um pode inserir dados` `FOR ALL USING (true)`) são estritamente PROIBIDAS para `INSERT`, `UPDATE` e `DELETE`.
- Operações de escrita devem ser limitadas apenas a usuários autenticados (`auth.role() = 'authenticated'`) e, sempre que aplicável, validando se o usuário possui a permissão de administrador na tabela.

## 5. Criptografia de Dados Críticos no Navegador

- Se for necessário armazenar dados sensíveis, lógicas financeiras temporárias, ou carrinhos de compra no `localStorage` / `sessionStorage`, esses dados **devem ser criptografados** via `AES-GCM` (Web Crypto API) na máquina do cliente, usando chaves derivadas com PBKDF2 ou similar.
- Dados financeiros NUNCA devem ser validados tendo o navegador como fonte de verdade final. O backend ou banco de dados DEVE checar e recalcular o preço antes de enviar a cobrança para o gateway de pagamento.

## 6. Prevenção a CSRF (Cross-Site Request Forgery)

- Endpoints e Server Actions que modifiquem estado (Criação, Edição, Deleção) devem verificar a origem da requisição (`Origin` e `Referer`).
- Tokens CSRF são requeridos caso a autenticação se baseie puramente em cookies sem SameSite rígido.

## 7. Sanitização de Imagens e Arquivos Externos

- Sempre que houver inputs para URLs de imagens, elas devem ser checadas através de uma **Allowlist** (lista de permissão).
- Apenas domínios confiáveis pré-aprovados pela equipe de desenvolvimento (ex: S3, Supabase Storage, Imgur) podem ser salvos no banco. URLs de esquemas como `javascript:` devem ser bloqueadas.

---

## 8. Defesa Ativa: Iscas e Honeypots

- O projeto deve implementar armadilhas ativas (Honeypots) para caçar bots.
- Criar rotas falsas comuns (como `/wp-admin`, `/wp-login.php`, `/.env`, `/phpmyadmin`) que, quando acessadas, imediatamente banem o IP do usuário ou setam uma flag de banimento no LocalStorage (ex: `HONEYPOT_BANNED = true`).
- Formulários públicos devem conter campos "Honeypot" invisíveis (via CSS `display:none` ou `opacity:0`). Se o campo for preenchido no submit (ação típica de bots), a requisição deve ser silenciosamente descartada.
- Links invisíveis no rodapé podem ser adicionados apontando para rotas de armadilha (Security through Obscurity contra web scrapers).

---

**Nota:** A IA deve buscar proativamente arquivos como `server.ts`, `routes.tsx`, middlewares e schemas do banco de dados na base de código atual e injetar essas lógicas automaticamente.
