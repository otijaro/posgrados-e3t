"""
Convierte nombres de formato "Apellido1 Apellido2 Nombre1 Nombre2"
a "Nombre1 Nombre2 Apellido1 Apellido2" para todos los profesores.

Heurística: los últimos 2 tokens son el nombre, los primeros son apellidos.
Si solo hay 2 tokens, se invierten directamente.
Si hay 3 tokens, el último es nombre y los 2 primeros son apellidos.
Si hay 4+ tokens, los últimos 2 son nombre y los primeros son apellidos.

  python corregir_nombres.py
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
        # "Apellido Nombre" → "Nombre Apellido"
        return f"{partes[1]} {partes[0]}"
    elif len(partes) == 3:
        # "Apellido1 Apellido2 Nombre" → "Nombre Apellido1 Apellido2"
        return f"{partes[2]} {partes[0]} {partes[1]}"
    else:
        # "Apellido1 Apellido2 Nombre1 Nombre2" → "Nombre1 Nombre2 Apellido1 Apellido2"
        mitad = len(partes) // 2
        apellidos = partes[:mitad]
        nombres   = partes[mitad:]
        return f"{' '.join(nombres)} {' '.join(apellidos)}"


with engine.connect() as conn:
    # Solo actualizar personas con rol de docente/profesor (no estudiantes ni coordinador)
    rows = conn.execute(text("""
        SELECT DISTINCT p.id, p.nombre_completo
        FROM persona p
        JOIN vinculacion_activa va ON va.id_persona = p.id AND va.es_activo = 1
        JOIN catalogo_rol cr ON cr.id = va.id_rol
        WHERE cr.codigo IN ('director', 'codirector', 'docente', 'coordinador_grupo',
                            'prof_catedra', 'prof_planta', 'evaluador')
        ORDER BY p.nombre_completo
    """)).fetchall()

    print(f"Procesando {len(rows)} docentes...\n")
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
