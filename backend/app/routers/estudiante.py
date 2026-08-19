from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os, shutil

from app.database import get_db
from app.models import Estudiante, ProyectoGrado, Persona
from app.models.proyecto import TipoDocumento
from app.services.auth import get_current_user

router = APIRouter(prefix="/estudiante", tags=["Estudiante"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

UPLOAD_DIR_FOTOS = "uploads/perfiles"
os.makedirs(UPLOAD_DIR_FOTOS, exist_ok=True)


class ProyectoInfo(BaseModel):
    titulo: str
    estado: str
    director: str
    director_correo: Optional[str] = None
    codirector: Optional[str]
    codirector_correo: Optional[str] = None
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
            director_correo=p.director.email_institucional if p.director else None,
            codirector=codirector_nombre,
            codirector_correo=p.codirector.email_institucional if p.codirector else None,
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


# ── Actualizar perfil (título, director, codirector) ───────────────────────

class ActualizarPerfilBody(BaseModel):
    titulo: Optional[str] = None
    director_nombre: Optional[str] = None
    director_correo: Optional[str] = None
    codirector_nombre: Optional[str] = None
    codirector_correo: Optional[str] = None
    promedio_acumulado: Optional[str] = None


def _buscar_o_crear_persona(db: Session, nombre: str, correo: str) -> Persona:
    """
    Busca una Persona por correo (sin distinguir mayúsculas). Si no existe,
    crea una nueva solo con nombre y correo (sin rol asignado, como los
    directores/codirectores creados desde solicitudes).
    """
    persona = db.query(Persona).filter(
        func.lower(Persona.email_institucional) == correo.lower()
    ).first()
    if persona:
        # Si el nombre cambió (ej. estaba mal escrito), lo actualizamos.
        if nombre and persona.nombre_completo != nombre:
            persona.nombre_completo = nombre
        return persona

    nueva = Persona(nombre_completo=nombre, email_institucional=correo)
    db.add(nueva)
    db.flush()
    return nueva


@router.put("/perfil")
def actualizar_perfil(
    body: ActualizarPerfilBody,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    Permite al estudiante actualizar el título de su tesis/proyecto y los
    datos de contacto de su director/codirector directamente desde su perfil
    (sin pasar por el flujo formal de aprobación de solicitudes).
    """
    persona = get_current_user(db, token)
    if not persona:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    estudiante = db.query(Estudiante).filter(Estudiante.id_persona == persona.id).first()
    if not estudiante:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontró registro de estudiante")

    if body.promedio_acumulado is not None:
        try:
            valor = float(body.promedio_acumulado)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El promedio debe ser un número (ej. 4.5)")
        if not (0 <= valor <= 5):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El promedio debe estar entre 0.0 y 5.0")
        estudiante.promedio_acumulado = f"{valor:.1f}"

    proyecto = estudiante.proyecto

    if not proyecto:
        # Si aún no tiene proyecto, se necesita al menos título y director para crear uno.
        if not body.titulo or not body.director_nombre or not body.director_correo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Para registrar tu proyecto por primera vez, indica al menos el título y el director (nombre y correo)."
            )
        director = _buscar_o_crear_persona(db, body.director_nombre, body.director_correo)
        codirector = None
        if body.codirector_nombre and body.codirector_correo:
            codirector = _buscar_o_crear_persona(db, body.codirector_nombre, body.codirector_correo)

        nivel_doctorado = estudiante.programa and "doctorado" in estudiante.programa.nombre.lower()
        proyecto = ProyectoGrado(
            titulo=body.titulo,
            id_estudiante=estudiante.id,
            id_director=director.id,
            id_codirector=codirector.id if codirector else None,
            id_programa=estudiante.id_programa,
            tipo_documento=TipoDocumento.PROPUESTA_TESIS if nivel_doctorado else TipoDocumento.PLAN_INVESTIGACION,
        )
        db.add(proyecto)
    else:
        if body.titulo:
            proyecto.titulo = body.titulo
        if body.director_nombre and body.director_correo:
            director = _buscar_o_crear_persona(db, body.director_nombre, body.director_correo)
            proyecto.id_director = director.id
        if body.codirector_nombre and body.codirector_correo:
            codirector = _buscar_o_crear_persona(db, body.codirector_nombre, body.codirector_correo)
            proyecto.id_codirector = codirector.id
        proyecto.updated_at = datetime.utcnow()

    db.commit()
    return {"mensaje": "Perfil actualizado correctamente"}


# ── Foto de perfil ────────────────────────────────────────────────────

TIPOS_IMAGEN_PERMITIDOS = {"image/jpeg", "image/png", "image/webp"}

@router.post("/foto-perfil")
async def subir_foto_perfil(
    foto: UploadFile = File(...),
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """Sube/reemplaza la foto de perfil del usuario autenticado."""
    persona = get_current_user(db, token)
    if not persona:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    if foto.content_type not in TIPOS_IMAGEN_PERMITIDOS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Solo se permiten imágenes JPG, PNG o WEBP")

    extension = os.path.splitext(foto.filename or "")[1] or ".jpg"
    filename = f"persona_{persona.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}{extension}"
    ruta = os.path.join(UPLOAD_DIR_FOTOS, filename)

    with open(ruta, "wb") as buffer:
        shutil.copyfileobj(foto.file, buffer)

    persona.foto_url = f"/uploads/perfiles/{filename}"
    db.commit()

    return {"mensaje": "Foto actualizada", "foto_url": persona.foto_url}


# ── Docentes disponibles (para elegir director/codirector) ──────────────────

class DocenteOpcion(BaseModel):
    id: int
    nombre_completo: str
    email_institucional: str

    class Config:
        from_attributes = True


@router.get("/docentes-disponibles", response_model=list[DocenteOpcion])
def docentes_disponibles(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    Lista de docentes/directores ya registrados en el sistema, para elegir
    de un desplegable en vez de escribir el nombre a mano. Si el director
    o codirector es externo a la escuela, el estudiante puede marcarlo como
    tal y escribir el nombre libremente (pero el correo siempre se escribe).
    """
    persona = get_current_user(db, token)
    if not persona:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    from app.models import VinculacionActiva, CatalogoRol

    filas = (
        db.query(Persona)
        .join(VinculacionActiva, VinculacionActiva.id_persona == Persona.id)
        .join(CatalogoRol, CatalogoRol.id == VinculacionActiva.id_rol)
        .filter(
            VinculacionActiva.es_activo == 1,
            CatalogoRol.codigo.in_([
                "director", "codirector", "docente", "coordinador_grupo",
                "prof_catedra", "prof_planta", "evaluador",
            ]),
        )
        .distinct()
        .order_by(Persona.nombre_completo)
        .all()
    )
    return filas
