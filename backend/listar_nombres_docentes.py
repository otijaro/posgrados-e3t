"""
Lista los nombres de docentes/directores para revisar cuáles quedaron
en orden "Apellido Nombre" en vez de "Nombre Apellido".
Solo lectura — no modifica nada.

  python listar_nombres_docentes.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    rows = conn.execute(text("""
        SELECT DISTINCT p.id, p.nombre_completo
        FROM persona p
        JOIN vinculacion_activa va ON va.id_persona = p.id AND va.es_activo = 1
        JOIN catalogo_rol cr ON cr.id = va.id_rol
        WHERE cr.codigo IN ('director', 'codirector', 'docente', 'coordinador_grupo',
                            'prof_catedra', 'prof_planta', 'evaluador')
        ORDER BY p.nombre_completo
    """)).fetchall()

    print(f"\n{len(rows)} docentes con rol activo:\n")
    for r in rows:
        print(f"  [{r.id:4d}] {r.nombre_completo}")

    # También los que fueron creados "al vuelo" como directores (sin rol asignado)
    # y por tanto nunca pasaron por ninguno de los dos scripts de corrección.
    rows2 = conn.execute(text("""
        SELECT DISTINCT p.id, p.nombre_completo
        FROM persona p
        JOIN proyecto_grado pg ON pg.id_director = p.id
        WHERE p.id NOT IN (
            SELECT id_persona FROM vinculacion_activa WHERE es_activo = 1
        )
        AND p.id NOT IN (
            SELECT id_persona FROM estudiante
        )
        ORDER BY p.nombre_completo
    """)).fetchall()

    print(f"\n{len(rows2)} directores SIN rol asignado (creados al vuelo, nunca corregidos):\n")
    for r in rows2:
        print(f"  [{r.id:4d}] {r.nombre_completo}")
