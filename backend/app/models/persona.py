from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Persona(Base):
    """
    Entidad base para todos los actores del sistema.
    Una persona puede tener múltiples roles simultáneamente.
    """
    __tablename__ = "persona"
    
    id = Column(Integer, primary_key=True, index=True)
    email_institucional = Column(String(255), unique=True, nullable=False, index=True)
    nombre_completo = Column(String(255), nullable=False)
    documento_identidad = Column(String(50), unique=True)
    telefono = Column(String(50))
    linkedin_id = Column(String(255))
    
    # Contraseña hasheada
    hashed_password = Column(String(255))
    
    # Auditoría
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones (comentamos VinculacionActiva por ahora)
    # vinculaciones = relationship("VinculacionActiva", back_populates="persona")
    
    # La relación con estudiante_info ya existe por el backref en Estudiante
    
    def __repr__(self):
        return f"<Persona {self.nombre_completo} - {self.email_institucional}>"