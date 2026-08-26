from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from app.database import get_db
from app.models import ProgramaPosgrado
from app.models.programa import GrupoInvestigacion
from app.schemas import ProgramaResponse

router = APIRouter(prefix="/programas", tags=["Programas"])


@router.get("", response_model=List[ProgramaResponse])
def listar_programas(db: Session = Depends(get_db)):
    programas = db.query(ProgramaPosgrado).filter(
        ProgramaPosgrado.activo == 1
    ).order_by(ProgramaPosgrado.nivel, ProgramaPosgrado.nombre).all()
    return programas


@router.get("/grupos-investigacion")
def listar_grupos(db: Session = Depends(get_db)):
    grupos = db.query(GrupoInvestigacion).filter(
        GrupoInvestigacion.activo == 1
    ).order_by(GrupoInvestigacion.nombre).all()
    return [{"id": g.id, "nombre": g.nombre} for g in grupos]


@router.get("/grupos-investigacion/{grupo_nombre}/miembros")
def miembros_grupo(grupo_nombre: str, db: Session = Depends(get_db)):
    """Retorna docentes y estudiantes de un grupo de investigación."""

    # Docentes — personas que son directores/codirectores de proyectos
    # cuyo proyecto tiene ese grupo asignado
    docentes = db.execute(text("""
        SELECT DISTINCT p.nombre_completo, p.email_institucional,
               COUNT(DISTINCT CASE WHEN pg.id_director = p.id THEN pg.id END) AS como_director,
               COUNT(DISTINCT CASE WHEN pg.id_codirector = p.id THEN pg.id END) AS como_codirector
        FROM persona p
        JOIN proyecto_grado pg ON (pg.id_director = p.id OR pg.id_codirector = p.id)
        JOIN grupo_investigacion gi ON gi.id = pg.id_grupo_inv
        WHERE gi.nombre = :nombre
        GROUP BY p.id, p.nombre_completo, p.email_institucional
        ORDER BY p.nombre_completo
    """), {"nombre": grupo_nombre}).fetchall()

    # Estudiantes
    estudiantes = db.execute(text("""
        SELECT p.nombre_completo, e.codigo_estudiante,
               pr.nombre AS programa, pg.titulo
        FROM persona p
        JOIN estudiante e ON e.id_persona = p.id
        JOIN proyecto_grado pg ON pg.id_estudiante = e.id
        JOIN grupo_investigacion gi ON gi.id = pg.id_grupo_inv
        LEFT JOIN programa_posgrado pr ON pr.id = e.id_programa
        WHERE gi.nombre = :nombre
        ORDER BY p.nombre_completo
    """), {"nombre": grupo_nombre}).fetchall()

    return {
        "docentes": [
            {
                "nombre":          r.nombre_completo,
                "email":           r.email_institucional,
                "como_director":   r.como_director,
                "como_codirector": r.como_codirector,
            }
            for r in docentes
        ],
        "estudiantes": [
            {
                "nombre":          r.nombre_completo,
                "codigo":          r.codigo_estudiante,
                "programa":        r.programa,
                "titulo_proyecto": r.titulo,
            }
            for r in estudiantes
        ],
    }
