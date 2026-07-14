from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import or_, text
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models import (
    Solicitud, FlujoAprobacion, Estudiante, Persona,
    EstadoSolicitud, NivelAprobacion, VinculacionActiva, CatalogoRol,
    ProyectoGrado
)
from app.models.programa import GrupoInvestigacion
from app.services.auth import get_current_user

router = APIRouter(prefix="/coordinador", tags=["Coordinador"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Query reutilizable para obtener IDs de docentes
QUERY_IDS_DOCENTES = """
    SELECT DISTINCT p.id
    FROM persona p
    LEFT JOIN vinculacion_activa va ON va.id_persona = p.id AND va.es_activo = 1
    LEFT JOIN catalogo_rol cr ON cr.id = va.id_rol
    LEFT JOIN proyecto_grado pg_d ON pg_d.id_director   = p.id
    LEFT JOIN proyecto_grado pg_c ON pg_c.id_codirector = p.id
    WHERE cr.codigo IN (
        'director', 'codirector', 'docente', 'coordinador_grupo',
        'prof_catedra', 'prof_planta', 'evaluador'
    )
    OR pg_d.id IS NOT NULL
    OR pg_c.id IS NOT NULL
    ORDER BY p.id
"""


def _get_coordinador(token: str, db: Session) -> Persona:
    persona = get_current_user(db, token)
    if not persona:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    return persona


class AccionSolicitudBody(BaseModel):
    accion: str
    observaciones: Optional[str] = None


# ── GET resumen ───────────────────────────────────────────────────────────────

@router.get("/resumen")
def resumen_coordinador(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    _get_coordinador(token, db)
    total_estudiantes      = db.query(Estudiante).count()
    total_solicitudes      = db.query(Solicitud).count()
    solicitudes_pendientes = db.query(Solicitud).filter(Solicitud.estado == EstadoSolicitud.ENVIADA).count()
    solicitudes_aprobadas  = db.query(Solicitud).filter(Solicitud.estado == EstadoSolicitud.APROBADA).count()
    solicitudes_rechazadas = db.query(Solicitud).filter(Solicitud.estado == EstadoSolicitud.RECHAZADA).count()

    total_docentes = db.execute(
        text(f"SELECT COUNT(*) FROM ({QUERY_IDS_DOCENTES}) sub")
    ).scalar() or 0

    return {
        "total_estudiantes":      total_estudiantes,
        "total_docentes":         total_docentes,
        "total_solicitudes":      total_solicitudes,
        "solicitudes_pendientes": solicitudes_pendientes,
        "solicitudes_aprobadas":  solicitudes_aprobadas,
        "solicitudes_rechazadas": solicitudes_rechazadas,
    }


# ── GET solicitudes ───────────────────────────────────────────────────────────

@router.get("/solicitudes")
def listar_solicitudes(
    estado: Optional[str] = None,
    tipo: Optional[str] = None,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    _get_coordinador(token, db)
    query = db.query(Solicitud)
    if estado: query = query.filter(Solicitud.estado == estado)
    if tipo:   query = query.filter(Solicitud.tipo_solicitud == tipo)

    resultado = []
    for s in query.order_by(Solicitud.fecha_creacion.desc()).all():
        resultado.append({
            "id":                 s.id,
            "numero_radicado":    s.numero_radicado,
            "tipo_solicitud":     s.tipo_solicitud.value,
            "asunto":             s.asunto,
            "descripcion":        s.descripcion,
            "estado":             s.estado.value,
            "nivel_aprobacion":   s.nivel_aprobacion_requerido.value,
            "fecha_creacion":     s.fecha_creacion.strftime("%Y-%m-%d %H:%M") if s.fecha_creacion else None,
            "fecha_envio":        s.fecha_envio.strftime("%Y-%m-%d") if s.fecha_envio else None,
            "solicitante_nombre": s.solicitante.nombre_completo if s.solicitante else "—",
            "solicitante_email":  s.solicitante.email_institucional if s.solicitante else "—",
            "codigo_estudiante":  s.estudiante.codigo_estudiante if s.estudiante else None,
            "documento":          s.documentos_adjuntos,
            "programa":           s.programa.nombre if s.programa else "—",
        })
    return resultado


# ── POST acción sobre solicitud ───────────────────────────────────────────────

@router.post("/solicitudes/{solicitud_id}/accion")
def accion_solicitud(
    solicitud_id: int,
    body: AccionSolicitudBody,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    coordinador = _get_coordinador(token, db)
    solicitud = db.query(Solicitud).filter(Solicitud.id == solicitud_id).first()
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    acciones_validas = {"aprobar", "rechazar", "devolver", "pasar_comite"}
    if body.accion not in acciones_validas:
        raise HTTPException(status_code=400, detail=f"Acción inválida. Opciones: {acciones_validas}")

    estado_map = {
        "aprobar":      EstadoSolicitud.APROBADA,
        "rechazar":     EstadoSolicitud.RECHAZADA,
        "devolver":     EstadoSolicitud.DEVUELTA,
        "pasar_comite": EstadoSolicitud.EN_COMITE,
    }
    solicitud.estado              = estado_map[body.accion]
    solicitud.respuesta           = body.observaciones
    solicitud.id_quien_responde   = coordinador.id

    if body.accion == "aprobar":
        solicitud.fecha_aprobacion = datetime.utcnow()
    elif body.accion == "rechazar":
        solicitud.fecha_rechazo    = datetime.utcnow()

    flujo_actual = db.query(FlujoAprobacion).filter(
        FlujoAprobacion.id_solicitud == solicitud_id,
        FlujoAprobacion.orden == 1,
    ).first()
    if flujo_actual:
        flujo_actual.estado          = body.accion
        flujo_actual.fecha_respuesta = datetime.utcnow()
        flujo_actual.comentarios     = body.observaciones

    db.commit()
    return {
        "mensaje":        f"Solicitud {body.accion}da exitosamente",
        "numero_radicado": solicitud.numero_radicado,
        "nuevo_estado":    solicitud.estado.value,
    }


# ── GET estudiantes ───────────────────────────────────────────────────────────

@router.get("/estudiantes")
def listar_estudiantes(
    programa: Optional[str] = None,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    _get_coordinador(token, db)
    resultado = []
    for est in db.query(Estudiante).all():
        if programa and est.programa and programa.lower() not in est.programa.nombre.lower():
            continue
        director = codirector = titulo = estado_proyecto = None
        if est.proyecto:
            director        = est.proyecto.director.nombre_completo   if est.proyecto.director   else None
            codirector      = est.proyecto.codirector.nombre_completo if est.proyecto.codirector else None
            titulo          = est.proyecto.titulo
            estado_proyecto = est.proyecto.estado.value
        resultado.append({
            "id":                   est.id,
            "nombre":               est.persona.nombre_completo,
            "email":                est.persona.email_institucional,
            "codigo":               est.codigo_estudiante,
            "programa":             est.programa.nombre if est.programa else "—",
            "semestre":             est.semestre_actual,
            "estado":               est.estado.value,
            "cohorte":              est.cohorte.nombre if est.cohorte else "—",
            "fecha_max_graduacion": est.fecha_max_graduacion.strftime("%Y-%m-%d") if est.fecha_max_graduacion else None,
            "director":             director,
            "codirector":           codirector,
            "titulo_proyecto":      titulo,
            "estado_proyecto":      estado_proyecto,
        })
    return resultado


# ── GET docentes (TODOS los profesores registrados) ───────────────────────────

@router.get("/docentes")
def listar_docentes(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    _get_coordinador(token, db)

    ids_personas = [
        r[0] for r in db.execute(text(QUERY_IDS_DOCENTES)).fetchall()
    ]

    # Mapa persona → proyectos que dirige o codirige
    proyectos = db.query(ProyectoGrado).all()
    mapa: dict = {}
    for p in proyectos:
        for id_persona, rol in [(p.id_director, "director"), (p.id_codirector, "codirector")]:
            if not id_persona:
                continue
            if id_persona not in mapa:
                mapa[id_persona] = {"director": [], "codirector": []}
            mapa[id_persona][rol].append(p)

    resultado = []
    for id_persona in ids_personas:
        persona = db.query(Persona).filter(Persona.id == id_persona).first()
        if not persona:
            continue

        roles = (
            db.query(CatalogoRol.nombre)
            .join(VinculacionActiva, VinculacionActiva.id_rol == CatalogoRol.id)
            .filter(VinculacionActiva.id_persona == id_persona, VinculacionActiva.es_activo == 1)
            .all()
        )

        data = mapa.get(id_persona, {"director": [], "codirector": []})

        estudiantes = []
        for proyecto in data["director"] + data["codirector"]:
            est = proyecto.estudiante
            if not est:
                continue
            estudiantes.append({
                "nombre":          est.persona.nombre_completo,
                "codigo":          est.codigo_estudiante,
                "programa":        proyecto.programa.nombre if proyecto.programa else "—",
                "titulo_proyecto": proyecto.titulo,
                "estado_proyecto": proyecto.estado.value,
                "rol_docente":     "director" if proyecto in data["director"] else "codirector",
                "semestre":        est.semestre_actual,
            })

        grupo = db.execute(text("""
            SELECT nombre FROM grupo_investigacion
            WHERE id_director = :id AND activo = 1
            LIMIT 1
        """), {"id": id_persona}).fetchone()

        resultado.append({
            "id":                  id_persona,
            "nombre":              persona.nombre_completo,
            "email":               persona.email_institucional,
            "roles":               [r[0] for r in roles] if roles else ["Docente"],
            "como_director":       len(data["director"]),
            "como_codirector":     len(data["codirector"]),
            "total_estudiantes":   len(data["director"]) + len(data["codirector"]),
            "grupo_investigacion": grupo[0] if grupo else None,
            "es_dir_grupo":        grupo is not None,
            "estudiantes":         estudiantes,
        })

    resultado.sort(key=lambda x: x["nombre"])
    return resultado
