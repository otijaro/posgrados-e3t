"""
Limpia solicitudes con datos incorrectos (persona temporal o rutas de Windows).
Corre desde el backend:
  python limpiar_solicitudes.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import Solicitud, FlujoAprobacion

db = SessionLocal()

try:
    # Buscar solicitudes con datos incorrectos
    solicitudes_malas = db.query(Solicitud).filter(
        Solicitud.descripcion.like("%DOCTORADO%")        # rutas de Windows
        | Solicitud.descripcion.like("%:\\\\%")           # rutas tipo C:\ o D:\
        | Solicitud.solicitante.has(
            __import__("app.models", fromlist=["Persona"])
            .Persona.email_institucional == "temporal@uis.edu.co"
        )
    ).all()

    if not solicitudes_malas:
        print("✅ No se encontraron solicitudes con datos incorrectos.")
    else:
        print(f"🔍 Se encontraron {len(solicitudes_malas)} solicitudes a limpiar:\n")
        for s in solicitudes_malas:
            print(f"  - id={s.id} | {s.numero_radicado} | {s.asunto[:60]}")

        confirmar = input("\n¿Eliminar estas solicitudes? (s/n): ").strip().lower()
        if confirmar == "s":
            for s in solicitudes_malas:
                # Primero eliminar el flujo de aprobación relacionado
                db.query(FlujoAprobacion).filter(
                    FlujoAprobacion.id_solicitud == s.id
                ).delete()
                db.delete(s)
            db.commit()
            print(f"\n✅ {len(solicitudes_malas)} solicitudes eliminadas correctamente.")
        else:
            print("❌ Operación cancelada.")

except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")
    import traceback; traceback.print_exc()
finally:
    db.close()
