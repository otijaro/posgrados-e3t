from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import shutil
import os

from app.database import get_db
from app.models import (
    Solicitud, FlujoAprobacion,
    TipoSolicitud, CategoriasSolicitud, EstadoSolicitud, NivelAprobacion,
    ProgramaPosgrado
)
from app.schemas import SolicitudListResponse
from app.services.validacion_solicitudes import ValidacionSolicitudesService

router = APIRouter(prefix="/solicitudes", tags=["Solicitudes"])

# Directorio donde se guardan los PDFs subidos
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/", response_model=List[SolicitudListResponse])
def listar_solicitudes(
    id_programa: Optional[int] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lista todas las solicitudes, con filtros opcionales."""
    query = db.query(Solicitud)

    if id_programa:
        query = query.filter(Solicitud.id_programa == id_programa)
    if estado:
        query = query.filter(Solicitud.estado == estado)

    solicitudes = query.order_by(Solicitud.fecha_creacion.desc()).all()

    return [
        SolicitudListResponse(
            id=s.id,
            numero_radicado=s.numero_radicado,
            tipo_solicitud=s.tipo_solicitud.value,
            asunto=s.asunto,
            estado=s.estado.value,
            fecha_creacion=s.fecha_creacion,
        )
        for s in solicitudes
    ]


@router.post("/evaluacion", status_code=201)
async def crear_solicitud_evaluacion(
    nombre_completo: str = Form(...),
    codigo: str = Form(...),
    director: str = Form(...),
    titulo: str = Form(...),
    resumen: str = Form(...),
    posibles_jurados: str = Form(...),
    id_programa: int = Form(...),
    tipo_evaluacion: str = Form(...),
    codirector: Optional[str] = Form(None),
    documento: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Crea una nueva solicitud de evaluación."""

    # Verificar que el programa existe
    programa = db.query(ProgramaPosgrado).filter(
        ProgramaPosgrado.id == id_programa
    ).first()
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")

    # Guardar el documento PDF si fue enviado
    url_documento = None
    if documento and documento.filename:
        if not documento.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF")

        filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{documento.filename}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(documento.file, buffer)
        url_documento = f"/uploads/{filename}"

    # Generar número de radicado
    anio = datetime.now().year
    count = db.query(Solicitud).filter(
        Solicitud.id_programa == id_programa,
        Solicitud.fecha_creacion >= datetime(anio, 1, 1),
    ).count()
    numero_radicado = f"SOL-{anio}-{(count + 1):04d}"

    # Construir asunto y descripción
    asunto = f"Solicitud de evaluación: {tipo_evaluacion} - {titulo[:80]}"
    descripcion = (
        f"Estudiante: {nombre_completo} (Código: {codigo})\n"
        f"Director: {director}\n"
        f"Codirector: {codirector or 'No aplica'}\n"
        f"Título: {titulo}\n"
        f"Tipo de evaluación: {tipo_evaluacion}\n\n"
        f"Resumen:\n{resumen}\n\n"
        f"Posibles jurados:\n{posibles_jurados}"
    )

    # Crear o reutilizar persona temporal (hasta tener autenticación)
    from app.models import Persona
    persona = db.query(Persona).filter(
        Persona.email_institucional == "temporal@uis.edu.co"
    ).first()
    if not persona:
        persona = Persona(
            email_institucional="temporal@uis.edu.co",
            nombre_completo=nombre_completo,
            hashed_password="sin_auth"
        )
        db.add(persona)
        db.flush()

    # Crear la solicitud
    solicitud = Solicitud(
        numero_radicado=numero_radicado,
        tipo_solicitud=TipoSolicitud.NOMBRAMIENTO_JURADO,
        categoria=CategoriasSolicitud.INVESTIGACION,
        id_solicitante=persona.id,  # Temporal hasta tener auth
        id_programa=id_programa,
        asunto=asunto,
        descripcion=descripcion,
        documentos_adjuntos=url_documento,
        nivel_aprobacion_requerido=NivelAprobacion.COMITE,
        estado=EstadoSolicitud.ENVIADA,
        fecha_envio=datetime.utcnow(),
    )

    db.add(solicitud)
    db.flush()

    # Crear flujo de aprobación
    flujo = FlujoAprobacion(
        id_solicitud=solicitud.id,
        orden=1,
        nivel=NivelAprobacion.COMITE,
        rol_responsable="comite",
        estado="pendiente",
        fecha_recepcion=datetime.utcnow(),
    )
    db.add(flujo)
    db.commit()
    db.refresh(solicitud)

    return {
        "mensaje": "Solicitud creada exitosamente",
        "numero_radicado": solicitud.numero_radicado,
        "id": solicitud.id,
        "estado": solicitud.estado.value,
    }


@router.get("/{id}")
def obtener_solicitud(id: int, db: Session = Depends(get_db)):
    """Obtiene el detalle de una solicitud por ID."""
    solicitud = db.query(Solicitud).filter(Solicitud.id == id).first()
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    return {
        "id": solicitud.id,
        "numero_radicado": solicitud.numero_radicado,
        "tipo_solicitud": solicitud.tipo_solicitud.value,
        "asunto": solicitud.asunto,
        "descripcion": solicitud.descripcion,
        "estado": solicitud.estado.value,
        "nivel_aprobacion_requerido": solicitud.nivel_aprobacion_requerido.value,
        "fecha_creacion": solicitud.fecha_creacion,
        "fecha_envio": solicitud.fecha_envio,
        "documento": solicitud.documentos_adjuntos,
    }
