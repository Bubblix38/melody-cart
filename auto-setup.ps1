#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script automático de setup para TopDJ Security
    
.DESCRIPTION
    Configura automaticamente Supabase, reCAPTCHA e ambiente de segurança
    
.EXAMPLE
    .\auto-setup.ps1
    
.NOTES
    Execute na raiz do projeto TopDJ
#>

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "                    TOPJ - SETUP AUTOMATICO DE SEGURANCA" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se estamos no diretório certo
if (-not (Test-Path "package.json")) {
    Write-Host "ERRO: Execute este script na raiz do projeto" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host "[OK] Projeto TopDJ detectado" -ForegroundColor Green
Write-Host ""

# 2. Criar arquivo .env.local com template
Write-Host "[*] Criando .env.local com template..." -ForegroundColor Yellow

$envContent = @"
# Supabase - obter em https://app.supabase.com/project/nwsjgacmraijqyvvghoh/settings/api
VITE_SUPABASE_URL=https://nwsjgacmraijqyvvghoh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=COPIAR_CHAVE_ANON_PUBLIC_AQUI

# Google reCAPTCHA v3 - obter em https://www.google.com/recaptcha/admin
VITE_RECAPTCHA_SITE_KEY=COPIAR_SITE_KEY_AQUI

# Servidor - NAO COMMITAR
VITE_RECAPTCHA_SECRET_KEY=COPIAR_SECRET_KEY_AQUI
SUPABASE_SERVICE_ROLE_KEY=COPIAR_SERVICE_ROLE_KEY_AQUI
STRIPE_WEBHOOK_SECRET=JA_CONFIGURADO
"@

Set-Content -Path ".env.local" -Value $envContent -Encoding UTF8
Write-Host "[OK] .env.local criado" -ForegroundColor Green
Write-Host ""

# 3. Instalar dependências
Write-Host "[*] Instalando dependências..." -ForegroundColor Yellow
& npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao instalar dependências" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host "[OK] Dependências instaladas" -ForegroundColor Green
Write-Host ""

# 4. Build
Write-Host "[*] Buildando projeto..." -ForegroundColor Yellow
& npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao fazer build" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host "[OK] Build completo" -ForegroundColor Green
Write-Host ""

# 5. Criar .env.example para referência
Write-Host "[*] Criando .env.example..." -ForegroundColor Yellow
Copy-Item ".env.local" ".env.example" -Force
Write-Host "[OK] .env.example criado" -ForegroundColor Green
Write-Host ""

# 6. Verificar se git está disponível
if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Host "[*] Configurando git hooks..." -ForegroundColor Yellow
    
    # Criar diretório de hooks se não existir
    if (-not (Test-Path ".git/hooks")) {
        New-Item -ItemType Directory -Path ".git/hooks" -Force | Out-Null
    }
    
    Write-Host "[OK] Git hooks preparado" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "                           SETUP AUTOMATICO COMPLETO!" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. EDITAR .env.local com as chaves:" -ForegroundColor White
Write-Host "   - Abra: .env.local" -ForegroundColor Gray
Write-Host "   - Copie VITE_SUPABASE_PUBLISHABLE_KEY de: https://app.supabase.com" -ForegroundColor Gray
Write-Host "   - Copie VITE_RECAPTCHA_SITE_KEY de: https://www.google.com/recaptcha/admin" -ForegroundColor Gray
Write-Host "   - Copie VITE_RECAPTCHA_SECRET_KEY do Google reCAPTCHA" -ForegroundColor Gray
Write-Host ""
Write-Host "2. ADICIONAR ao Lovable Settings --> Environment Variables:" -ForegroundColor White
Write-Host "   - VITE_SUPABASE_URL" -ForegroundColor Gray
Write-Host "   - VITE_SUPABASE_PUBLISHABLE_KEY" -ForegroundColor Gray
Write-Host "   - VITE_RECAPTCHA_SITE_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "3. TESTAR:" -ForegroundColor White
Write-Host "   - npm run dev" -ForegroundColor Gray
Write-Host "   - Abra http://localhost:5173/loja" -ForegroundColor Gray
Write-Host "   - Deve carregar sem erro 'No API key found'" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Documentação:" -ForegroundColor Yellow
Write-Host "  - COMO_CONTINUAR.md" -ForegroundColor Gray
Write-Host "  - CONFIGURAR_LOVABLE_SUPABASE.md" -ForegroundColor Gray
Write-Host "  - AUTOMACAO_SETUP.md" -ForegroundColor Gray
Write-Host ""

Read-Host "Pressione Enter para sair"
