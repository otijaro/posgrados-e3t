from typing import Optional
from pydantic import BaseModel


class ProgramaResponse(BaseModel):
    """Schema de respuesta para un programa."""
    id: int
    nombre: str
    nivel: str
    codigo_snies: Optional[str] = None
    creditos_totales: Optional[int] = None
    duracion_semestres: Optional[int] = None

    class Config:
        from_attributes = True
