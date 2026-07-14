"""
Seed para asignar contraseña y rol de director a Juan Manuel Rey López (id=3).
Corre una sola vez desde el backend:
  python seed_director.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import Persona, CatalogoRol, VinculacionActiva
from app.services.auth import hash_password

db = SessionLocal()

try:
    # 1. Buscar la persona
    director = db.query(Persona).filter(
        Persona.nombre_completo.ilike("%Juan Manuel Rey%")
    ).first()

    if not director:
        print("❌ No se encontró a Juan Manuel Rey López en la BD")
        print("   Personas disponibles:")
        for p in db.query(Persona).all():
            print(f"   - id={p.id} | {p.nombre_completo} | {p.email_institucional}")
        sys.exit(1)

    print(f"✅ Director encontrado: {director.nombre_completo} (id={director.id})")

    # 2. Asignar email institucional si no tiene
    if not director.email_institucional or "@" not in (director.email_institucional or ""):
        director.email_institucional = "juan.rey@uis.edu.co"
        print(f"   📧 Email asignado: {director.email_institucional}")
    else:
        print(f"   📧 Email actual: {director.email_institucional}")

    # 3. Asignar contraseña
    director.hashed_password = hash_password("director123")
    print("   🔑 Contraseña asignada: director123")

    # 4. Buscar el rol de director
    rol_director = db.query(CatalogoRol).filter(
        CatalogoRol.codigo.in_(["director", "Director de Trabajo de Grado"])
    ).first()

    if not rol_director:
        # Crear el rol si no existe con ese código exacto
        rol_director = db.query(CatalogoRol).filter(
            CatalogoRol.nombre.ilike("%director%")
        ).first()

    if not rol_director:
        print("❌ No se encontró el rol de director. Roles disponibles:")
        for r in db.query(CatalogoRol).all():
            print(f"   - id={r.id} | codigo={r.codigo} | {r.nombre}")
        sys.exit(1)

    print(f"✅ Rol encontrado: {rol_director.nombre} (id={rol_director.id})")

    # 5. Verificar si ya tiene la vinculación
    vinculacion_existente = db.query(VinculacionActiva).filter(
        VinculacionActiva.id_persona == director.id,
        VinculacionActiva.id_rol == rol_director.id,
    ).first()

    if vinculacion_existente:
        vinculacion_existente.es_activo = 1
        print("   ✅ Vinculación de rol ya existía, activada")
    else:
        nueva_vinculacion = VinculacionActiva(
            id_persona=director.id,
            id_rol=rol_director.id,
            es_activo=1,
        )
        db.add(nueva_vinculacion)
        print("   ✅ Vinculación de rol creada")

    db.commit()
    print()
    print("🎉 Director listo para iniciar sesión:")
    print(f"   Email:      {director.email_institucional}")
    print(f"   Contraseña: director123")

except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
