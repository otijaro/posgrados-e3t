"""
Diagnóstico: cuántos estudiantes hay y cuántos tienen proyecto.
  python diagnostico.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import Estudiante, ProyectoGrado

db = SessionLocal()

try:
    total = db.query(Estudiante).count()
    con_proyecto = db.query(Estudiante).join(
        ProyectoGrado, ProyectoGrado.id_estudiante == Estudiante.id
    ).count()
    sin_proyecto = total - con_proyecto

    print(f"\nTotal estudiantes en BD: {total}")
    print(f"Con proyecto:            {con_proyecto}")
    print(f"Sin proyecto:            {sin_proyecto}")

    print("\nEstudiantes sin proyecto:")
    sin = db.query(Estudiante).outerjoin(
        ProyectoGrado, ProyectoGrado.id_estudiante == Estudiante.id
    ).filter(ProyectoGrado.id == None).all()

    for e in sin[:10]:
        print(f"  id={e.id} | {e.persona.nombre_completo} | {e.codigo_estudiante}")

    if len(sin) > 10:
        print(f"  ... y {len(sin)-10} más")

finally:
    db.close()
