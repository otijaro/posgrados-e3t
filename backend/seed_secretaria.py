"""
Crea el rol de secretaria y lo asigna a Sonia Stella Serrano Garcia.
  python seed_secretaria.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import Persona, CatalogoRol, VinculacionActiva

db = SessionLocal()

try:
    # 1. Buscar a Sonia
    sonia = db.query(Persona).filter(
        Persona.email_institucional == "secre3t1@uis.edu.co"
    ).first()

    if not sonia:
        sonia = db.query(Persona).filter(
            Persona.nombre_completo.ilike("%Sonia%Serrano%")
        ).first()

    if not sonia:
        print("❌ No se encontró a Sonia Stella Serrano Garcia")
        exit(1)

    print(f"✅ Persona encontrada: {sonia.nombre_completo} (id={sonia.id})")
    print(f"   Email: {sonia.email_institucional}")

    # 2. Crear rol secretaria si no existe
    rol = db.query(CatalogoRol).filter(CatalogoRol.codigo == "secretaria").first()
    if not rol:
        rol = CatalogoRol(
            codigo="secretaria",
            nombre="Secretaria",
            descripcion="Acceso completo similar al coordinador para gestión administrativa",
        )
        db.add(rol)
        db.flush()
        print(f"✅ Rol creado: {rol.nombre}")
    else:
        print(f"✅ Rol encontrado: {rol.nombre} (id={rol.id})")

    # 3. Vincular
    v = db.query(VinculacionActiva).filter(
        VinculacionActiva.id_persona == sonia.id,
        VinculacionActiva.id_rol == rol.id,
    ).first()

    if v:
        v.es_activo = 1
        print("   ✅ Vinculación ya existía, activada")
    else:
        db.add(VinculacionActiva(
            id_persona=sonia.id,
            id_rol=rol.id,
            tipo_contexto="escuela",
            id_contexto=1,
            es_activo=1,
        ))
        print("   ✅ Vinculación creada")

    db.commit()
    print()
    print("🎉 Secretaria lista:")
    print(f"   Email:      {sonia.email_institucional}")
    print(f"   Contraseña: uis2026")

except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")
    import traceback; traceback.print_exc()
finally:
    db.close()
