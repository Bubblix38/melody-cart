# Script de Auto-Commit e Push
# Execute este script para ativar auto-commit sempre que arquivos mudam

Write-Host "🚀 Ativando auto-commit e auto-push..." -ForegroundColor Green

# Verificar se fswatch está instalado (para Windows, usaremos choco ou manual)
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = Get-Location
$watcher.Filter = "*.*"
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

# Rastrear qual arquivo foi modificado
$script:lastFile = ""
$script:lastTime = [DateTime]::MinValue

# Ação quando arquivo é modificado
$action = {
    $file = $Event.SourceEventArgs.FullPath
    $currentTime = [DateTime]::Now
    
    # Evitar múltiplos eventos para o mesmo arquivo (noise)
    if ($file -eq $script:lastFile -and ($currentTime - $script:lastTime).TotalSeconds -lt 2) {
        return
    }
    
    $script:lastFile = $file
    $script:lastTime = $currentTime
    
    # Ignorar certos arquivos
    if ($file -match "node_modules|\.git|dist|\.output" ) {
        return
    }
    
    Write-Host "📝 Detectado: $file" -ForegroundColor Yellow
    
    # Aguardar um pouco para garantir que o arquivo foi salvo
    Start-Sleep -Seconds 2
    
    # Executar git add
    git add -A
    
    # Fazer commit
    $message = "auto: update $(Get-Date -Format 'HH:mm:ss')"
    git commit -m $message 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Commit: $message" -ForegroundColor Green
        
        # Auto-push
        git push 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "🚀 Push automático concluído!" -ForegroundColor Green
        }
    }
}

# Registrar handlers
Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $action | Out-Null

Write-Host "✅ Auto-commit ativado!" -ForegroundColor Green
Write-Host "📂 Monitorando mudanças em: $(Get-Location)" -ForegroundColor Cyan
Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Yellow

# Manter o script rodando
while ($true) {
    Start-Sleep -Seconds 1
}
