"""
Migración: agrega firma_imagen a persona, crea tabla documento_firma con estados en cadena.
  python migracion_firmas.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE persona ADD COLUMN IF NOT EXISTS firma_imagen TEXT;"))
        print("✅ firma_imagen en persona")
    except Exception as e:
        print(f"⚠️  {e}")

    try:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS documento_firma (
                id              SERIAL PRIMARY KEY,
                id_solicitud    INTEGER NOT NULL REFERENCES solicitud(id) ON DELETE CASCADE,
                pdf_url         TEXT NOT NULL,
                estado          VARCHAR(50) NOT NULL DEFAULT 'pendiente_director',
                orden_actual    INTEGER NOT NULL DEFAULT 1,

                firmado_estudiante   BOOLEAN DEFAULT FALSE,
                pdf_tras_estudiante  TEXT,
                fecha_firma_est      TIMESTAMP,

                firmado_director     BOOLEAN DEFAULT FALSE,
                pdf_tras_director    TEXT,
                fecha_firma_dir      TIMESTAMP,

                firmado_dir_grupo    BOOLEAN DEFAULT FALSE,
                pdf_tras_dir_grupo   TEXT,
                fecha_firma_dir_grp  TIMESTAMP,

                firmado_coordinador  BOOLEAN DEFAULT FALSE,
                pdf_tras_coordinador TEXT,
                fecha_firma_coord    TIMESTAMP,

                created_at      TIMESTAMP DEFAULT NOW(),
                updated_at      TIMESTAMP DEFAULT NOW()
            );
        """))
        print("✅ Tabla documento_firma creada/verificada")
    except Exception as e:
        print(f"⚠️  {e}")

    # Agregar columna documento_url a solicitud si no existe
    try:
        conn.execute(text("ALTER TABLE solicitud ADD COLUMN IF NOT EXISTS documento_url TEXT;"))
        print("✅ documento_url en solicitud")
    except Exception as e:
        print(f"⚠️  {e}")

    # Agregar columna foto_url a persona si no existe (foto de perfil)
    try:
        conn.execute(text("ALTER TABLE persona ADD COLUMN IF NOT EXISTS foto_url VARCHAR(500);"))
        print("✅ foto_url en persona")
    except Exception as e:
        print(f"⚠️  {e}")

    conn.commit()
    print("\n✅ Migración completada")
