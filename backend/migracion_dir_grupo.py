"""
Migración: agrega id_director a grupo_investigacion y actualiza tabla documento_firma.
  python migracion_dir_grupo.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Agregar id_director a grupo_investigacion
    try:
        conn.execute(text("""
            ALTER TABLE grupo_investigacion
            ADD COLUMN IF NOT EXISTS id_director INTEGER REFERENCES persona(id);
        """))
        print("✅ id_director agregado a grupo_investigacion")
    except Exception as e:
        print(f"⚠️  {e}")

    # Actualizar estados de documento_firma para incluir dir_grupo
    try:
        conn.execute(text("""
            ALTER TABLE documento_firma
            ALTER COLUMN estado TYPE VARCHAR(50);
        """))
        print("✅ estado ampliado en documento_firma")
    except Exception as e:
        print(f"⚠️  {e}")

    conn.commit()
    print("\n✅ Migración completada")
    
    # Mostrar grupos actuales
    grupos = conn.execute(text("SELECT id, nombre, id_director FROM grupo_investigacion")).fetchall()
    print(f"\nGrupos de investigación ({len(grupos)}):")
    for g in grupos:
        print(f"  [{g.id}] {g.nombre} — director: {g.id_director or 'No asignado'}")
