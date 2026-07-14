from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import shutil
import os

from app.database import get_db
from app.models import (
    Solicitud, FlujoAprobacion,
    TipoSolicitud, CategoriasSolicitud, EstadoSolicitud, NivelAprobacion,
    ProgramaPosgrado, Estudiante
)
from app.schemas import SolicitudListResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/solicitudes", tags=["Solicitudes"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_estudiante_autenticado(token: str, db: Session):
    persona = get_current_user(db, token)
    if not persona:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    estudiante = db.query(Estudiante).filter(Estudiante.id_persona == persona.id).first()
    if not estudiante:
        raise HTTPException(status_code=404, detail="No se encontró un registro de estudiante para este usuario")
    return persona, estudiante

def _guardar_pdf(documento: UploadFile) -> str:
    if not documento.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF")
    filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{documento.filename}"
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as buffer:
        shutil.copyfileobj(documento.file, buffer)
    return f"/uploads/{filename}"

def _generar_radicado(db: Session) -> str:
    anio = datetime.now().year
    count = db.query(Solicitud).filter(Solicitud.fecha_creacion >= datetime(anio, 1, 1)).count()
    return f"SOL-{anio}-{(count + 1):04d}"


# ── GET solicitudes ───────────────────────────────────────────────────────────

@router.get("/", response_model=List[SolicitudListResponse])
def listar_solicitudes(id_programa: Optional[int] = None, estado: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Solicitud)
    if id_programa: query = query.filter(Solicitud.id_programa == id_programa)
    if estado:      query = query.filter(Solicitud.estado == estado)
    return [
        SolicitudListResponse(id=s.id, numero_radicado=s.numero_radicado, tipo_solicitud=s.tipo_solicitud.value,
                              asunto=s.asunto, estado=s.estado.value, fecha_creacion=s.fecha_creacion)
        for s in query.order_by(Solicitud.fecha_creacion.desc()).all()
    ]


# ── GET mis solicitudes ───────────────────────────────────────────────────────

