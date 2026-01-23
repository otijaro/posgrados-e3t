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
from app.models.rol import (
    CatalogoRol,
    VinculacionActiva
)
from app.models.solicitud import (  # ✅ Nuevo
    Solicitud,
    FlujoAprobacion,
    CreditoCondonable,
    CalendarioSolicitud,
    TipoSolicitud,
    CategoriasSolicitud,
    EstadoSolicitud,
    NivelAprobacion
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
    "CatalogoRol",
    "VinculacionActiva",
    "Solicitud",  # ✅ Nuevo
    "FlujoAprobacion",  # ✅ Nuevo
    "CreditoCondonable",  # ✅ Nuevo
    "CalendarioSolicitud",  # ✅ Nuevo
    "TipoSolicitud",  # ✅ Nuevo
    "CategoriasSolicitud",  # ✅ Nuevo
    "EstadoSolicitud",  # ✅ Nuevo
    "NivelAprobacion"  # ✅ Nuevo
]