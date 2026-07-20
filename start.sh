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
echo "  [..] Verificando base de datos..."
cd "$ROOT"
docker-compose up -d 2>/dev/null
echo "  [OK] Base de datos lista"

# ── Backend ───────────────────────────────────────────────────
echo "  [..] Iniciando backend en http://localhost:8000 ..."
cd "$BACKEND"
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
echo "  [OK] Backend PID: $BACKEND_PID"

sleep 2

# ── Frontend ──────────────────────────────────────────────────
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

# Mantener el script vivo mostrando los logs del backend
wait $BACKEND_PID
