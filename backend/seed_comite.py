"""
Seed: crea/vincula a los 7 integrantes del Comité Asesor de Posgrados.
Corre automáticamente en cada arranque del backend (ver entrypoint.sh).
  python seed_comite.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import Persona, CatalogoRol, VinculacionActiva
from app.services.auth import hash_password
from sqlalchemy import or_

PASSWORD_DEFECTO = "comite123"

# (nombre completo, correo institucional a usar si hay que crearlo)
INTEGRANTES = [
    ("Rodolfo Villamizar",  "rvillamizar@uis.edu.co"),
    ("Maria Mantilla",      "mmantilla@uis.edu.co"),
    ("Hans Garcia",         "hgarcia@uis.edu.co"),
    ("Omar Tijaro",         "e3t.coord.posgrado@uis.edu.co"),  # ya existe: es el coordinador de pruebas
    ("Oscar Quiroga",       "oquiroga@uis.edu.co"),
    ("Franklin Sepulveda",  "fsepulveda@uis.edu.co"),
    ("Ivan Serna",          "iserna@uis.edu.co"),
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

    creados, vinculados = 0, 0

    for nombre, correo_defecto in INTEGRANTES:
        primer_apellido = nombre.split(" ")[-1]
        persona = db.query(Persona).filter(
            or_(
                Persona.nombre_completo.ilike(f"%{nombre}%"),
                Persona.nombre_completo.ilike(f"%{primer_apellido}%"),
                Persona.email_institucional == correo_defecto,
            )
        ).first()

        if not persona:
            persona = Persona(
                email_institucional=correo_defecto,
                nombre_completo=nombre,
                hashed_password=hash_password(PASSWORD_DEFECTO),
            )
            db.add(persona)
            db.flush()
            creados += 1
            print(f"  ✅ Creado: {nombre} ({correo_defecto})")
        else:
            # Si ya existe (ej. Omar Tijaro como coordinador), NO tocamos su
            # correo ni contraseña actuales — solo le agregamos el rol.
            print(f"  ⏭️  Ya existe: {persona.nombre_completo} ({persona.email_institucional})")

        ya_vinculado = db.query(VinculacionActiva).filter(
            VinculacionActiva.id_persona == persona.id,
            VinculacionActiva.id_rol == rol.id,
        ).first()

        if ya_vinculado:
            ya_vinculado.es_activo = 1
        else:
            db.add(VinculacionActiva(
                id_persona=persona.id,
                id_rol=rol.id,
                tipo_contexto="escuela",
                id_contexto=1,
                es_activo=1,
            ))
            vinculados += 1

    db.commit()
    print(f"\n🎉 Comité Asesor listo: {creados} persona(s) nueva(s), {vinculados} vinculación(es) nueva(s)")
    print(f"   Contraseña por defecto para los nuevos: {PASSWORD_DEFECTO}")

except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")
    import traceback; traceback.print_exc()
finally:
    db.close()
