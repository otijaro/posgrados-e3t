from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.database import get_db
from app.models import ProyectoGrado, Solicitud, ReporteSemestral
from app.models.proyecto import EstadoProyecto
from app.services.auth import get_current_user

router = APIRouter(prefix="/director", tags=["Director"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── Schemas de respuesta ──────────────────────────────────────────────────────

class ReporteInfo(BaseModel):
    periodo: str
    aval_director: int
    fecha_carga: Optional[str]
    observaciones_director: Optional[str]

    class Config:
        from_attributes = True


class SolicitudInfo(BaseModel):
    id: int
    numero_radicado: Optional[str]
    tipo_solicitud: str
    estado: str
    asunto: str
    fecha_creacion: str

    class Config:
        from_attributes = True


class EvaluacionInfo(BaseModel):
    nombre_evaluador: str
    tipo_evaluacion: Optional[str]
    concepto: Optional[str]
    calificacion: Optional[str]
    fecha_asignacion: Optional[str]
    fecha_respuesta: Optional[str]

    class Config:
        from_attributes = True


class EstudianteACargo(BaseModel):
    id_proyecto: int
    nombre_estudiante: str
    email_estudiante: str
    codigo_estudiante: str
    programa: str
    semestre_actual: int
    titulo_proyecto: str
    estado_proyecto: str
    rol_docente: str          # "director" o "codirector"
    reportes_pendientes: int  # reportes sin aval
    solicitudes_pendientes: int
    reportes: List[ReporteInfo]
    solicitudes: List[SolicitudInfo]
    evaluaciones: List[EvaluacionInfo]

    class Config:
        from_attributes = True


class ResumenDirector(BaseModel):
    total_estudiantes: int
    como_director: int
    como_codirector: int
    reportes_pendientes_aval: int
    solicitudes_pendientes: int
    estudiantes: List[EstudianteACargo]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/mis-estudiantes", response_model=ResumenDirector)
def mis_estudiantes(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Devuelve todos los estudiantes que tiene a cargo el docente autenticado,
    ya sea como director o codirector.
    """
    persona = get_current_user(db, token)
    if not persona:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    # Proyectos donde es director
    proyectos_director = db.query(ProyectoGrado).filter(
        ProyectoGrado.id_director == persona.id
    ).all()

    # Proyectos donde es codirector
    proyectos_codirector = db.query(ProyectoGrado).filter(
        ProyectoGrado.id_codirector == persona.id
    ).all()

    todos_proyectos = []

    def procesar_proyecto(proyecto, rol: str):
        est = proyecto.estudiante
        persona_est = est.persona if est else None
        if not persona_est:
            return None

        # Reportes
        reportes_info = []
        reportes_sin_aval = 0
        for r in proyecto.reportes:
            reportes_info.append(ReporteInfo(
                periodo=r.periodo,
                aval_director=r.aval_director,
                fecha_carga=r.fecha_carga.strftime("%Y-%m-%d") if r.fecha_carga else None,
                observaciones_director=r.observaciones_director,
            ))
            if r.aval_director == 0:
                reportes_sin_aval += 1

        # Solicitudes del estudiante vinculadas a este proyecto
        solicitudes_proyecto = db.query(Solicitud).filter(
            Solicitud.id_estudiante == est.id
        ).all()

        solicitudes_info = []
        solicitudes_pendientes = 0
        for s in solicitudes_proyecto:
            solicitudes_info.append(SolicitudInfo(
                id=s.id,
                numero_radicado=s.numero_radicado,
                tipo_solicitud=s.tipo_solicitud.value,
                estado=s.estado.value,
                asunto=s.asunto,
                fecha_creacion=s.fecha_creacion.strftime("%Y-%m-%d") if s.fecha_creacion else "",
            ))
            if s.estado.value in ("enviada", "en_revision"):
                solicitudes_pendientes += 1

        # Evaluaciones
        evaluaciones_info = []
        for e in proyecto.evaluaciones:
            evaluaciones_info.append(EvaluacionInfo(
                nombre_evaluador=e.nombre_evaluador,
                tipo_evaluacion=e.tipo_evaluacion,
                concepto=e.concepto,
                calificacion=e.calificacion,
                fecha_asignacion=e.fecha_asignacion.strftime("%Y-%m-%d") if e.fecha_asignacion else None,
                fecha_respuesta=e.fecha_respuesta.strftime("%Y-%m-%d") if e.fecha_respuesta else None,
            ))

        return EstudianteACargo(
            id_proyecto=proyecto.id,
            nombre_estudiante=persona_est.nombre_completo,
            email_estudiante=persona_est.email_institucional,
            codigo_estudiante=est.codigo_estudiante,
            programa=proyecto.programa.nombre if proyecto.programa else "—",
            semestre_actual=est.semestre_actual,
            titulo_proyecto=proyecto.titulo,
            estado_proyecto=proyecto.estado.value,
            rol_docente=rol,
            reportes_pendientes=reportes_sin_aval,
            solicitudes_pendientes=solicitudes_pendientes,
            reportes=reportes_info,
            solicitudes=solicitudes_info,
            evaluaciones=evaluaciones_info,
        )

    for p in proyectos_director:
        result = procesar_proyecto(p, "director")
        if result:
            todos_proyectos.append(result)

    for p in proyectos_codirector:
        result = procesar_proyecto(p, "codirector")
        if result:
            todos_proyectos.append(result)

    total_reportes_pendientes = sum(e.reportes_pendientes for e in todos_proyectos)
    total_solicitudes_pendientes = sum(e.solicitudes_pendientes for e in todos_proyectos)

    return ResumenDirector(
        total_estudiantes=len(todos_proyectos),
        como_director=len(proyectos_director),
        como_codirector=len(proyectos_codirector),
        reportes_pendientes_aval=total_reportes_pendientes,
        solicitudes_pendientes=total_solicitudes_pendientes,
        estudiantes=todos_proyectos,
    )


@router.post("/reportes/{reporte_id}/aval")
def dar_aval_reporte(
    reporte_id: int,
    observaciones: Optional[str] = None,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    El director da aval a un reporte semestral de un estudiante.
    """
    persona = get_current_user(db, token)
    if not persona:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    reporte = db.query(ReporteSemestral).filter(ReporteSemestral.id == reporte_id).first()
    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    # Verificar que sea el director del proyecto
    proyecto = reporte.proyecto
    if proyecto.id_director != persona.id and proyecto.id_codirector != persona.id:
        raise HTTPException(status_code=403, detail="No tiene permiso para avalar este reporte")

    from datetime import datetime
    reporte.aval_director = 1
    reporte.fecha_aval = datetime.utcnow()
    reporte.observaciones_director = observaciones
    db.commit()

    return {"mensaje": "Aval registrado exitosamente"}
