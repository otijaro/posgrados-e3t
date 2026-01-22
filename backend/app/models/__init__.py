from app.database import Base
from app.models.persona import Persona
from app.models.programa import (
    Facultad,
    Escuela,
    GrupoInvestigacion,
    ProgramaPosgrado,
    Cohorte,
    Materia,
    NivelPrograma
)
from app.models.estudiante import (
    Estudiante,
    InscripcionMateria,
    RequisitoGrado,
    EstadoEstudiante,
    TipoInscripcion,
    EstadoInscripcion
)

__all__ = [
    "Base",
    "Persona",
    "Facultad",
    "Escuela",
    "GrupoInvestigacion",
    "ProgramaPosgrado",
    "Cohorte",
    "Materia",
    "NivelPrograma",
    "Estudiante",
    "InscripcionMateria",
    "RequisitoGrado",
    "EstadoEstudiante",
    "TipoInscripcion",
    "EstadoInscripcion"
]