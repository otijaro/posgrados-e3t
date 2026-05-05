from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models import Estudiante, ProyectoGrado
from app.services.auth import get_current_user

router = APIRouter(prefix="/estudiante", tags=["Estudiante"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class ProyectoInfo(BaseModel):
    titulo: str
    estado: str
    director: str
    codirector: Optional[str]
    ultimo_reporte: Optional[str]

    class Config:
        from_attributes = True


class EstudianteInfo(BaseModel):
    codigo_estudiante: str
    programa: str
    semestre_actual: int
    promedio_acumulado: Optional[str]
    estado: str
    fecha_max_graduacion: Optional[str]
    cohorte: str
    proyecto: Optional[ProyectoInfo]

    class Config:
        from_attributes = True


@router.get("/mi-perfil", response_model=EstudianteInfo)
def mi_perfil(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Devuelve los datos académicos del estudiante autenticado.
    """
    persona = get_current_user(db, token)
    if not persona:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    estudiante = db.query(Estudiante).filter(
        Estudiante.id_persona == persona.id
    ).first()

    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró un registro de estudiante para este usuario"
        )

    # Datos del proyecto
    proyecto_info = None
    if estudiante.proyecto:
        p = estudiante.proyecto
        director_nombre = p.director.nombre_completo if p.director else None
        codirector_nombre = p.codirector.nombre_completo if p.codirector else None

        # Último reporte
        ultimo_reporte = None
        if p.reportes:
            ultimo = sorted(p.reportes, key=lambda r: r.fecha_carga, reverse=True)[0]
            ultimo_reporte = ultimo.periodo

        proyecto_info = ProyectoInfo(
            titulo=p.titulo,
            estado=p.estado.value,
            director=director_nombre or "Sin director registrado",
            codirector=codirector_nombre,
            ultimo_reporte=ultimo_reporte,
        )

    fecha_max = None
    if estudiante.fecha_max_graduacion:
        fecha_max = estudiante.fecha_max_graduacion.strftime("%Y-%m-%d")

    cohorte_nombre = estudiante.cohorte.nombre if estudiante.cohorte else "—"
    programa_nombre = estudiante.programa.nombre if estudiante.programa else "—"

    return EstudianteInfo(
        codigo_estudiante=estudiante.codigo_estudiante,
        programa=programa_nombre,
        semestre_actual=estudiante.semestre_actual,
        promedio_acumulado=estudiante.promedio_acumulado,
        estado=estudiante.estado.value,
        fecha_max_graduacion=fecha_max,
        cohorte=cohorte_nombre,
        proyecto=proyecto_info,
    )
