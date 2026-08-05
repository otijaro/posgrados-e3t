#!/bin/bash
# ============================================================
# setup.sh — Instala y arranca el portal de Posgrados E3T
# Uso: bash setup.sh
# ============================================================

set -e

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

# ── 2. LibreOffice en Mac (para generar PDFs) ────────────────
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo ""
  echo "📄 Verificando LibreOffice..."
  if ! command -v soffice &>/dev/null && [ ! -f "/Applications/LibreOffice.app/Contents/MacOS/soffice" ]; then
    echo "   LibreOffice no encontrado. Instalando con Homebrew..."
    if command -v brew &>/dev/null; then
      brew install --cask libreoffice
      echo "   ✅ LibreOffice instalado"
    else
      echo "   ⚠️  Instale LibreOffice manualmente: https://www.libreoffice.org"
    fi
  else
    echo "   ✅ LibreOffice ya instalado"
  fi
fi

# ── 3. Backend — entorno virtual ─────────────────────────────
echo ""
echo "🐍 Configurando backend..."
cd "$BACKEND"

if [ ! -d "venv" ]; then
  echo "   Buscando una versión de Python compatible (3.11–3.13)..."
  PYBIN=""
  for cand in python3.13 python3.12 python3.11; do
    if command -v "$cand" &>/dev/null; then
      PYBIN="$cand"
      break
    fi
  done

  if [ -z "$PYBIN" ]; then
    # Fallback: usar python3 del sistema, pero avisar si es demasiado nuevo
    PYVER="$(python3 -c 'import sys; print(f"{sys.version_info[0]}.{sys.version_info[1]}")')"
    if [[ "$(printf '%s\n' "3.14" "$PYVER" | sort -V | head -n1)" == "3.14" ]]; then
      echo "   ⚠️  No se encontró Python 3.11–3.13 y el python3 por defecto es $PYVER,"
      echo "       versión demasiado nueva para pydantic-core (requiere <= 3.13)."
      echo "       Instálalo con: brew install python@3.12"
      exit 1
    fi
    PYBIN="python3"
  fi

  echo "   Creando entorno virtual con $PYBIN ($($PYBIN --version))..."
  "$PYBIN" -m venv venv
fi

source venv/bin/activate

echo "   Instalando dependencias..."
pip install -q -r requirements.txt
pip install -q pydantic-settings "psycopg[binary]>=3.2.10"

# ── 4. Crear tablas ──────────────────────────────────────────
echo ""
echo "🗄️  Creando tablas en la base de datos..."
python3 -c "
from app.database import Base, engine
from app.models import *
Base.metadata.create_all(bind=engine)
print('   ✅ Tablas creadas')
"

# ── 5. Datos iniciales ───────────────────────────────────────
echo ""
echo "🌱 Cargando datos iniciales..."

python3 -c "
from app.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    fac = conn.execute(text('SELECT COUNT(*) FROM facultad')).scalar()
    if fac == 0:
        conn.execute(text(\"INSERT INTO facultad (id, nombre, codigo) VALUES (1, 'Ingenierías Fisicomecánicas', 'FISI') ON CONFLICT (id) DO NOTHING\"))
        conn.execute(text(\"INSERT INTO escuela (id, nombre, codigo, id_facultad) VALUES (1, 'Ingeniería Eléctrica, Electrónica y de Telecomunicaciones', 'E3T', 1) ON CONFLICT (id) DO NOTHING\"))
        conn.commit()
        print('   ✅ Facultad y Escuela creadas')
    else:
        print('   ⏭️  Ya existen')
"

echo "   📚 Cargando profesores..."
python3 seed_profesores_2026.py 2>&1 | tail -5

echo "   🎓 Cargando estudiantes..."
python3 seed_estudiantes_2026.py 2>&1 | tail -5

echo "   👨‍💼 Cargando coordinador..."
python3 seed_coordinador.py 2>&1 | tail -3

echo "   📋 Cargando secretaria..."
python3 seed_secretaria.py 2>&1 | tail -3

echo "   🔑 Migraciones..."
python3 migracion_firmas.py 2>&1 | tail -3
python3 migracion_dir_grupo.py 2>&1 | tail -3

echo "   🔬 Cargando grupos de investigación..."
 python3 seed_grupos.py 2>&1 | tail -3

   echo "   📁 Cargando documentos iniciales..."
python3 seed_documentos.py 2>&1 | tail -3

# ── 6. Frontend ──────────────────────────────────────────────
echo ""
echo "⚛️  Instalando dependencias del frontend..."
cd "$FRONTEND"
npm install --silent

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║           ✅ Setup completado            ║"
echo "╠══════════════════════════════════════════╣"
echo "║  Para arrancar: bash start.sh            ║"
echo "║  Abrir: http://localhost:3000            ║"
echo "║                                          ║"
echo "║  Coordinador: omar.tijaro@uis.edu.co     ║"
echo "║  Contraseña:  coordinador123             ║"
echo "║  Juliam:      juliam2238321@correo...    ║"
echo "║  Contraseña:  uis2026                    ║"
echo "╚══════════════════════════════════════════╝"
echo ""
