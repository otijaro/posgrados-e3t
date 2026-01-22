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
from app.models.proyecto import (
    ProyectoGrado,
    PropuestaTesis,
    ReporteSemestral,
    EvaluacionJurado,
    EstadoProyecto,
    EstadoPropuesta,
    TipoDocumento
)
from app.models.rol import (  # ✅ Nuevo
    CatalogoRol,
    VinculacionActiva
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
    "ProyectoGrado",
    "PropuestaTesis",
    "ReporteSemestral",
    "EvaluacionJurado",
    "EstadoProyecto",
    "EstadoPropuesta",
    "TipoDocumento",
    "CatalogoRol",  # ✅ Nuevo
    "VinculacionActiva"  # ✅ Nuevo
]