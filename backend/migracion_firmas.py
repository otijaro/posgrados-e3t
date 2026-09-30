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

    # Agregar columna datos_formulario a solicitud si no existe (edicion con formulario precargado)
    try:
        conn.execute(text("ALTER TABLE solicitud ADD COLUMN IF NOT EXISTS datos_formulario TEXT;"))
        print("✅ datos_formulario en solicitud")
    except Exception as e:
        print(f"⚠️  {e}")

    # Agregar el valor 'REGISTRAR_TEMA' al ENUM tiposolicitud (antes 'Registrar Tema'
    # compartía por error el mismo código que 'CAMBIO_TITULO'). Postgres guarda el
    # NOMBRE de la constante de Python (mayúsculas), no su valor en minúscula.
    try:
        conn.execute(text("ALTER TYPE tiposolicitud ADD VALUE IF NOT EXISTS 'REGISTRAR_TEMA';"))
        conn.commit()
        print("✅ REGISTRAR_TEMA agregado al enum tiposolicitud")
    except Exception as e:
        conn.rollback()
        print(f"⚠️  {e}")

    # Reclasificar solicitudes viejas de Registrar Tema que quedaron guardadas
    # como CAMBIO_TITULO (bug anterior), usando el marcador confiable que
    # sí quedó guardado en datos_formulario.
    try:
        resultado = conn.execute(text(
            "UPDATE solicitud SET tipo_solicitud = 'REGISTRAR_TEMA' "
            "WHERE tipo_solicitud = 'CAMBIO_TITULO' "
            "AND datos_formulario LIKE '%\"tipo\": \"registrar_tema\"%'"
        ))
        conn.commit()
        if resultado.rowcount:
            print(f"✅ {resultado.rowcount} solicitud(es) de Registrar Tema reclasificadas correctamente")
    except Exception as e:
        conn.rollback()
        print(f"⚠️  {e}")

    # Tabla de votos individuales del Comité Asesor (mínimo 4 de 7 para
    # aprobar o rechazar una solicitud en comité).
    try:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS voto_comite (
                id SERIAL PRIMARY KEY,
                id_solicitud INTEGER NOT NULL REFERENCES solicitud(id),
                id_persona INTEGER NOT NULL REFERENCES persona(id),
                decision VARCHAR(20) NOT NULL,
                observaciones TEXT,
                fecha TIMESTAMP NOT NULL DEFAULT NOW(),
                UNIQUE(id_solicitud, id_persona)
            );
        """))
        conn.commit()
        print("✅ Tabla voto_comite lista")
    except Exception as e:
        conn.rollback()
        print(f"⚠️  {e}")

    conn.commit()
    print("\n✅ Migración completada")
