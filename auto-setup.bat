@echo off
REM Script automático de setup para TopDJ Security
REM Execute este arquivo para configurar tudo automaticamente

echo.
echo ================================================================================
echo                    TOPJ - SETUP AUTOMATICO DE SEGURANCA
echo ================================================================================
echo.

REM 1. Verificar se estamos no diretório certo
if not exist "package.json" (
    echo ERRO: Execute este script na raiz do projeto
    pause
    exit /b 1
)

echo [OK] Projeto TopDJ detectado
echo.

REM 2. Criar arquivo .env.local com template
echo [*] Criando .env.local com template...
(
    echo # Supabase - obter em https://app.supabase.com/project/nwsjgacmraijqyvvghoh/settings/api
    echo VITE_SUPABASE_URL=https://nwsjgacmraijqyvvghoh.supabase.co
    echo VITE_SUPABASE_PUBLISHABLE_KEY=COPIAR_CHAVE_ANON_PUBLIC_AQUI
    echo.
    echo # Google reCAPTCHA v3 - obter em https://www.google.com/recaptcha/admin
    echo VITE_RECAPTCHA_SITE_KEY=COPIAR_SITE_KEY_AQUI
    echo.
    echo # Servidor - NAO COMMITAR
    echo VITE_RECAPTCHA_SECRET_KEY=COPIAR_SECRET_KEY_AQUI
    echo SUPABASE_SERVICE_ROLE_KEY=COPIAR_SERVICE_ROLE_KEY_AQUI
    echo STRIPE_WEBHOOK_SECRET=JA_CONFIGURADO
) > .env.local

echo [OK] .env.local criado
echo.

REM 3. Instalar dependências
echo [*] Instalando dependências...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERRO ao instalar dependências
    pause
    exit /b 1
)
echo [OK] Dependências instaladas
echo.

REM 4. Build
echo [*] Buildando projeto...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ERRO ao fazer build
    pause
    exit /b 1
)
echo [OK] Build completo
echo.

REM 5. Criar .env.example para referência
echo [*] Criando .env.example...
copy .env.local .env.example > nul
echo [OK] .env.example criado
echo.

REM 6. Mensagem final
echo ================================================================================
echo                           SETUP AUTOMATICO COMPLETO!
echo ================================================================================
echo.
echo PROXIMOS PASSOS:
echo.
echo 1. EDITAR .env.local com as chaves:
echo    - VITE_SUPABASE_PUBLISHABLE_KEY (do Supabase)
echo    - VITE_RECAPTCHA_SITE_KEY (do Google reCAPTCHA)
echo    - VITE_RECAPTCHA_SECRET_KEY (do Google reCAPTCHA)
echo.
echo 2. ADICIONAR ao Lovable Settings --> Environment Variables
echo.
echo 3. EXECUTAR: npm run dev
echo.
echo ================================================================================
echo.
pause
