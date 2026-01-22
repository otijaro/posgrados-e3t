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
from app.models.proyecto import (  # ✅ Nuevo
    ProyectoGrado,
    PropuestaTesis,
    ReporteSemestral,
    EvaluacionJurado,
    EstadoProyecto,
    EstadoPropuesta,
    TipoDocumento
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
    "EstadoInscripcion",
    "ProyectoGrado",  # ✅ Nuevo
    "PropuestaTesis",  # ✅ Nuevo
    "ReporteSemestral",  # ✅ Nuevo
    "EvaluacionJurado",  # ✅ Nuevo
    "EstadoProyecto",  # ✅ Nuevo
    "EstadoPropuesta",  # ✅ Nuevo
    "TipoDocumento"  # ✅ Nuevo
]