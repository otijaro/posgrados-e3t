from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import shutil, os

from app.database import get_db
from app.models import (
    Solicitud, FlujoAprobacion,
    TipoSolicitud, CategoriasSolicitud, EstadoSolicitud, NivelAprobacion,
    ProgramaPosgrado, Estudiante, Persona, CreditoCondonable
)
from app.schemas import SolicitudListResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/solicitudes", tags=["Solicitudes"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ──────────────────────────────────────────────────────────────────────────────
# FLUJO DE APROBACIÓN:
#   1. Estudiante envía → estado: ENVIADA, flujo pendiente en DIRECTOR
#   2. Director aprueba (y firma) → estado: EN_REVISION, flujo pendiente en COORDINADOR
#      Director rechaza → estado: RECHAZADA (notificación al estudiante con motivo)
#   3. Coordinador aprueba → estado: EN_COMITE, flujo pendiente en COMITE
#      Coordinador rechaza → estado: RECHAZADA (notificación al estudiante con motivo)
#   4. Comité aprueba → estado: APROBADA
#      Comité rechaza → estado: RECHAZADA
# ──────────────────────────────────────────────────────────────────────────────

# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_persona_autenticada(token: str, db: Session) -> Persona:
    persona = get_current_user(db, token)
    if not persona:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    return persona

def _get_estudiante_autenticado(token: str, db: Session):
    persona = _get_persona_autenticada(token, db)
    estudiante = db.query(Estudiante).filter(Estudiante.id_persona == persona.id).first()
    if not estudiante:
        raise HTTPException(status_code=404, detail="No se encontró un registro de estudiante")
    return persona, estudiante

def _guardar_pdf(documento: UploadFile) -> str:
    if not documento.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF")
    filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{documento.filename}"
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as buffer:
        shutil.copyfileobj(documento.file, buffer)
    return f"/uploads/{filename}"

def _generar_radicado(db: Session) -> str:
    anio  = datetime.now().year
    count = db.query(Solicitud).filter(Solicitud.fecha_creacion >= datetime(anio, 1, 1)).count()
    return f"SOL-{anio}-{(count + 1):04d}"

def _crear_flujo_director(db: Session, id_solicitud: int):
    """Crea el paso de aprobación del director."""
    db.add(FlujoAprobacion(
        id_solicitud=id_solicitud, orden=1,
        nivel=NivelAprobacion.DIRECTOR, rol_responsable="director",
        estado="pendiente", fecha_recepcion=datetime.utcnow()
    ))

def _crear_flujo_coordinador(db: Session, id_solicitud: int):
    """Crea el paso de aprobación del coordinador."""
    db.add(FlujoAprobacion(
        id_solicitud=id_solicitud, orden=2,
        nivel=NivelAprobacion.COORDINADOR, rol_responsable="coordinador",
        estado="pendiente", fecha_recepcion=datetime.utcnow()
    ))

def _crear_flujo_comite(db: Session, id_solicitud: int):
    """Crea el paso de aprobación del comité."""
    db.add(FlujoAprobacion(
        id_solicitud=id_solicitud, orden=3,
        nivel=NivelAprobacion.COMITE, rol_responsable="comite",
        estado="pendiente", fecha_recepcion=datetime.utcnow()
    ))

def _serializar_solicitud(s: Solicitud) -> dict:
    return {
        "id":                s.id,
        "numero_radicado":   s.numero_radicado,
        "tipo_solicitud":    s.tipo_solicitud.value,
        "asunto":            s.asunto,
        "descripcion":       s.descripcion,
        "estado":            s.estado.value,
        "nivel_aprobacion":  s.nivel_aprobacion_requerido.value,
        "fecha_creacion":    s.fecha_creacion.strftime("%Y-%m-%d %H:%M") if s.fecha_creacion else None,
        "fecha_envio":       s.fecha_envio.strftime("%Y-%m-%d") if s.fecha_envio else None,
        "documento":         s.documentos_adjuntos,
        "respuesta":         s.respuesta,
        "solicitante_nombre": s.solicitante.nombre_completo if s.solicitante else "—",
    }

DIAS_EDICION = 2  # días máximos para editar una solicitud enviada

