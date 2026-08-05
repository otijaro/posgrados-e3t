# ============================================================
# setup.ps1 — Instalacion y configuracion completa en Windows
# Uso: Abrir PowerShell como Administrador y ejecutar .\setup.ps1
# ============================================================

$ErrorActionPreference = "Continue"
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND = "$ROOT\backend"
$FRONTEND = "$ROOT\frontend"

function Write-Title($msg) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
}
function Write-OK($msg)   { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-INFO($msg) { Write-Host "  [..] $msg" -ForegroundColor Yellow }
function Write-ERR($msg)  { Write-Host "  [!!] $msg" -ForegroundColor Red }

Write-Title "Portal Posgrados E3T - Setup Windows"

# ── 1. Winget ─────────────────────────────────────────────────
Write-Title "Verificando gestor de paquetes"
$hasWinget = Get-Command winget -ErrorAction SilentlyContinue
if (-not $hasWinget) {
    Write-ERR "winget no encontrado. Instale App Installer desde Microsoft Store."
    exit 1
}
Write-OK "winget disponible"

# ── 2. Python ─────────────────────────────────────────────────
Write-Title "Verificando Python"
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-INFO "Instalando Python 3.11..."
    winget install --id Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
    Write-OK "Python instalado"
} else {
    Write-OK "Python ya instalado: $(python --version 2>&1)"
}

# ── 3. Node.js ────────────────────────────────────────────────
Write-Title "Verificando Node.js"
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-INFO "Instalando Node.js 20 LTS..."
    winget install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
    Write-OK "Node.js instalado"
} else {
    Write-OK "Node.js ya instalado: $(node --version 2>&1)"
}

# ── 4. Docker Desktop ─────────────────────────────────────────
Write-Title "Verificando Docker"
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
    Write-INFO "Instalando Docker Desktop..."
    winget install --id Docker.DockerDesktop --silent --accept-package-agreements --accept-source-agreements
    Write-ERR "Reinicie el PC, abra Docker Desktop y vuelva a ejecutar este script."
    exit 0
} else {
    $dockerInfo = docker info 2>&1
    $dockerOk   = $dockerInfo | Where-Object { $_ -match "Server Version" }
    if (-not $dockerOk) {
        Write-ERR "Docker no esta corriendo. Abra Docker Desktop y reintente."
        exit 1
    }
    Write-OK "Docker corriendo"
}

# ── 5. LibreOffice (para generar PDFs) ────────────────────────
Write-Title "Verificando LibreOffice"
$libreOfficePath = @(
    "C:\Program Files\LibreOffice\program\soffice.exe",
    "C:\Program Files (x86)\LibreOffice\program\soffice.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $libreOfficePath) {
    Write-INFO "LibreOffice no encontrado. Instalando..."
    winget install --id TheDocumentFoundation.LibreOffice --silent --accept-package-agreements --accept-source-agreements
    Write-OK "LibreOffice instalado"
} else {
    Write-OK "LibreOffice ya instalado: $libreOfficePath"
}

# ── 6. Base de datos ──────────────────────────────────────────
Write-Title "Levantando base de datos PostgreSQL"
Set-Location $ROOT
docker-compose up -d
Write-INFO "Esperando que PostgreSQL este listo (10 segundos)..."
Start-Sleep -Seconds 10
Write-OK "Base de datos lista en puerto 5433"

# ── 7. Entorno virtual Python ─────────────────────────────────
Write-Title "Configurando backend Python"
Set-Location $BACKEND

if (-not (Test-Path "venv")) {
    Write-INFO "Creando entorno virtual..."
    python -m venv venv
    Write-OK "Entorno virtual creado"
} else {
    Write-OK "Entorno virtual ya existe"
}

& "$BACKEND\venv\Scripts\Activate.ps1"

Write-INFO "Instalando dependencias..."
pip install -q -r requirements.txt
pip install -q pydantic-settings "psycopg[binary]" httpx
Write-OK "Dependencias instaladas"

# ── 8. Crear tablas ───────────────────────────────────────────
Write-Title "Creando tablas en la base de datos"
python -c "
from app.database import Base, engine
from app.models import *
Base.metadata.create_all(bind=engine)
print('Tablas creadas')
"
Write-OK "Tablas creadas"

# ── 9. Datos iniciales ────────────────────────────────────────
Write-Title "Cargando datos iniciales"

python -c @"
from app.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    fac = conn.execute(text('SELECT COUNT(*) FROM facultad')).scalar()
    if fac == 0:
        conn.execute(text(\"INSERT INTO facultad (id, nombre, codigo) VALUES (1, 'Ingenierias Fisicomec\u00e1nicas', 'FISI') ON CONFLICT (id) DO NOTHING\"))
        conn.execute(text(\"INSERT INTO escuela (id, nombre, codigo, id_facultad) VALUES (1, 'Ingenieria Electrica, Electronica y de Telecomunicaciones', 'E3T', 1) ON CONFLICT (id) DO NOTHING\"))
        conn.commit()
        print('Facultad y Escuela creadas')
    else:
        print('Ya existen')
"@

Write-INFO "Cargando profesores..."
python seed_profesores_2026.py 2>&1 | Select-Object -Last 6

Write-INFO "Cargando estudiantes..."
python seed_estudiantes_2026.py 2>&1 | Select-Object -Last 6

Write-INFO "Cargando coordinador y secretaria..."
python seed_coordinador.py 2>&1 | Select-Object -Last 3
python seed_secretaria.py 2>&1 | Select-Object -Last 3

Write-INFO "Aplicando migraciones..."
python migracion_firmas.py 2>&1 | Select-Object -Last 3
python migracion_dir_grupo.py 2>&1 | Select-Object -Last 3

Write-INFO "Cargando documentos iniciales..."
python seed_documentos.py 2>&1 | Select-Object -Last 3

Write-OK "Datos cargados"

# ── 10. Frontend ──────────────────────────────────────────────
Write-Title "Instalando dependencias del frontend"
Set-Location $FRONTEND
npm install --silent
Write-OK "Frontend listo"

# ── 11. Resumen ───────────────────────────────────────────────
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   SETUP COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Para arrancar: .\start.ps1" -ForegroundColor Cyan
Write-Host "  Abrir: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Coordinador : omar.tijaro@uis.edu.co  / coordinador123" -ForegroundColor Gray
Write-Host "  Director    : juanmrey@uis.edu.co     / uis2026" -ForegroundColor Gray
Write-Host "  Secretaria  : secre3t1@uis.edu.co     / uis2026" -ForegroundColor Gray
Write-Host "  Juliam      : juliam2238321@correo.uis.edu.co / uis2026" -ForegroundColor Gray
Write-Host ""
