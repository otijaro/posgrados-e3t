"""
Seed: carga los grupos de investigación de la E3T.
  python seed_grupos.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.database import engine
from sqlalchemy import text

GRUPOS = [
    ("GISEL",    "GISEL",                                        "https://uis.edu.co/ffm-gruinv-gisel-es/"),
    ("RADIOGIS", "RadioGis",                                     "https://uis.edu.co/ffm-gruinv-radiogis-es/"),
    ("CPS",      "CPS",                                          "https://uis.edu.co/ffm-gruinv-cps-es/"),
    ("ONCHIP",   "OnChip",                                       "https://uis.edu.co/ffm-gruinv-cidic-es/"),
    ("CEMOS",    "CEMOS",                                        "https://uis.edu.co/ffm-gruinv-cemos-es/"),
    ("HDSP",     "HDSP",                                         "https://uis.edu.co/ffm-gruinv-hdsp-es/"),
    ("GOTS",     "GOTS",                                         "https://uis.edu.co/fc-gruinv-gots-es/"),
    ("INNOTEC",  "INNOTEC",                                      "https://uis.edu.co/ffm-gruinv-innotec-es/"),
    ("GEOM",     "Geomática, gestión y optimización de sistemas", "https://uis.edu.co/ffm-gruinv-geomatica-es/"),
    ("CIDES",    "CIDES",                                        "https://uis.edu.co/ffq-gruinv-cides-es/"),
]

with engine.connect() as conn:
    escuela = conn.execute(text(
        "SELECT id FROM escuela WHERE codigo = 'E3T' LIMIT 1"
    )).fetchone()

    if not escuela:
        print("❌ Escuela E3T no encontrada. Corra setup primero.")
        exit(1)

    id_escuela = escuela[0]

    # Limpiar grupos anteriores incorrectos
    conn.execute(text("DELETE FROM grupo_investigacion WHERE id_escuela = :id"), {"id": id_escuela})
    conn.commit()

    creados = 0
    for codigo, nombre, url in GRUPOS:
        conn.execute(text("""
            INSERT INTO grupo_investigacion (nombre, codigo_minciencias, id_escuela, descripcion, activo)
            VALUES (:nombre, :codigo, :escuela, :url, 1)
        """), {"nombre": nombre, "codigo": codigo, "escuela": id_escuela, "url": url})
        creados += 1
        print(f"  ✅ {nombre}")

    conn.commit()
    print(f"\n✅ {creados} grupos creados")