def _verificar_editable(s: Solicitud) -> tuple[bool, str]:
    """Retorna (es_editable, motivo_si_no)."""
    if s.estado != EstadoSolicitud.ENVIADA:
        return False, "La solicitud ya fue procesada por el director y no se puede editar"
    if s.fecha_envio:
        dias = (datetime.utcnow() - s.fecha_envio).total_seconds() / 86400
        if dias > DIAS_EDICION:
            return False, f"El plazo de {DIAS_EDICION} días para editar ha vencido"
    return True, ""

# ── GET solicitudes ───────────────────────────────────────────────────────────

@router.get("", response_model=List[SolicitudListResponse])
def listar_solicitudes(
    id_programa: Optional[int] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Solicitud)
    if id_programa: query = query.filter(Solicitud.id_programa == id_programa)
    if estado:      query = query.filter(Solicitud.estado == estado)
    return [
        SolicitudListResponse(
            id=s.id, numero_radicado=s.numero_radicado,
            tipo_solicitud=s.tipo_solicitud.value, asunto=s.asunto,
            estado=s.estado.value, fecha_creacion=s.fecha_creacion
        )
        for s in query.order_by(Solicitud.fecha_creacion.desc()).all()
    ]

# ── GET mis solicitudes ───────────────────────────────────────────────────────

