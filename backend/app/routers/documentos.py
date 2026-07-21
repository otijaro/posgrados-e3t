"""
Router de documentos descargables — formatos y plantillas oficiales.
Coordinador: subir y eliminar.
Todos los roles: listar y descargar.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
import os, shutil

from app.database import get_db
from app.services.auth import get_current_user

router = APIRouter(prefix="/documentos", tags=["Documentos"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

DOCS_DIR = "uploads/documentos"
os.makedirs(DOCS_DIR, exist_ok=True)


def _es_coordinador(token: str, db: Session):
    persona = get_current_user(db, token)
    if not persona:
        raise HTTPException(status_code=401, detail="Token inválido")
    rol = db.execute(text("""
        SELECT cr.codigo FROM vinculacion_activa va
        JOIN catalogo_rol cr ON cr.id = va.id_rol
        WHERE va.id_persona = :id AND va.es_activo = 1
          AND cr.codigo IN ('coordinador', 'secretaria')
        LIMIT 1
    """), {"id": persona.id}).fetchone()
    if not rol:
        raise HTTPException(status_code=403, detail="Solo el coordinador puede realizar esta acción")
    return persona


# ── Crear tabla si no existe ──────────────────────────────────────────────────

def crear_tabla_documentos(db: Session):
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS documento_descargable (
            id           SERIAL PRIMARY KEY,
            nombre       VARCHAR(200) NOT NULL,
            descripcion  TEXT,
            categoria    VARCHAR(100) DEFAULT 'General',
            archivo_url  TEXT NOT NULL,
            nombre_archivo VARCHAR(200) NOT NULL,
            tamanio_kb   INTEGER,
            subido_por   INTEGER REFERENCES persona(id),
            created_at   TIMESTAMP DEFAULT NOW(),
            updated_at   TIMESTAMP DEFAULT NOW()
        )
    """))
    db.commit()


# ── GET listar documentos ─────────────────────────────────────────────────────

@router.get("/")
def listar_documentos(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    get_current_user(db, token)
    crear_tabla_documentos(db)

    rows = db.execute(text("""
        SELECT d.id, d.nombre, d.descripcion, d.categoria,
               d.archivo_url, d.nombre_archivo, d.tamanio_kb,
               d.created_at, p.nombre_completo AS subido_por
        FROM documento_descargable d
        LEFT JOIN persona p ON p.id = d.subido_por
        ORDER BY d.categoria, d.nombre
    """)).fetchall()

    return [
        {
            "id":             r.id,
            "nombre":         r.nombre,
            "descripcion":    r.descripcion,
            "categoria":      r.categoria,
            "archivo_url":    r.archivo_url,
            "nombre_archivo": r.nombre_archivo,
            "tamanio_kb":     r.tamanio_kb,
            "created_at":     str(r.created_at)[:10] if r.created_at else None,
            "subido_por":     r.subido_por,
        }
        for r in rows
    ]


# ── POST subir documento ──────────────────────────────────────────────────────

@router.post("/", status_code=201)
async def subir_documento(
    nombre:      str = Form(...),
    descripcion: str = Form(""),
    categoria:   str = Form("General"),
    archivo: UploadFile = File(...),
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    coordinador = _es_coordinador(token, db)
    crear_tabla_documentos(db)

    # Validar extensión
    ext = os.path.splitext(archivo.filename)[1].lower()
    if ext not in (".pdf", ".docx", ".doc", ".xlsx", ".xls"):
        raise HTTPException(status_code=400, detail="Solo PDF, Word o Excel")

    # Guardar archivo
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    nombre_archivo = f"{timestamp}_{archivo.filename}"
    filepath = os.path.join(DOCS_DIR, nombre_archivo)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(archivo.file, f)

    tamanio_kb = os.path.getsize(filepath) // 1024
    url = f"/uploads/documentos/{nombre_archivo}"

    db.execute(text("""
        INSERT INTO documento_descargable
        (nombre, descripcion, categoria, archivo_url, nombre_archivo, tamanio_kb, subido_por)
        VALUES (:nombre, :desc, :cat, :url, :narch, :tam, :quien)
    """), {
        "nombre": nombre, "desc": descripcion, "cat": categoria,
        "url": url, "narch": nombre_archivo, "tam": tamanio_kb,
        "quien": coordinador.id
    })
    db.commit()
    return {"mensaje": "Documento subido correctamente", "url": url}


# ── DELETE eliminar documento ─────────────────────────────────────────────────

@router.delete("/{doc_id}")
def eliminar_documento(
    doc_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    _es_coordinador(token, db)

    row = db.execute(text("""
        SELECT archivo_url, nombre_archivo FROM documento_descargable WHERE id = :id
    """), {"id": doc_id}).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    # Eliminar archivo físico
    filepath = os.path.join(DOCS_DIR, row.nombre_archivo)
    if os.path.exists(filepath):
        os.remove(filepath)

    db.execute(text("DELETE FROM documento_descargable WHERE id = :id"), {"id": doc_id})
    db.commit()
    return {"mensaje": "Documento eliminado"}
