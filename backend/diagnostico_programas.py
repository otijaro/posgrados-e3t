"""
Diagnóstico: qué programas existen y cuántos estudiantes tiene cada uno.
  python diagnostico_programas.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import ProgramaPosgrado, Estudiante

db = SessionLocal()

try:
    programas = db.query(ProgramaPosgrado).all()
    print(f"\nTotal programas: {len(programas)}\n")
    print(f"{'ID':<4} {'NOMBRE':<60} {'NIVEL':<12} {'ESTUDIANTES'}")
    print("="*90)
    for p in programas:
        count = db.query(Estudiante).filter(Estudiante.id_programa == p.id).count()
        print(f"{p.id:<4} {p.nombre:<60} {str(p.nivel.value) if p.nivel else '—':<12} {count}")
finally:
    db.close()