@router.get("/mis-solicitudes")
def mis_solicitudes(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    persona = _get_persona_autenticada(token, db)
    resultado = []
    for s in db.query(Solicitud).filter(Solicitud.id_solicitante == persona.id).order_by(Solicitud.fecha_creacion.desc()).all():
        editable, motivo_no_editable = _verificar_editable(s)
        horas_restantes = None
        if editable and s.fecha_envio:
            segundos = DIAS_EDICION * 86400 - (datetime.utcnow() - s.fecha_envio).total_seconds()
            horas_restantes = max(0, round(segundos / 3600, 1))
        resultado.append({
            "id":                  s.id,
            "numero_radicado":     s.numero_radicado,
            "tipo_solicitud":      s.tipo_solicitud.value,
            "asunto":              s.asunto,
            "estado":              s.estado.value,
            "fecha_creacion":      s.fecha_creacion.strftime("%Y-%m-%d") if s.fecha_creacion else None,
            "respuesta":           s.respuesta,
            "editable":            editable,
            "motivo_no_editable":  motivo_no_editable,
            "horas_restantes":     horas_restantes,
        })
    return resultado

# ── PUT editar solicitud ────────────────────────────────────────────────────────

@router.put("/{solicitud_id}/editar")
async def editar_solicitud(
    solicitud_id: int,
    descripcion: Optional[str] = Form(None),
    asunto:      Optional[str] = Form(None),
    documento:   Optional[UploadFile] = File(None),
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    persona = _get_persona_autenticada(token, db)
    s = db.query(Solicitud).filter(
        Solicitud.id == solicitud_id,
        Solicitud.id_solicitante == persona.id
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    editable, motivo = _verificar_editable(s)
    if not editable:
        raise HTTPException(status_code=403, detail=motivo)

    if asunto:      s.asunto      = asunto
    if descripcion: s.descripcion = descripcion
    if documento and documento.filename:
        s.documentos_adjuntos = _guardar_pdf(documento)

    s.updated_at = datetime.utcnow()
    db.commit()
    return {"mensaje": "Solicitud actualizada", "id": s.id}

# ── GET pendientes por rol ────────────────────────────────────────────────────

@router.get("/pendientes/director")
def pendientes_director(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    _get_persona_autenticada(token, db)
    solicitudes = (
        db.query(Solicitud)
        .join(FlujoAprobacion, FlujoAprobacion.id_solicitud == Solicitud.id)
        .filter(
            FlujoAprobacion.rol_responsable == "director",
            FlujoAprobacion.estado == "pendiente",
            Solicitud.estado == EstadoSolicitud.ENVIADA,
        )
        .order_by(Solicitud.fecha_envio.desc())
        .all()
    )
    return [
        {
            "id":              s.id,
            "numero_radicado": s.numero_radicado,
            "tipo_solicitud":  s.tipo_solicitud.value,
            "asunto":          s.asunto,
            "estado":          s.estado.value,
            "fecha_envio":     s.fecha_envio.strftime("%Y-%m-%d") if s.fecha_envio else None,
            "solicitante":     s.solicitante.nombre_completo if s.solicitante else "—",
        }
        for s in solicitudes
    ]

@router.get("/pendientes/coordinador")
def pendientes_coordinador(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    _get_persona_autenticada(token, db)
    solicitudes = (
        db.query(Solicitud)
        .join(FlujoAprobacion, FlujoAprobacion.id_solicitud == Solicitud.id)
        .filter(
            FlujoAprobacion.rol_responsable == "coordinador",
            FlujoAprobacion.estado == "pendiente",
            Solicitud.estado == EstadoSolicitud.EN_REVISION,
        )
        .order_by(Solicitud.fecha_envio.desc())
        .all()
    )
    return [
        {
            "id":              s.id,
            "numero_radicado": s.numero_radicado,
            "tipo_solicitud":  s.tipo_solicitud.value,
            "asunto":          s.asunto,
            "estado":          s.estado.value,
            "fecha_envio":     s.fecha_envio.strftime("%Y-%m-%d") if s.fecha_envio else None,
            "solicitante":     s.solicitante.nombre_completo if s.solicitante else "—",
        }
        for s in solicitudes
    ]

@router.get("/pendientes/comite")
def pendientes_comite(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    _get_persona_autenticada(token, db)
    solicitudes = (
        db.query(Solicitud)
        .join(FlujoAprobacion, FlujoAprobacion.id_solicitud == Solicitud.id)
        .filter(
            FlujoAprobacion.rol_responsable == "comite",
            FlujoAprobacion.estado == "pendiente",
            Solicitud.estado == EstadoSolicitud.EN_COMITE,
        )
        .order_by(Solicitud.fecha_envio.desc())
        .all()
    )
    return [
        {
            "id":              s.id,
            "numero_radicado": s.numero_radicado,
            "tipo_solicitud":  s.tipo_solicitud.value,
            "asunto":          s.asunto,
            "estado":          s.estado.value,
            "fecha_envio":     s.fecha_envio.strftime("%Y-%m-%d") if s.fecha_envio else None,
            "solicitante":     s.solicitante.nombre_completo if s.solicitante else "—",
        }
        for s in solicitudes
    ]

# ── POST acción del director ──────────────────────────────────────────────────

class AccionBody(BaseModel):
    accion: str          # "aprobar" | "rechazar"
    motivo: Optional[str] = None
    documento_firmado: Optional[str] = None  # base64 del PDF firmado

@router.post("/{solicitud_id}/director/accion")
def director_accion(
    solicitud_id: int,
    body: AccionBody,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    persona = _get_persona_autenticada(token, db)
    s = db.query(Solicitud).filter(Solicitud.id == solicitud_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    if s.estado != EstadoSolicitud.ENVIADA:
        raise HTTPException(status_code=400, detail="La solicitud no está en estado enviada")

    flujo = db.query(FlujoAprobacion).filter(
        FlujoAprobacion.id_solicitud == solicitud_id,
        FlujoAprobacion.rol_responsable == "director",
        FlujoAprobacion.estado == "pendiente"
    ).first()
    if not flujo:
        raise HTTPException(status_code=404, detail="No hay flujo pendiente para el director")

    if body.accion == "aprobar":
        # Si la solicitud tiene un documento adjunto, exigir que ya esté firmado
        # por el director antes de poder aprobar (ya sea en este mismo request,
        # o ya guardado previamente vía /firmas/guardar-firmado).
        if s.documentos_adjuntos and not body.documento_firmado:
            firma = db.execute(
                text("SELECT firmado_director FROM documento_firma WHERE id_solicitud = :id"),
                {"id": solicitud_id}
            ).fetchone()
            if not firma or not firma[0]:
                raise HTTPException(
                    status_code=400,
                    detail="Debe firmar el documento antes de poder aprobar la solicitud"
                )

        # Director aprueba y firma → pasa al coordinador
        flujo.estado          = "aprobado"
        flujo.fecha_respuesta = datetime.utcnow()
        flujo.comentarios     = body.motivo

        # Guardar PDF firmado si viene
        if body.documento_firmado:
            import base64
            filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_firmado_director_{solicitud_id}.pdf"
            path = os.path.join(UPLOAD_DIR, filename)
            with open(path, "wb") as f:
                f.write(base64.b64decode(body.documento_firmado))
            s.documentos_adjuntos = f"/uploads/{filename}"

        s.estado = EstadoSolicitud.EN_REVISION
        s.id_quien_responde = persona.id
        _crear_flujo_coordinador(db, solicitud_id)

    elif body.accion == "rechazar":
        if not body.motivo:
            raise HTTPException(status_code=400, detail="Debe indicar el motivo de rechazo")
        flujo.estado          = "rechazado"
        flujo.fecha_respuesta = datetime.utcnow()
        flujo.comentarios     = body.motivo
        s.estado              = EstadoSolicitud.RECHAZADA
        s.respuesta           = body.motivo
        s.id_quien_responde   = persona.id
        s.fecha_rechazo       = datetime.utcnow()
    else:
        raise HTTPException(status_code=400, detail="Acción inválida")

    db.commit()
    return {"mensaje": f"Solicitud {body.accion}da por el director", "estado": s.estado.value}

# ── POST acción del coordinador ───────────────────────────────────────────────

@router.post("/{solicitud_id}/coordinador/accion")
def coordinador_accion(
    solicitud_id: int,
    body: AccionBody,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    persona = _get_persona_autenticada(token, db)
    s = db.query(Solicitud).filter(Solicitud.id == solicitud_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    if s.estado != EstadoSolicitud.EN_REVISION:
        raise HTTPException(status_code=400, detail="La solicitud no está en revisión del coordinador")

    flujo = db.query(FlujoAprobacion).filter(
        FlujoAprobacion.id_solicitud == solicitud_id,
        FlujoAprobacion.rol_responsable == "coordinador",
        FlujoAprobacion.estado == "pendiente"
    ).first()
    if not flujo:
        raise HTTPException(status_code=404, detail="No hay flujo pendiente para el coordinador")

    if body.accion == "aprobar":
        flujo.estado          = "aprobado"
        flujo.fecha_respuesta = datetime.utcnow()
        flujo.comentarios     = body.motivo
        s.estado              = EstadoSolicitud.EN_COMITE
        s.id_quien_responde   = persona.id
        _crear_flujo_comite(db, solicitud_id)

    elif body.accion == "rechazar":
        if not body.motivo:
            raise HTTPException(status_code=400, detail="Debe indicar el motivo de rechazo")
        flujo.estado          = "rechazado"
        flujo.fecha_respuesta = datetime.utcnow()
        flujo.comentarios     = body.motivo
        s.estado              = EstadoSolicitud.RECHAZADA
        s.respuesta           = body.motivo
        s.id_quien_responde   = persona.id
        s.fecha_rechazo       = datetime.utcnow()
    else:
        raise HTTPException(status_code=400, detail="Acción inválida")

    db.commit()
    return {"mensaje": f"Solicitud {body.accion}da por el coordinador", "estado": s.estado.value}

# ── POST acción del comité ────────────────────────────────────────────────────

@router.post("/{solicitud_id}/comite/accion")
def comite_accion(
    solicitud_id: int,
    body: AccionBody,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    persona = _get_persona_autenticada(token, db)
    s = db.query(Solicitud).filter(Solicitud.id == solicitud_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    if s.estado != EstadoSolicitud.EN_COMITE:
        raise HTTPException(status_code=400, detail="La solicitud no está en el comité")

    flujo = db.query(FlujoAprobacion).filter(
        FlujoAprobacion.id_solicitud == solicitud_id,
        FlujoAprobacion.rol_responsable == "comite",
        FlujoAprobacion.estado == "pendiente"
    ).first()
    if not flujo:
        raise HTTPException(status_code=404, detail="No hay flujo pendiente para el comité")

    if body.accion == "aprobar":
        flujo.estado            = "aprobado"
        flujo.fecha_respuesta   = datetime.utcnow()
        flujo.comentarios       = body.motivo
        s.estado                = EstadoSolicitud.APROBADA
        s.id_quien_responde     = persona.id
        s.fecha_aprobacion      = datetime.utcnow()

    elif body.accion == "rechazar":
        if not body.motivo:
            raise HTTPException(status_code=400, detail="Debe indicar el motivo de rechazo")
        flujo.estado          = "rechazado"
        flujo.fecha_respuesta = datetime.utcnow()
        flujo.comentarios     = body.motivo
        s.estado              = EstadoSolicitud.RECHAZADA
        s.respuesta           = body.motivo
        s.id_quien_responde   = persona.id
        s.fecha_rechazo       = datetime.utcnow()
    else:
        raise HTTPException(status_code=400, detail="Acción inválida")

    db.commit()
    return {"mensaje": f"Solicitud {body.accion}da por el comité", "estado": s.estado.value}

# ── GET detalle solicitud ─────────────────────────────────────────────────────

@router.get("/{solicitud_id}")
def obtener_solicitud(solicitud_id: int, db: Session = Depends(get_db)):
    s = db.query(Solicitud).filter(Solicitud.id == solicitud_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    flujos = db.query(FlujoAprobacion).filter(
        FlujoAprobacion.id_solicitud == solicitud_id
    ).order_by(FlujoAprobacion.orden).all()

    return {
        **_serializar_solicitud(s),
        "flujo": [
            {
                "orden":           f.orden,
                "rol":             f.rol_responsable,
                "estado":          f.estado,
                "fecha_recepcion": f.fecha_recepcion.strftime("%Y-%m-%d") if f.fecha_recepcion else None,
                "fecha_respuesta": f.fecha_respuesta.strftime("%Y-%m-%d") if f.fecha_respuesta else None,
                "comentarios":     f.comentarios,
            }
            for f in flujos
        ]
    }

# ── POST registrar tema ───────────────────────────────────────────────────────

@router.post("/registrar-tema", status_code=201)
async def registrar_tema(
    director: str = Form(...), director_correo: str = Form(...),
    titulo: str = Form(...), objetivo_general: str = Form(...),
    descripcion_alcances: Optional[str] = Form(None),
    linea_estrategica: Optional[str] = Form(None),
    grupo_investigacion: Optional[str] = Form(None),
    area_formacion: Optional[str] = Form(None),
    codirector: Optional[str] = Form(None),
    codirector_correo: Optional[str] = Form(None),
    codirector_cargo: Optional[str] = Form(None),
    codirector_entidad: Optional[str] = Form(None),
    documento: Optional[UploadFile] = File(None),
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    persona, estudiante = _get_estudiante_autenticado(token, db)
    url_documento = _guardar_pdf(documento) if documento and documento.filename else None
    codirector_info = f"\nCodirector: {codirector} ({codirector_correo or 'sin correo'})" if codirector else ""
    solicitud = Solicitud(
        numero_radicado=_generar_radicado(db),
        tipo_solicitud=TipoSolicitud.CAMBIO_TITULO,
        categoria=CategoriasSolicitud.INVESTIGACION,
        id_solicitante=persona.id,
        id_estudiante=estudiante.id,
        id_proyecto=estudiante.proyecto.id if estudiante.proyecto else None,
        id_programa=estudiante.id_programa,
        asunto=f"Registro de tema: {titulo[:100]}",
        descripcion=(
            f"Estudiante: {persona.nombre_completo} (Código: {estudiante.codigo_estudiante})\n"
            f"Programa: {estudiante.programa.nombre if estudiante.programa else '—'}\n\n"
            f"Director: {director} ({director_correo}){codirector_info}\n\n"
            f"Título: {titulo}\n\n"
            f"Objetivo General:\n{objetivo_general}\n\n"
            f"Alcances:\n{descripcion_alcances or '—'}\n\n"
            f"Grupo de Investigación: {grupo_investigacion or '—'}\n"
            f"Área de Formación: {area_formacion or '—'}\n"
            f"Línea Estratégica: {linea_estrategica or '—'}"
        ),
        documentos_adjuntos=url_documento,
        nivel_aprobacion_requerido=NivelAprobacion.DIRECTOR,
        estado=EstadoSolicitud.ENVIADA,
        fecha_envio=datetime.utcnow(),
    )
    db.add(solicitud); db.flush()
    _crear_flujo_director(db, solicitud.id)
    db.commit(); db.refresh(solicitud)
    return {"mensaje": "Tema registrado exitosamente", "numero_radicado": solicitud.numero_radicado, "id": solicitud.id, "estado": solicitud.estado.value}

# ── POST evaluación ───────────────────────────────────────────────────────────

@router.post("/evaluacion", status_code=201)
async def crear_solicitud_evaluacion(
    titulo: str = Form(...), resumen: str = Form(...),
    posibles_jurados: str = Form(...), tipo_evaluacion: str = Form(...),
    id_programa: int = Form(...),
    documento: Optional[UploadFile] = File(None),
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    persona, estudiante = _get_estudiante_autenticado(token, db)
    programa = db.query(ProgramaPosgrado).filter(ProgramaPosgrado.id == id_programa).first()
    if not programa: raise HTTPException(status_code=404, detail="Programa no encontrado")
    url_documento = _guardar_pdf(documento) if documento and documento.filename else None
    director_nombre = estudiante.proyecto.director.nombre_completo if estudiante.proyecto and estudiante.proyecto.director else "Sin director"
    solicitud = Solicitud(
        numero_radicado=_generar_radicado(db),
        tipo_solicitud=TipoSolicitud.NOMBRAMIENTO_JURADO,
        categoria=CategoriasSolicitud.INVESTIGACION,
        id_solicitante=persona.id, id_estudiante=estudiante.id,
        id_proyecto=estudiante.proyecto.id if estudiante.proyecto else None,
        id_programa=id_programa,
        asunto=f"Solicitud de evaluación: {tipo_evaluacion} - {titulo[:80]}",
        descripcion=(
            f"Estudiante: {persona.nombre_completo} (Código: {estudiante.codigo_estudiante})\n"
            f"Programa: {programa.nombre}\nDirector: {director_nombre}\n"
            f"Título: {titulo}\nTipo: {tipo_evaluacion}\n\nResumen:\n{resumen}\n\nJurados:\n{posibles_jurados}"
        ),
        documentos_adjuntos=url_documento,
        nivel_aprobacion_requerido=NivelAprobacion.DIRECTOR,
        estado=EstadoSolicitud.ENVIADA,
        fecha_envio=datetime.utcnow(),
    )
    db.add(solicitud); db.flush()
    _crear_flujo_director(db, solicitud.id)
    db.commit(); db.refresh(solicitud)
    return {"mensaje": "Solicitud creada exitosamente", "numero_radicado": solicitud.numero_radicado, "id": solicitud.id, "estado": solicitud.estado.value}

# ── POST cambio director ──────────────────────────────────────────────────────

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
    director_actual = estudiante.proyecto.director.nombre_completo if estudiante.proyecto and estudiante.proyecto.director else "Sin director"
    tipo_label = {"director": "Cambio de Director", "codirector": "Cambio de Codirector", "ambos": "Cambio de Director y Codirector"}.get(tipo_cambio, "Cambio de Director")
    solicitud = Solicitud(
        numero_radicado=_generar_radicado(db),
        tipo_solicitud=TipoSolicitud.CAMBIO_DIRECTOR,
        categoria=CategoriasSolicitud.ACADEMICA,
        id_solicitante=persona.id, id_estudiante=estudiante.id,
        id_proyecto=estudiante.proyecto.id if estudiante.proyecto else None,
        id_programa=estudiante.id_programa,
        asunto=f"{tipo_label} — {persona.nombre_completo}",
        descripcion=(
            f"Estudiante: {persona.nombre_completo} (Código: {estudiante.codigo_estudiante})\n"
            f"Director actual: {director_actual}\n"
            f"{'Nuevo director: ' + nuevo_director if nuevo_director else ''}\n"
            f"{'Nuevo codirector: ' + nuevo_codirector if nuevo_codirector else ''}\n\n"
            f"Justificación:\n{justificacion}"
        ),
        documentos_adjuntos=url_documento,
        nivel_aprobacion_requerido=NivelAprobacion.DIRECTOR,
        estado=EstadoSolicitud.ENVIADA,
        fecha_envio=datetime.utcnow(),
    )
    db.add(solicitud); db.flush()
    _crear_flujo_director(db, solicitud.id)
    db.commit(); db.refresh(solicitud)
    return {"mensaje": "Solicitud enviada exitosamente", "numero_radicado": solicitud.numero_radicado, "id": solicitud.id, "estado": solicitud.estado.value}

# ── POST crédito condonable ───────────────────────────────────────────────

@router.post("/credito-condonable", status_code=201)
async def credito_condonable(
    periodo_completo: str = Form(...),   # ej. "2026-2"
    modalidad: str = Form(...),          # "Docencia Directa" | "Asistente de Investigación" | "Otro"
    materia_asignada: Optional[str] = Form(None),
    horas_semanales: Optional[int] = Form(None),
    justificacion: str = Form(...),
    carta_director: UploadFile = File(...),
    certificado_notas: Optional[UploadFile] = File(None),
    paz_salvo: Optional[UploadFile] = File(None),
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    persona, estudiante = _get_estudiante_autenticado(token, db)

    try:
        anio_str, periodo_str = periodo_completo.split("-")
        anio, periodo = int(anio_str), int(periodo_str)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Periodo inválido, formato esperado AAAA-P (ej. 2026-2)")

    url_carta = _guardar_pdf(carta_director)
    url_notas = _guardar_pdf(certificado_notas) if certificado_notas and certificado_notas.filename else None
    url_paz_salvo = _guardar_pdf(paz_salvo) if paz_salvo and paz_salvo.filename else None

    solicitud = Solicitud(
        numero_radicado=_generar_radicado(db),
        tipo_solicitud=TipoSolicitud.CREDITO_CONDONABLE,
        categoria=CategoriasSolicitud.FINANCIERA,
        id_solicitante=persona.id, id_estudiante=estudiante.id,
        id_proyecto=estudiante.proyecto.id if estudiante.proyecto else None,
        id_programa=estudiante.id_programa,
        asunto=f"Crédito condonable {periodo_completo} — {persona.nombre_completo}",
        descripcion=(
            f"Estudiante: {persona.nombre_completo} (Código: {estudiante.codigo_estudiante})\n"
            f"Periodo: {periodo_completo}\nModalidad: {modalidad}\n"
            f"{'Materia asignada: ' + materia_asignada if materia_asignada else ''}"
            f"{' (' + str(horas_semanales) + ' h/semana)' if horas_semanales else ''}\n\n"
            f"Justificación:\n{justificacion}"
        ),
        documentos_adjuntos=url_carta,
        nivel_aprobacion_requerido=NivelAprobacion.DIRECTOR,
        estado=EstadoSolicitud.ENVIADA,
        fecha_envio=datetime.utcnow(),
    )
    db.add(solicitud); db.flush()

    db.add(CreditoCondonable(
        id_solicitud=solicitud.id,
        id_estudiante=estudiante.id,
        anio=anio, periodo=periodo, periodo_completo=periodo_completo,
        modalidad=modalidad,
        materia_asignada=materia_asignada,
        horas_semanales=horas_semanales,
        url_carta_director=url_carta,
        url_certificado_notas=url_notas,
        url_paz_salvo=url_paz_salvo,
    ))

    _crear_flujo_director(db, solicitud.id)
    db.commit(); db.refresh(solicitud)
    return {"mensaje": "Solicitud de crédito condonable enviada exitosamente", "numero_radicado": solicitud.numero_radicado, "id": solicitud.id, "estado": solicitud.estado.value}

# ── POST cambio de título ─────────────────────────────────────────────────────

@router.post("/cambio-titulo", status_code=201)
async def cambio_titulo(
    nuevo_titulo: str = Form(...), justificacion: str = Form(...),
    documento: Optional[UploadFile] = File(None),
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    persona, estudiante = _get_estudiante_autenticado(token, db)
    url_documento = _guardar_pdf(documento) if documento and documento.filename else None
    titulo_actual = estudiante.proyecto.titulo if estudiante.proyecto else "Sin título registrado"
    solicitud = Solicitud(
        numero_radicado=_generar_radicado(db),
        tipo_solicitud=TipoSolicitud.CAMBIO_TITULO,
        categoria=CategoriasSolicitud.ACADEMICA,
        id_solicitante=persona.id, id_estudiante=estudiante.id,
        id_proyecto=estudiante.proyecto.id if estudiante.proyecto else None,
        id_programa=estudiante.id_programa,
        asunto=f"Cambio de título — {persona.nombre_completo}",
        descripcion=(
            f"Estudiante: {persona.nombre_completo} (Código: {estudiante.codigo_estudiante})\n"
            f"Título actual: {titulo_actual}\n\n"
            f"Nuevo título: {nuevo_titulo}\n\n"
            f"Justificación:\n{justificacion}"
        ),
        documentos_adjuntos=url_documento,
        nivel_aprobacion_requerido=NivelAprobacion.DIRECTOR,
        estado=EstadoSolicitud.ENVIADA,
        fecha_envio=datetime.utcnow(),
    )
    db.add(solicitud); db.flush()
    _crear_flujo_director(db, solicitud.id)
    db.commit(); db.refresh(solicitud)
    return {"mensaje": "Solicitud enviada exitosamente", "numero_radicado": solicitud.numero_radicado, "id": solicitud.id, "estado": solicitud.estado.value}
