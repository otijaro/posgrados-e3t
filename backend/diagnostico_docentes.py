"""
Prueba el endpoint de docentes directamente sin FastAPI.
  python diagnostico_docentes.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.database import engine, SessionLocal
from app.routers.coordinador import listar_docentes
from sqlalchemy import text

# Probar la query directamente
db = SessionLocal()
try:
    from app.routers.coordinador import QUERY_IDS_DOCENTES
    print("=== Query IDs docentes ===")
    rows = db.execute(text(QUERY_IDS_DOCENTES)).fetchall()
    print(f"Total IDs: {len(rows)}")
    print(f"Primeros 5: {[r[0] for r in rows[:5]]}")
except Exception as e:
    print(f"ERROR en query: {e}")
    import traceback; traceback.print_exc()
finally:
    db.close()
