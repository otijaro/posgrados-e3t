"""
Muestra todos los usuarios registrados y si pueden hacer login.
Corre desde el backend:
  python ver_usuarios.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import Persona, VinculacionActiva, CatalogoRol

db = SessionLocal()

try:
    personas = db.query(Persona).order_by(Persona.id).all()

    print("=" * 80)
    print(f"{'ID':<4} {'EMAIL':<35} {'NOMBRE':<28} {'LOGIN':<6} {'ROLES'}")
    print("=" * 80)

    for p in personas:
        puede_login = "✅" if p.hashed_password else "❌"

        roles = (
            db.query(CatalogoRol.nombre)
            .join(VinculacionActiva, VinculacionActiva.id_rol == CatalogoRol.id)
            .filter(
                VinculacionActiva.id_persona == p.id,
                VinculacionActiva.es_activo == 1
            )
            .all()
        )
        roles_str = ", ".join(r[0] for r in roles) if roles else "Sin rol asignado"
        email  = p.email_institucional or "Sin email"
        nombre = (p.nombre_completo or "Sin nombre")[:28]

        print(f"{p.id:<4} {email:<35} {nombre:<28} {puede_login:<6} {roles_str}")

    print("=" * 80)
    con_login = sum(1 for p in personas if p.hashed_password)
    sin_login = len(personas) - con_login
    print(f"\nTotal: {len(personas)} personas  |  Con login: {con_login} ✅  |  Sin login: {sin_login} ❌")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback; traceback.print_exc()
finally:
    db.close()
