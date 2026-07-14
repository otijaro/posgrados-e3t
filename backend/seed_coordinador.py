"""
Seed para asignar contraseña y rol de coordinador a Omar Javier Tíjaro Rojas.
Si no existe, lo crea. Corre una sola vez:
  python seed_coordinador.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import Persona, CatalogoRol, VinculacionActiva
from app.services.auth import hash_password

db = SessionLocal()

try:
    # 1. Buscar o crear el coordinador
    coordinador = db.query(Persona).filter(
        Persona.nombre_completo.ilike("%tijaro%")
    ).first()

    if not coordinador:
        coordinador = Persona(
            email_institucional="omar.tijaro@uis.edu.co",
            nombre_completo="Omar Javier Tíjaro Rojas",
            hashed_password=hash_password("coordinador123"),
        )
        db.add(coordinador)
        db.flush()
        print(f"✅ Coordinador creado: {coordinador.nombre_completo} (id={coordinador.id})")
    else:
        coordinador.hashed_password = hash_password("coordinador123")
        if not coordinador.email_institucional or "@" not in (coordinador.email_institucional or ""):
            coordinador.email_institucional = "omar.tijaro@uis.edu.co"
        print(f"✅ Coordinador encontrado: {coordinador.nombre_completo} (id={coordinador.id})")
        print(f"   📧 Email: {coordinador.email_institucional}")

    # 2. Buscar rol de coordinador
    rol = db.query(CatalogoRol).filter(
        CatalogoRol.codigo.ilike("%coordinador%")
    ).first()

    if not rol:
        rol = CatalogoRol(
            codigo="coordinador",
            nombre="Coordinador de Posgrados",
            descripcion="Gestiona solicitudes, estudiantes y docentes del programa",
        )
        db.add(rol)
        db.flush()
        print(f"✅ Rol creado: {rol.nombre}")
    else:
        print(f"✅ Rol encontrado: {rol.nombre} (id={rol.id})")

    # 3. Vincular rol
    vinculacion = db.query(VinculacionActiva).filter(
        VinculacionActiva.id_persona == coordinador.id,
        VinculacionActiva.id_rol == rol.id,
    ).first()

    if vinculacion:
        vinculacion.es_activo = 1
        print("   ✅ Vinculación activada")
    else:
        db.add(VinculacionActiva(
            id_persona=coordinador.id,
            id_rol=rol.id,
            tipo_contexto="escuela",
            id_contexto=1,
            es_activo=1,
        ))
        print("   ✅ Vinculación creada")

    db.commit()
    print()
    print("🎉 Coordinador listo:")
    print(f"   Email:      {coordinador.email_institucional}")
    print(f"   Contraseña: coordinador123")

except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")
    import traceback; traceback.print_exc()
finally:
    db.close()
