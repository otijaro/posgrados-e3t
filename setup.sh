#!/bin/bash
# ============================================================
# setup.sh — Instala y arranca el portal de Posgrados E3T
# Uso: bash setup.sh
# ============================================================

set -e  # Detener si hay error

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Portal Posgrados E3T — Setup inicial   ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Docker ────────────────────────────────────────────────
echo "🐳 Levantando base de datos..."
cd "$ROOT"
docker-compose up -d
echo "   Esperando que PostgreSQL esté listo..."
sleep 5

# ── 2. Backend — entorno virtual ────────────────────────────
echo ""
echo "🐍 Configurando backend..."
cd "$BACKEND"

if [ ! -d "venv" ]; then
  echo "   Creando entorno virtual..."
  python3 -m venv venv
fi

source venv/bin/activate

echo "   Instalando dependencias..."
pip install -q -r requirements.txt
pip install -q pydantic-settings "psycopg[binary]"

# ── 3. Crear tablas ──────────────────────────────────────────
echo ""
echo "🗄️  Creando tablas en la base de datos..."
python3 -c "
from app.database import Base, engine
from app.models import *
Base.metadata.create_all(bind=engine)
print('   ✅ Tablas creadas')
"

# ── 4. Datos iniciales ───────────────────────────────────────
echo ""
echo "🌱 Cargando datos iniciales..."

python3 -c "
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Verificar si ya existen
    fac = conn.execute(text('SELECT COUNT(*) FROM facultad')).scalar()
    if fac == 0:
        conn.execute(text(\"INSERT INTO facultad (id, nombre, codigo) VALUES (1, 'Ingenierías Fisicomecánicas', 'FISI') ON CONFLICT (id) DO NOTHING\"))
        conn.execute(text(\"INSERT INTO escuela (id, nombre, codigo, id_facultad) VALUES (1, 'Ingeniería Eléctrica, Electrónica y de Telecomunicaciones', 'E3T', 1) ON CONFLICT (id) DO NOTHING\"))
        conn.commit()
        print('   ✅ Facultad y Escuela creadas')
    else:
        print('   ⏭️  Facultad y Escuela ya existen')
"

echo "   📚 Cargando profesores..."
python3 seed_profesores_2026.py 2>&1 | tail -5

echo "   🎓 Cargando estudiantes..."
python3 seed_estudiantes_2026.py 2>&1 | tail -5

echo "   👨‍💼 Cargando coordinador..."
python3 seed_coordinador.py 2>&1 | tail -3

echo "   📋 Cargando secretaria..."
python3 seed_secretaria.py 2>&1 | tail -3

echo "   🔑 Corriendo migraciones de firmas..."
python3 migracion_firmas.py 2>&1 | tail -3

echo "   🔑 Migrando director de grupo..."
python3 migracion_dir_grupo.py 2>&1 | tail -3

# ── 5. Frontend ──────────────────────────────────────────────
echo ""
echo "⚛️  Instalando dependencias del frontend..."
cd "$FRONTEND"
npm install --silent

# ── 6. Listo ────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║           ✅ Setup completado            ║"
echo "╠══════════════════════════════════════════╣"
echo "║                                          ║"
echo "║  Para arrancar el proyecto:              ║"
echo "║                                          ║"
echo "║  Terminal 1 (backend):                   ║"
echo "║  cd backend && source venv/bin/activate  ║"
echo "║  uvicorn app.main:app --reload --port 8000║"
echo "║                                          ║"
echo "║  Terminal 2 (frontend):                  ║"
echo "║  cd frontend && npm run dev              ║"
echo "║                                          ║"
echo "║  🌐 http://localhost:3000                ║"
echo "║                                          ║"
echo "║  Credenciales:                           ║"
echo "║  Coordinador: omar.tijaro@uis.edu.co     ║"
echo "║  Contraseña:  coordinador123             ║"
echo "║  Juliam:      juliam2238321@correo...    ║"
echo "║  Contraseña:  uis2026                    ║"
echo "╚══════════════════════════════════════════╝"
echo ""
