"""
Seed: agrega los roles faltantes al catálogo.
  python seed_roles_completos.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.database import engine
from sqlalchemy import text

ROLES_NUEVOS = [
    ("estudiante",           "Estudiante"),
    ("evaluador",            "Evaluador de Trabajo de Grado"),
    ("rep_profesores",       "Comité Asesor — Representante de Profesores"),
    ("rep_grupo_inv",        "Comité Asesor — Representante Grupo de Investigación"),
    ("director_escuela",     "Comité Asesor — Director de Escuela"),
    ("coord_investigacion",  "Comité Asesor — Coordinador de Posgrados de Investigación"),
    ("coord_profundizacion", "Comité Asesor — Coordinador de Posgrados de Profundización"),
]

with engine.connect() as conn:
    # Ver columnas reales de la tabla
    cols = conn.execute(text("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'catalogo_rol'
        ORDER BY ordinal_position
    """)).fetchall()
    print("Columnas de catalogo_rol:", [c[0] for c in cols])

    creados = 0
    for codigo, nombre in ROLES_NUEVOS:
        existe = conn.execute(text(
            "SELECT id FROM catalogo_rol WHERE codigo = :codigo"
        ), {"codigo": codigo}).fetchone()

        if existe:
            print(f"  ⏭️  Ya existe: {nombre}")
            continue

        conn.execute(text("""
            INSERT INTO catalogo_rol (codigo, nombre)
            VALUES (:codigo, :nombre)
        """), {"codigo": codigo, "nombre": nombre})
        creados += 1
        print(f"  ✅ {nombre}")

    conn.commit()
    print(f"\n✅ {creados} roles creados")

    print("\nRoles en BD:")
    roles = conn.execute(text("SELECT id, codigo, nombre FROM catalogo_rol ORDER BY id")).fetchall()
    for r in roles:
        print(f"  [{r.id}] {r.codigo} | {r.nombre}")