@router.get("/mis-solicitudes")
def mis_solicitudes(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    persona = get_current_user(db, token)
    if not persona:
        raise HTTPException(status_code=401, detail="Token inválido")
    return [
        {"id": s.id, "numero_radicado": s.numero_radicado, "tipo_solicitud": s.tipo_solicitud.value,
         "asunto": s.asunto, "estado": s.estado.value,
         "fecha_creacion": s.fecha_creacion.strftime("%Y-%m-%d") if s.fecha_creacion else None}
        for s in db.query(Solicitud).filter(Solicitud.id_solicitante == persona.id).order_by(Solicitud.fecha_creacion.desc()).all()
    ]


# ── POST evaluación ───────────────────────────────────────────────────────────

@router.post("/evaluacion", status_code=201)
async def crear_solicitud_evaluacion(
    titulo: str = Form(...), resumen: str = Form(...), posibles_jurados: str = Form(...),
    tipo_evaluacion: str = Form(...), id_programa: int = Form(...),
    documento: Optional[UploadFile] = File(None),
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    persona, estudiante = _get_estudiante_autenticado(token, db)
    programa = db.query(ProgramaPosgrado).filter(ProgramaPosgrado.id == id_programa).first()
    if not programa: raise HTTPException(status_code=404, detail="Programa no encontrado")
    url_documento = _guardar_pdf(documento) if documento and documento.filename else None
    director_nombre   = estudiante.proyecto.director.nombre_completo   if estudiante.proyecto and estudiante.proyecto.director   else "Sin director"
    codirector_nombre = estudiante.proyecto.codirector.nombre_completo if estudiante.proyecto and estudiante.proyecto.codirector else "No aplica"
    solicitud = Solicitud(
        numero_radicado=_generar_radicado(db), tipo_solicitud=TipoSolicitud.NOMBRAMIENTO_JURADO,
        categoria=CategoriasSolicitud.INVESTIGACION, id_solicitante=persona.id,
        id_estudiante=estudiante.id, id_proyecto=estudiante.proyecto.id if estudiante.proyecto else None,
        id_programa=id_programa,
        asunto=f"Solicitud de evaluación: {tipo_evaluacion} - {titulo[:80]}",
        descripcion=(f"Estudiante: {persona.nombre_completo} (Código: {estudiante.codigo_estudiante})\n"
                     f"Programa: {programa.nombre}\nDirector: {director_nombre}\nCodirector: {codirector_nombre}\n"
                     f"Título: {titulo}\nTipo: {tipo_evaluacion}\n\nResumen:\n{resumen}\n\nJurados:\n{posibles_jurados}"),
        documentos_adjuntos=url_documento, nivel_aprobacion_requerido=NivelAprobacion.COMITE,
        estado=EstadoSolicitud.ENVIADA, fecha_envio=datetime.utcnow(),
    )
    db.add(solicitud); db.flush()
    db.add(FlujoAprobacion(id_solicitud=solicitud.id, orden=1, nivel=NivelAprobacion.COMITE,
                           rol_responsable="comite", estado="pendiente", fecha_recepcion=datetime.utcnow()))
    db.commit(); db.refresh(solicitud)
    return {"mensaje": "Solicitud creada exitosamente", "numero_radicado": solicitud.numero_radicado, "id": solicitud.id, "estado": solicitud.estado.value}


# ── POST registrar tema ───────────────────────────────────────────────────────

@router.post("/registrar-tema", status_code=201)
async def registrar_tema(
    director: str = Form(...), director_correo: str = Form(...),
    titulo: str = Form(...), objetivo_general: str = Form(...),
    codirector: Optional[str] = Form(None), codirector_correo: Optional[str] = Form(None),
    documento: Optional[UploadFile] = File(None),
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    persona, estudiante = _get_estudiante_autenticado(token, db)
    url_documento = _guardar_pdf(documento) if documento and documento.filename else None
    codirector_info = f"\nCodirector propuesto: {codirector} ({codirector_correo or 'sin correo'})" if codirector else ""
    solicitud = Solicitud(
        numero_radicado=_generar_radicado(db), tipo_solicitud=TipoSolicitud.CAMBIO_TITULO,
        categoria=CategoriasSolicitud.INVESTIGACION, id_solicitante=persona.id,
        id_estudiante=estudiante.id, id_proyecto=estudiante.proyecto.id if estudiante.proyecto else None,
        id_programa=estudiante.id_programa,
        asunto=f"Registro de tema: {titulo[:100]}",
        descripcion=(f"Estudiante: {persona.nombre_completo} (Código: {estudiante.codigo_estudiante})\n"
                     f"Programa: {estudiante.programa.nombre if estudiante.programa else '—'}\n\n"
                     f"Director propuesto: {director} ({director_correo}){codirector_info}\n\n"
                     f"Título: {titulo}\n\nObjetivo General:\n{objetivo_general}"),
        documentos_adjuntos=url_documento, nivel_aprobacion_requerido=NivelAprobacion.DIRECTOR,
        estado=EstadoSolicitud.ENVIADA, fecha_envio=datetime.utcnow(),
    )
    db.add(solicitud); db.flush()
    db.add(FlujoAprobacion(id_solicitud=solicitud.id, orden=1, nivel=NivelAprobacion.DIRECTOR,
                           rol_responsable="director", estado="pendiente", fecha_recepcion=datetime.utcnow()))
    db.commit(); db.refresh(solicitud)
    return {"mensaje": "Tema registrado exitosamente", "numero_radicado": solicitud.numero_radicado, "id": solicitud.id, "estado": solicitud.estado.value}


# ── POST cambio director / codirector ─────────────────────────────────────────

@router.post("/cambio-director", status_code=201)
async def cambio_director(
    tipo_cambio: str = Form(...), justificacion: str = Form(...),
    nuevo_director: Optional[str] = Form(None), nuevo_director_correo: Optional[str] = Form(None),
    nuevo_codirector: Optional[str] = Form(None), nuevo_codirector_correo: Optional[str] = Form(None),
    documento: Optional[UploadFile] = File(None),
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    persona, estudiante = _get_estudiante_autenticado(token, db)
    url_documento = _guardar_pdf(documento) if documento and documento.filename else None
    director_actual   = estudiante.proyecto.director.nombre_completo   if estudiante.proyecto and estudiante.proyecto.director   else "Sin director"
    codirector_actual = estudiante.proyecto.codirector.nombre_completo if estudiante.proyecto and estudiante.proyecto.codirector else "Sin codirector"
    tipo_label = {"director": "Cambio de Director", "codirector": "Cambio de Codirector", "ambos": "Cambio de Director y Codirector"}.get(tipo_cambio, "Cambio de Director")
    cambios = []
    if tipo_cambio in ("director", "ambos") and nuevo_director:
        cambios.append(f"  Director actual:   {director_actual}\n  Nuevo director:    {nuevo_director} ({nuevo_director_correo or 'sin correo'})")
    if tipo_cambio in ("codirector", "ambos") and nuevo_codirector:
        cambios.append(f"  Codirector actual: {codirector_actual}\n  Nuevo codirector:  {nuevo_codirector} ({nuevo_codirector_correo or 'sin correo'})")
    solicitud = Solicitud(
        numero_radicado=_generar_radicado(db), tipo_solicitud=TipoSolicitud.CAMBIO_DIRECTOR,
        categoria=CategoriasSolicitud.ACADEMICA, id_solicitante=persona.id,
        id_estudiante=estudiante.id, id_proyecto=estudiante.proyecto.id if estudiante.proyecto else None,
        id_programa=estudiante.id_programa,
        asunto=f"{tipo_label} — {persona.nombre_completo}",
        descripcion=(f"Estudiante: {persona.nombre_completo} (Código: {estudiante.codigo_estudiante})\n"
                     f"Programa: {estudiante.programa.nombre if estudiante.programa else '—'}\n\n"
                     f"Tipo: {tipo_label}\n\n" + "\n\n".join(cambios) + f"\n\nJustificación:\n{justificacion}"),
        documentos_adjuntos=url_documento, nivel_aprobacion_requerido=NivelAprobacion.COMITE,
        estado=EstadoSolicitud.ENVIADA, fecha_envio=datetime.utcnow(),
    )
    db.add(solicitud); db.flush()
    db.add(FlujoAprobacion(id_solicitud=solicitud.id, orden=1, nivel=NivelAprobacion.COMITE,
                           rol_responsable="comite", estado="pendiente", fecha_recepcion=datetime.utcnow()))
    db.commit(); db.refresh(solicitud)
    return {"mensaje": "Solicitud enviada exitosamente", "numero_radicado": solicitud.numero_radicado, "id": solicitud.id, "estado": solicitud.estado.value}


# ── POST cambio de título ─────────────────────────────────────────────────────

@router.post("/cambio-titulo", status_code=201)
async def cambio_titulo(
    nuevo_titulo: str = Form(...), justificacion: str = Form(...),
    documento: Optional[UploadFile] = File(None),
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    """Solicitud de cambio del título del trabajo de grado."""
    persona, estudiante = _get_estudiante_autenticado(token, db)
    url_documento = _guardar_pdf(documento) if documento and documento.filename else None
    titulo_actual = estudiante.proyecto.titulo if estudiante.proyecto else "Sin título registrado"
    solicitud = Solicitud(
        numero_radicado=_generar_radicado(db), tipo_solicitud=TipoSolicitud.CAMBIO_TITULO,
        categoria=CategoriasSolicitud.ACADEMICA, id_solicitante=persona.id,
        id_estudiante=estudiante.id, id_proyecto=estudiante.proyecto.id if estudiante.proyecto else None,
        id_programa=estudiante.id_programa,
        asunto=f"Cambio de título — {persona.nombre_completo}",
        descripcion=(f"Estudiante: {persona.nombre_completo} (Código: {estudiante.codigo_estudiante})\n"
                     f"Programa: {estudiante.programa.nombre if estudiante.programa else '—'}\n\n"
                     f"Título actual:\n  {titulo_actual}\n\n"
                     f"Nuevo título propuesto:\n  {nuevo_titulo}\n\n"
                     f"Justificación:\n{justificacion}"),
        documentos_adjuntos=url_documento, nivel_aprobacion_requerido=NivelAprobacion.COMITE,
        estado=EstadoSolicitud.ENVIADA, fecha_envio=datetime.utcnow(),
    )
    db.add(solicitud); db.flush()
    db.add(FlujoAprobacion(id_solicitud=solicitud.id, orden=1, nivel=NivelAprobacion.COMITE,
                           rol_responsable="comite", estado="pendiente", fecha_recepcion=datetime.utcnow()))
    db.commit(); db.refresh(solicitud)
    return {"mensaje": "Solicitud enviada exitosamente", "numero_radicado": solicitud.numero_radicado, "id": solicitud.id, "estado": solicitud.estado.value}


# ── GET detalle ───────────────────────────────────────────────────────────────

@router.get("/{id}")
def obtener_solicitud(id: int, db: Session = Depends(get_db)):
    s = db.query(Solicitud).filter(Solicitud.id == id).first()
    if not s: raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    return {"id": s.id, "numero_radicado": s.numero_radicado, "tipo_solicitud": s.tipo_solicitud.value,
            "asunto": s.asunto, "descripcion": s.descripcion, "estado": s.estado.value,
            "nivel_aprobacion_requerido": s.nivel_aprobacion_requerido.value,
            "fecha_creacion": s.fecha_creacion, "fecha_envio": s.fecha_envio, "documento": s.documentos_adjuntos}
