# ============================================================
# start.ps1 — Arranca el backend y frontend
# Uso: .\start.ps1
# ============================================================

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND = "$ROOT\backend"
$FRONTEND = "$ROOT\frontend"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Arrancando Portal Posgrados E3T" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Base de datos
Write-Host "  [..] Verificando base de datos..." -ForegroundColor Yellow
Set-Location $ROOT
docker-compose up -d 2>&1 | Out-Null
Write-Host "  [OK] Base de datos lista" -ForegroundColor Green

# Backend
Write-Host "  [..] Iniciando backend..." -ForegroundColor Yellow
$backendJob = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$BACKEND'; & '$BACKEND\venv\Scripts\Activate.ps1'; uvicorn app.main:app --reload --port 8000"
) -PassThru
Write-Host "  [OK] Backend en http://localhost:8000" -ForegroundColor Green

Start-Sleep -Seconds 2

# Frontend
Write-Host "  [..] Iniciando frontend..." -ForegroundColor Yellow
$frontendJob = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$FRONTEND'; npm run dev"
) -PassThru
Write-Host "  [OK] Frontend en http://localhost:3000" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   Portal corriendo en http://localhost:3000" -ForegroundColor Green
Write-Host "   Cierre las ventanas de terminal para detener" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Abrir navegador automaticamente
Start-Sleep -Seconds 4
Start-Process "http://localhost:3000"
