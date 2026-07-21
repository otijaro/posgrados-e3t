"""
Seed: carga los documentos iniciales en la tabla documento_descargable.
Carga el formulario de inscripción de tema desde assets/.
  python seed_documentos.py
"""
import sys, os, shutil
sys.path.insert(0, os.path.dirname(__file__))
from app.database import engine
from sqlalchemy import text
from datetime import datetime

# Carpeta destino
DOCS_DIR = "uploads/documentos"
os.makedirs(DOCS_DIR, exist_ok=True)

DOCUMENTOS_INICIALES = [
    {
        "nombre":       "Formulario de Inscripción de Tema",
        "descripcion":  "Formato oficial UIS para el registro del tema del trabajo de grado. Debe ser diligenciado y firmado por el estudiante y el director.",
        "categoria":    "Registro de Tema",
        "archivo_src":  "assets/formulario_tema_template.docx",
        "nombre_archivo": "formulario_inscripcion_tema.docx",
    },
]

with engine.connect() as conn:
    # Crear tabla si no existe
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS documento_descargable (
            id             SERIAL PRIMARY KEY,
            nombre         VARCHAR(200) NOT NULL,
            descripcion    TEXT,
            categoria      VARCHAR(100) DEFAULT 'General',
            archivo_url    TEXT NOT NULL,
            nombre_archivo VARCHAR(200) NOT NULL,
            tamanio_kb     INTEGER,
            subido_por     INTEGER REFERENCES persona(id),
            created_at     TIMESTAMP DEFAULT NOW(),
            updated_at     TIMESTAMP DEFAULT NOW()
        )
    """))
    conn.commit()

    for doc in DOCUMENTOS_INICIALES:
        # Verificar si ya existe
        existe = conn.execute(text(
            "SELECT id FROM documento_descargable WHERE nombre = :nombre"
        ), {"nombre": doc["nombre"]}).fetchone()

        if existe:
            print(f"  ⏭️  Ya existe: {doc['nombre']}")
            continue

        # Copiar archivo a uploads/documentos/
        src = os.path.join(os.path.dirname(__file__), doc["archivo_src"])
        if not os.path.exists(src):
            print(f"  ❌ Archivo no encontrado: {src}")
            continue

        dst = os.path.join(DOCS_DIR, doc["nombre_archivo"])
        shutil.copy2(src, dst)
        tamanio_kb = os.path.getsize(dst) // 1024
        url = f"/uploads/documentos/{doc['nombre_archivo']}"

        conn.execute(text("""
            INSERT INTO documento_descargable
            (nombre, descripcion, categoria, archivo_url, nombre_archivo, tamanio_kb)
            VALUES (:nombre, :desc, :cat, :url, :narch, :tam)
        """), {
            "nombre": doc["nombre"],
            "desc":   doc["descripcion"],
            "cat":    doc["categoria"],
            "url":    url,
            "narch":  doc["nombre_archivo"],
            "tam":    tamanio_kb,
        })
        conn.commit()
        print(f"  ✅ Cargado: {doc['nombre']} ({tamanio_kb} KB)")

print("\n✅ Seed de documentos completado")
