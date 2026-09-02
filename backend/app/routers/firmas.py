"""
Router de firmas: flujo en cadena estudiante → director → dir_grupo → coordinador.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from datetime import datetime, date
import os, shutil, base64

from app.database import get_db
from app.models import Persona, Solicitud, Estudiante
from app.services.auth import get_current_user
from app.services.generar_pdf import generar_pdf_tema

router = APIRouter(prefix="/firmas", tags=["Firmas"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

UPLOAD_DIR = "uploads"
FIRMAS_DIR = os.path.join(UPLOAD_DIR, "firmas")
PDFS_DIR   = os.path.join(UPLOAD_DIR, "pdfs_firmados")
os.makedirs(FIRMAS_DIR, exist_ok=True)
os.makedirs(PDFS_DIR,   exist_ok=True)


# ── Modelos Pydantic ──────────────────────────────────────────────────────────

class DatosFormularioTema(BaseModel):
    titulo:               str = ""
    programa:             str = ""
    autor:                str = ""
    codigo:               str = ""
    director:             str = ""
    codirector:           str = ""
    codirector_cargo:     str = ""
    codirector_entidad:   str = ""
    linea_estrategica:    str = ""
    grupo_investigacion:  str = ""
    area_formacion:       str = ""
    objetivo_general:     str = ""
    descripcion_alcances: str = ""

class GuardarFirmadoBody(BaseModel):
    id_solicitud: int
    pdf_base64:   str
    rol_firmante: str  # "estudiante" | "director" | "dir_grupo" | "coordinador"


# ── Firma del perfil ──────────────────────────────────────────────────────────

@router.post("/mi-firma")
async def guardar_mi_firma(
    firma: UploadFile = File(...),
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    persona = get_current_user(db, token)
    if not persona:
        raise HTTPException(status_code=401, detail="Token inválido")
    if not firma.filename.lower().endswith((".png", ".jpg", ".jpeg")):
        raise HTTPException(status_code=400, detail="Solo PNG o JPG")
    filename = f"firma_{persona.id}.png"
    with open(os.path.join(FIRMAS_DIR, filename), "wb") as f:
        shutil.copyfileobj(firma.file, f)
    url = f"/uploads/firmas/{filename}"
    db.execute(text("UPDATE persona SET firma_imagen = :url WHERE id = :id"),
               {"url": url, "id": persona.id})
    db.commit()
    return {"mensaje": "Firma guardada", "url": url}


@router.get("/mi-firma")
def obtener_mi_firma(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    persona = get_current_user(db, token)
    if not persona:
        raise HTTPException(status_code=401, detail="Token inválido")
    row = db.execute(
        text("SELECT firma_imagen FROM persona WHERE id = :id"), {"id": persona.id}
    ).fetchone()
    return {"firma_url": row[0] if row else None}


# ── Generar PDF ───────────────────────────────────────────────────────────────

@router.post("/generar-pdf-tema-completo")
async def generar_pdf_tema_completo(
    datos: DatosFormularioTema,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    persona = get_current_user(db, token)
    if not persona:
        raise HTTPException(status_code=401, detail="Token inválido")
    hoy     = date.today()
    payload = datos.dict()
    payload.setdefault("anio", str(hoy.year))
    payload.setdefault("mes",  f"{hoy.month:02d}")
    payload.setdefault("dia",  f"{hoy.day:02d}")
    try:
        return {"pdf_base64": base64.b64encode(generar_pdf_tema(payload)).decode()}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"Template no encontrado: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando PDF: {e}")


# ── Obtener PDF de solicitud ──────────────────────────────────────────────────

@router.get("/pdf-solicitud/{id_solicitud}")
def obtener_pdf_solicitud(
    id_solicitud: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    get_current_user(db, token)

    # Buscar el PDF más reciente en documento_firma
    row = db.execute(
        text("SELECT pdf_url FROM documento_firma WHERE id_solicitud = :id ORDER BY updated_at DESC LIMIT 1"),
        {"id": id_solicitud}
    ).fetchone()

    if not row:
        # Fallback: URL guardada directamente en la solicitud (columna real: documentos_adjuntos)
        sol = db.execute(
            text("SELECT documentos_adjuntos FROM solicitud WHERE id = :id"),
            {"id": id_solicitud}
        ).fetchone()
        if not sol or not sol[0]:
            raise HTTPException(status_code=404, detail="No hay PDF para esta solicitud")
        pdf_path = sol[0].lstrip("/")
    else:
        pdf_path = row[0].lstrip("/")

    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail=f"Archivo no encontrado: {pdf_path}")

    with open(pdf_path, "rb") as f:
        return {"pdf_base64": base64.b64encode(f.read()).decode(), "url": pdf_path}


# ── Guardar PDF firmado y avanzar flujo ───────────────────────────────────────

@router.post("/guardar-firmado")
async def guardar_pdf_firmado(
    body: GuardarFirmadoBody,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    persona = get_current_user(db, token)
    if not persona:
        raise HTTPException(status_code=401, detail="Token inválido")

    # Guardar PDF en disco
    pdf_bytes = base64.b64decode(body.pdf_base64)
    filename  = f"tema_{body.id_solicitud}_{body.rol_firmante}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    filepath  = os.path.join(PDFS_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(pdf_bytes)
    url = f"/uploads/pdfs_firmados/{filename}"

    orden_map = {
        "estudiante":  (1, "firmado_estudiante",  "pdf_tras_estudiante",  "fecha_firma_est"),
        "director":    (2, "firmado_director",     "pdf_tras_director",    "fecha_firma_dir"),
        "dir_grupo":   (3, "firmado_dir_grupo",    "pdf_tras_dir_grupo",   "fecha_firma_dir_grp"),
        "coordinador": (4, "firmado_coordinador",  "pdf_tras_coordinador", "fecha_firma_coord"),
    }
    if body.rol_firmante not in orden_map:
        raise HTTPException(status_code=400, detail="Rol firmante inválido")

    orden, col_bool, col_pdf, col_fecha = orden_map[body.rol_firmante]

    # Determinar siguiente estado según el orden actual
    # Si no hay grupo de investigación asignado al proyecto, saltar dir_grupo
    siguiente_estado = _siguiente_estado(db, body.id_solicitud, orden)
    now = datetime.utcnow()

    existing = db.execute(
        text("SELECT id FROM documento_firma WHERE id_solicitud = :id"),
        {"id": body.id_solicitud}
    ).fetchone()

    if not existing:
        db.execute(text(f"""
            INSERT INTO documento_firma
            (id_solicitud, pdf_url, estado, orden_actual,
             {col_bool}, {col_pdf}, {col_fecha})
            VALUES (:sol, :url, :est, :ord, TRUE, :purl, :fecha)
        """), {"sol": body.id_solicitud, "url": url, "est": siguiente_estado,
               "ord": orden + 1, "purl": url, "fecha": now})
    else:
        db.execute(text(f"""
            UPDATE documento_firma
            SET {col_bool}=TRUE, {col_pdf}=:purl, {col_fecha}=:fecha,
                pdf_url=:url, orden_actual=:ord, estado=:est, updated_at=:now
            WHERE id_solicitud=:sol
        """), {"purl": url, "fecha": now, "url": url,
               "ord": orden + 1, "est": siguiente_estado,
               "now": now, "sol": body.id_solicitud})

    # Actualizar estado solicitud principal
    estado_solicitud = "aprobada" if siguiente_estado == "completado" else "en_revision"
    db.execute(
        text("UPDATE solicitud SET estado = :est WHERE id = :id"),
        {"est": estado_solicitud, "id": body.id_solicitud}
    )
    db.commit()

    siguiente_firmante = siguiente_estado.replace("pendiente_", "") if siguiente_estado != "completado" else "completado"
    return {"mensaje": f"Firmado por {body.rol_firmante}", "url": url, "siguiente": siguiente_firmante}


def _siguiente_estado(db: Session, id_solicitud: int, orden_actual: int) -> str:
    """
    Determina el siguiente estado en la cadena.
    Si el proyecto no tiene grupo de investigación con director asignado,
    salta directamente al coordinador.
    """
    if orden_actual >= 4:
        return "completado"

    if orden_actual == 2:  # Acaba de firmar el director, sigue dir_grupo
        # Verificar si el proyecto tiene grupo con director asignado
        row = db.execute(text("""
            SELECT gi.id_director
            FROM solicitud s
            JOIN persona p ON p.id = s.id_solicitante
            JOIN estudiante e ON e.id_persona = p.id
            JOIN proyecto_grado pg ON pg.id_estudiante = e.id
            JOIN grupo_investigacion gi ON gi.id = pg.id_grupo_inv
            WHERE s.id = :id AND gi.id_director IS NOT NULL
        """), {"id": id_solicitud}).fetchone()

        if row:
            return "pendiente_dir_grupo"
        else:
            return "pendiente_coordinador"  # Saltar dir_grupo si no hay director de grupo

    estados = {1: "pendiente_director", 2: "pendiente_dir_grupo", 3: "pendiente_coordinador", 4: "completado"}
    return estados.get(orden_actual + 1, "completado")


# ── Solicitudes pendientes de firma por rol ───────────────────────────────────

@router.get("/pendientes/{rol}")
def solicitudes_pendientes_firma(
    rol: str,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    persona = get_current_user(db, token)
    if not persona:
        raise HTTPException(status_code=401, detail="Token inválido")

    estado_map = {
        "director":    "pendiente_director",
        "dir_grupo":   "pendiente_dir_grupo",
        "coordinador": "pendiente_coordinador",
    }
    if rol not in estado_map:
        raise HTTPException(status_code=400, detail="Rol inválido")

    # Para dir_grupo: filtrar solo las solicitudes donde este docente
    # es el director del grupo de investigación del proyecto
    if rol == "dir_grupo":
        rows = db.execute(text("""
            SELECT
                df.id_solicitud,
                df.pdf_url,
                df.estado,
                df.orden_actual,
                s.numero_radicado,
                s.asunto,
                s.fecha_creacion,
                p.nombre_completo  AS nombre_estudiante,
                e.codigo_estudiante,
                gi.nombre          AS grupo_investigacion
            FROM documento_firma df
            JOIN solicitud s ON s.id = df.id_solicitud
            JOIN persona p ON p.id = s.id_solicitante
            LEFT JOIN estudiante e ON e.id_persona = p.id
            LEFT JOIN proyecto_grado pg ON pg.id_estudiante = e.id
            LEFT JOIN grupo_investigacion gi ON gi.id = pg.id_grupo_inv
            WHERE df.estado = 'pendiente_dir_grupo'
              AND gi.id_director = :persona_id
            ORDER BY s.fecha_creacion DESC
        """), {"persona_id": persona.id}).fetchall()

    elif rol == "director":
        # Solo las solicitudes donde este docente es el director del proyecto
        rows = db.execute(text("""
            SELECT
                df.id_solicitud,
                df.pdf_url,
                df.estado,
                df.orden_actual,
                s.numero_radicado,
                s.asunto,
                s.fecha_creacion,
                p.nombre_completo  AS nombre_estudiante,
                e.codigo_estudiante,
                NULL               AS grupo_investigacion
            FROM documento_firma df
            JOIN solicitud s ON s.id = df.id_solicitud
            JOIN persona p ON p.id = s.id_solicitante
            LEFT JOIN estudiante e ON e.id_persona = p.id
            LEFT JOIN proyecto_grado pg ON pg.id_estudiante = e.id
            WHERE df.estado = 'pendiente_director'
              AND pg.id_director = :persona_id
            ORDER BY s.fecha_creacion DESC
        """), {"persona_id": persona.id}).fetchall()

    else:  # coordinador — todas las pendientes de coordinador
        rows = db.execute(text("""
            SELECT
                df.id_solicitud,
                df.pdf_url,
                df.estado,
                df.orden_actual,
                s.numero_radicado,
                s.asunto,
                s.fecha_creacion,
                p.nombre_completo  AS nombre_estudiante,
                e.codigo_estudiante,
                NULL               AS grupo_investigacion
            FROM documento_firma df
            JOIN solicitud s ON s.id = df.id_solicitud
            JOIN persona p ON p.id = s.id_solicitante
            LEFT JOIN estudiante e ON e.id_persona = p.id
            WHERE df.estado = 'pendiente_coordinador'
            ORDER BY s.fecha_creacion DESC
        """), {}).fetchall()

    return [
        {
            "id_solicitud":       r.id_solicitud,
            "pdf_url":            r.pdf_url,
            "estado":             r.estado,
            "numero_radicado":    r.numero_radicado,
            "asunto":             r.asunto,
            "fecha_creacion":     str(r.fecha_creacion) if r.fecha_creacion else None,
            "nombre_estudiante":  r.nombre_estudiante,
            "codigo_estudiante":  r.codigo_estudiante,
            "grupo_investigacion": getattr(r, "grupo_investigacion", None),
        }
        for r in rows
    ]


# ── Estado de firmas ──────────────────────────────────────────────────────────

@router.get("/estado/{id_solicitud}")
def estado_firmas(
    id_solicitud: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    get_current_user(db, token)
    row = db.execute(
        text("SELECT * FROM documento_firma WHERE id_solicitud = :id"),
        {"id": id_solicitud}
    ).fetchone()
    if not row:
        return {"existe": False}
    return {
        "existe":       True,
        "pdf_actual":   row.pdf_url,
        "orden_actual": row.orden_actual,
        "estado":       row.estado,
        "firmantes": {
            "estudiante":  {"firmado": row.firmado_estudiante,  "fecha": str(row.fecha_firma_est)  if row.fecha_firma_est  else None},
            "director":    {"firmado": row.firmado_director,    "fecha": str(row.fecha_firma_dir)  if row.fecha_firma_dir  else None},
            "dir_grupo":   {"firmado": row.firmado_dir_grupo,   "fecha": str(row.fecha_firma_dir_grp) if row.fecha_firma_dir_grp else None},
            "coordinador": {"firmado": row.firmado_coordinador, "fecha": str(row.fecha_firma_coord) if row.fecha_firma_coord else None},
        }
    }
