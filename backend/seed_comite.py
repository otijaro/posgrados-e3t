"""
Seed: vincula a los 7 integrantes reales del Comité Asesor de Posgrados
(ya existen como profesores, creados por seed_profesores_2026.py — aquí
solo se les agrega el rol "comite", sin tocar su contraseña ni datos).
Corre automáticamente en cada arranque del backend (ver entrypoint.sh).
  python seed_comite.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import Persona, CatalogoRol, VinculacionActiva
from sqlalchemy import or_

# (nombre para el log, correo real en seed_profesores_2026.py)
# Omar Tíjaro: su correo original es ojtijaro@uis.edu.co, pero seed_coordinador.py
# se lo cambia después a e3t.coord.posgrado@uis.edu.co — buscamos por AMBOS.
INTEGRANTES = [
    ("Rodolfo Villamizar",  ["rovillam@uis.edu.co"]),
    ("Maria Mantilla",      ["marialem@uis.edu.co"]),
    ("Hans Garcia",         ["hayegaar@uis.edu.co"]),
    ("Omar Tijaro",         ["ojtijaro@uis.edu.co", "e3t.coord.posgrado@uis.edu.co"]),
    ("Oscar Quiroga",       ["oquiroga@uis.edu.co"]),
    ("Franklin Sepulveda",  ["alexander.sepulveda@saber.uis.edu.co"]),
    ("Ivan Serna",          ["idsersua@uis.edu.co"]),
]

db = SessionLocal()

try:
    # 1. Rol "comite" en el catálogo
    rol = db.query(CatalogoRol).filter(CatalogoRol.codigo == "comite").first()
    if not rol:
        rol = CatalogoRol(
            codigo="comite",
            nombre="Comité Asesor de Posgrados",
            descripcion="Vota la aprobación final de las solicitudes que llegan al comité",
        )
        db.add(rol)
        db.flush()
        print(f"✅ Rol 'comite' creado (id={rol.id})")
    else:
        print(f"✅ Rol 'comite' ya existe (id={rol.id})")

    vinculados, no_encontrados = 0, 0

    for nombre, correos in INTEGRANTES:
        persona = db.query(Persona).filter(
            or_(*[Persona.email_institucional == c for c in correos])
        ).first()

        if not persona:
            print(f"  ⚠️  No encontrado: {nombre} (correos probados: {', '.join(correos)}) "
                  f"— ¿ya corrió seed_profesores_2026.py?")
            no_encontrados += 1
            continue

        ya_vinculado = db.query(VinculacionActiva).filter(
            VinculacionActiva.id_persona == persona.id,
            VinculacionActiva.id_rol == rol.id,
        ).first()

        if ya_vinculado:
            ya_vinculado.es_activo = 1
            print(f"  ✅ Ya vinculado: {persona.nombre_completo} ({persona.email_institucional})")
        else:
            db.add(VinculacionActiva(
                id_persona=persona.id,
                id_rol=rol.id,
                tipo_contexto="escuela",
                id_contexto=1,
                es_activo=1,
            ))
            vinculados += 1
            print(f"  ✅ Vinculado ahora: {persona.nombre_completo} ({persona.email_institucional})")

    db.commit()
    print(f"\n🎉 Comité Asesor listo: {vinculados} vinculación(es) nueva(s), {no_encontrados} no encontrado(s)")
    print(f"   (usan su contraseña normal de docente: uis2026)")

except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")
    import traceback; traceback.print_exc()
finally:
    db.close()
