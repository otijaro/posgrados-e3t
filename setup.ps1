# ============================================================
# setup.ps1 — Instalacion y configuracion completa en Windows
# Uso: Abrir PowerShell como Administrador y ejecutar .\setup.ps1
# ============================================================

$ErrorActionPreference = "Stop"
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

# ── 1. Winget disponible ──────────────────────────────────────
Write-Title "Verificando gestor de paquetes"
$hasWinget = Get-Command winget -ErrorAction SilentlyContinue
if (-not $hasWinget) {
    Write-ERR "winget no encontrado. Instale App Installer desde Microsoft Store."
    Write-ERR "URL: https://apps.microsoft.com/detail/9nblggh4nns1"
    exit 1
}
Write-OK "winget disponible"

# ── 2. Python ─────────────────────────────────────────────────
Write-Title "Verificando Python"
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-INFO "Python no encontrado. Instalando Python 3.11..."
    winget install --id Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    # Refrescar PATH
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    Write-OK "Python instalado"
} else {
    $pyVersion = python --version 2>&1
    Write-OK "Python ya instalado: $pyVersion"
}

# ── 3. Node.js ────────────────────────────────────────────────
Write-Title "Verificando Node.js"
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-INFO "Node.js no encontrado. Instalando Node.js 20 LTS..."
    winget install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    Write-OK "Node.js instalado"
} else {
    $nodeVersion = node --version 2>&1
    Write-OK "Node.js ya instalado: $nodeVersion"
}

# ── 4. Docker Desktop ─────────────────────────────────────────
Write-Title "Verificando Docker"
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
    Write-INFO "Docker no encontrado. Instalando Docker Desktop..."
    winget install --id Docker.DockerDesktop --silent --accept-package-agreements --accept-source-agreements
    Write-OK "Docker Desktop instalado"
    Write-Host ""
    Write-ERR "IMPORTANTE: Reinicie el PC, abra Docker Desktop y vuelva a ejecutar este script."
    exit 0
} else {
    # Verificar que Docker este corriendo
    $dockerRunning = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-ERR "Docker esta instalado pero no esta corriendo."
        Write-ERR "Abra Docker Desktop, espere a que inicie y vuelva a ejecutar este script."
        exit 1
    }
    Write-OK "Docker corriendo"
}

# ── 5. Base de datos ──────────────────────────────────────────
Write-Title "Levantando base de datos PostgreSQL"
Set-Location $ROOT
Write-INFO "Iniciando contenedor Docker..."
docker-compose up -d
Write-INFO "Esperando que PostgreSQL este listo (10 segundos)..."
Start-Sleep -Seconds 10
Write-OK "Base de datos lista en puerto 5433"

# ── 6. Entorno virtual Python ─────────────────────────────────
Write-Title "Configurando backend Python"
Set-Location $BACKEND

if (-not (Test-Path "venv")) {
    Write-INFO "Creando entorno virtual..."
    python -m venv venv
    Write-OK "Entorno virtual creado"
} else {
    Write-OK "Entorno virtual ya existe"
}

Write-INFO "Activando entorno virtual..."
& "$BACKEND\venv\Scripts\Activate.ps1"

Write-INFO "Instalando dependencias..."
pip install -q -r requirements.txt
pip install -q pydantic-settings "psycopg[binary]"
Write-OK "Dependencias instaladas"

# ── 7. Crear tablas ───────────────────────────────────────────
Write-Title "Creando tablas en la base de datos"
python -c "
from app.database import Base, engine
from app.models import *
Base.metadata.create_all(bind=engine)
print('Tablas creadas exitosamente')
"
Write-OK "Tablas creadas"

# ── 8. Datos iniciales ────────────────────────────────────────
Write-Title "Cargando datos iniciales"

Write-INFO "Creando facultad y escuela..."
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
        print('Facultad y Escuela ya existen')
"@

Write-INFO "Cargando profesores..."
python seed_profesores_2026.py 2>&1 | Select-Object -Last 8

Write-INFO "Cargando estudiantes..."
python seed_estudiantes_2026.py 2>&1 | Select-Object -Last 8

Write-INFO "Cargando coordinador..."
python seed_coordinador.py 2>&1 | Select-Object -Last 4

Write-INFO "Cargando secretaria..."
python seed_secretaria.py 2>&1 | Select-Object -Last 4

Write-INFO "Aplicando migraciones de firmas..."
python migracion_firmas.py 2>&1 | Select-Object -Last 4

Write-INFO "Aplicando migracion director de grupo..."
python migracion_dir_grupo.py 2>&1 | Select-Object -Last 4

Write-OK "Datos cargados correctamente"

# ── 9. Frontend ───────────────────────────────────────────────
Write-Title "Instalando dependencias del frontend"
Set-Location $FRONTEND
Write-INFO "Ejecutando npm install..."
npm install --silent
Write-OK "Frontend listo"

# ── 10. Resumen ───────────────────────────────────────────────
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   SETUP COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Para arrancar el proyecto ejecute:" -ForegroundColor White
Write-Host "  .\start.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "  O manualmente en 2 terminales:" -ForegroundColor White
Write-Host ""
Write-Host "  Terminal 1 (backend):" -ForegroundColor Yellow
Write-Host "  cd backend" -ForegroundColor Gray
Write-Host "  venv\Scripts\activate" -ForegroundColor Gray
Write-Host "  uvicorn app.main:app --reload --port 8000" -ForegroundColor Gray
Write-Host ""
Write-Host "  Terminal 2 (frontend):" -ForegroundColor Yellow
Write-Host "  cd frontend" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  Abrir en el navegador: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Credenciales:" -ForegroundColor White
Write-Host "  Coordinador : omar.tijaro@uis.edu.co  / coordinador123" -ForegroundColor Gray
Write-Host "  Director    : juanmrey@uis.edu.co      / uis2026" -ForegroundColor Gray
Write-Host "  Secretaria  : secre3t1@uis.edu.co      / uis2026" -ForegroundColor Gray
Write-Host "  Juliam      : juliam2238321@correo.uis.edu.co / uis2026" -ForegroundColor Gray
Write-Host ""
