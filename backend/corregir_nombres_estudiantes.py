"""
Convierte nombres de estudiantes de formato "Apellido1 Apellido2 Nombre1 Nombre2"
a "Nombre1 Nombre2 Apellido1 Apellido2" — mismo criterio que corregir_nombres.py,
pero para estudiantes (que esa vez se quedaron sin corregir).

  python corregir_nombres_estudiantes.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.database import engine
from sqlalchemy import text


def invertir_nombre(nombre_completo: str) -> str:
    partes = nombre_completo.strip().split()
    if len(partes) <= 1:
        return nombre_completo
    elif len(partes) == 2:
        return f"{partes[1]} {partes[0]}"
    elif len(partes) == 3:
        return f"{partes[2]} {partes[0]} {partes[1]}"
    else:
        mitad = len(partes) // 2
        apellidos = partes[:mitad]
        nombres   = partes[mitad:]
        return f"{' '.join(nombres)} {' '.join(apellidos)}"


with engine.connect() as conn:
    rows = conn.execute(text("""
        SELECT DISTINCT p.id, p.nombre_completo
        FROM persona p
        JOIN estudiante e ON e.id_persona = p.id
        ORDER BY p.nombre_completo
    """)).fetchall()

    print(f"Procesando {len(rows)} estudiantes...\n")
    actualizados = 0

    for r in rows:
        nuevo = invertir_nombre(r.nombre_completo)
        if nuevo != r.nombre_completo:
            conn.execute(text(
                "UPDATE persona SET nombre_completo = :nuevo WHERE id = :id"
            ), {"nuevo": nuevo, "id": r.id})
            print(f"  {r.nombre_completo:45s} → {nuevo}")
            actualizados += 1

    conn.commit()
    print(f"\n✅ {actualizados} nombres actualizados")
