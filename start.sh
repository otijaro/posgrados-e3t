#!/bin/bash
# ============================================================
# start.sh — Arranca el backend y frontend
# Uso: bash start.sh
# ============================================================

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

echo ""
echo "============================================"
echo "   Arrancando Portal Posgrados E3T"
echo "============================================"
echo ""

# ── Docker ───────────────────────────────────────────────────
echo "  [..] Levantando base de datos..."
cd "$ROOT"
docker-compose up -d

# Esperar a que PostgreSQL esté realmente listo
echo "  [..] Esperando a que PostgreSQL esté listo..."
for i in $(seq 1 20); do
    if docker exec posgrados_db pg_isready -U posgrados_user -q 2>/dev/null; then
        echo "  [OK] PostgreSQL listo"
        break
    fi
    echo "       Intento $i/20..."
    sleep 2
done

# ── Backend ───────────────────────────────────────────────────
echo ""
echo "  [..] Iniciando backend en http://localhost:8000 ..."
cd "$BACKEND"
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
echo "  [OK] Backend PID: $BACKEND_PID"

sleep 2

# ── Frontend ──────────────────────────────────────────────────
echo ""
echo "  [..] Iniciando frontend en http://localhost:3000 ..."
cd "$FRONTEND"
npm run dev &
FRONTEND_PID=$!
echo "  [OK] Frontend PID: $FRONTEND_PID"

echo ""
echo "============================================"
echo "   Portal corriendo en http://localhost:3000"
echo "   Presione Ctrl+C para detener todo"
echo "============================================"
echo ""

# Detener ambos al hacer Ctrl+C
trap "echo ''; echo 'Deteniendo...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait $BACKEND_PID
