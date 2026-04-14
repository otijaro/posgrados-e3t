from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.solicitud import TipoSolicitud, CategoriasSolicitud, EstadoSolicitud, NivelAprobacion


class SolicitudEvaluacionCreate(BaseModel):
    """Schema para crear una solicitud de evaluación."""
    nombre_completo: str
    codigo: str
    director: str
    codirector: Optional[str] = None
    titulo: str
    resumen: str
    posibles_jurados: str
    id_programa: int
    tipo_evaluacion: str  # "Propuesta de Investigación", "Trabajo Final...", etc.
    url_documento: Optional[str] = None  # URL del PDF subido


class SolicitudResponse(BaseModel):
    """Schema de respuesta para una solicitud."""
    id: int
    numero_radicado: Optional[str]
    tipo_solicitud: TipoSolicitud
    categoria: CategoriasSolicitud
    asunto: str
    descripcion: str
    estado: EstadoSolicitud
    nivel_aprobacion_requerido: NivelAprobacion
    fecha_creacion: datetime
    fecha_envio: Optional[datetime]

    class Config:
        from_attributes = True


class SolicitudListResponse(BaseModel):
    """Schema resumido para listar solicitudes."""
    id: int
    numero_radicado: Optional[str]
    tipo_solicitud: str
    asunto: str
    estado: str
    fecha_creacion: datetime

    class Config:
        from_attributes = True
