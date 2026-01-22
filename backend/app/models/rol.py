from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class CatalogoRol(Base):
    """
    Catálogo de roles funcionales del sistema.
    Define qué puede hacer cada rol.
    """
    __tablename__ = "catalogo_rol"
    
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=False)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    
    # Permisos y restricciones (JSON)
    permisos = Column(Text)
    
    # Niveles académicos que puede tener este rol
    nivel_minimo = Column(String(50))
    requiere_titulo = Column(Integer, default=0)
    
    activo = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    vinculaciones = relationship("VinculacionActiva", back_populates="rol")
    
    def __repr__(self):
        return f"<CatalogoRol {self.codigo}>"


class VinculacionActiva(Base):
    """
    Vinculación de una persona a un rol en un contexto específico.
    """
    __tablename__ = "vinculacion_activa"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Quién tiene el rol
    id_persona = Column(Integer, ForeignKey("persona.id"), nullable=False)
    
    # Qué rol tiene
    id_rol = Column(Integer, ForeignKey("catalogo_rol.id"), nullable=False)
    
    # En qué contexto
    tipo_contexto = Column(String(50), nullable=False)
    id_contexto = Column(Integer, nullable=False)
    
    # Vigencia
    fecha_inicio = Column(DateTime, nullable=False, default=datetime.utcnow)
    fecha_fin = Column(DateTime, nullable=True)
    es_activo = Column(Integer, default=1)
    
    # Información adicional
    observaciones = Column(Text)
    
    # Auditoría
    asignado_por = Column(Integer, ForeignKey("persona.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones - AQUÍ ESTÁ LA CORRECCIÓN
    persona = relationship(
        "Persona", 
        foreign_keys=[id_persona],  # ✅ Especificar cuál FK usar
        back_populates="vinculaciones"
    )
    rol = relationship("CatalogoRol", back_populates="vinculaciones")
    asignado_por_persona = relationship(
        "Persona", 
        foreign_keys=[asignado_por]  # ✅ Especificar la otra FK
    )
    
    def __repr__(self):
        return f"<Vinculacion {self.persona.nombre_completo} - {self.rol.codigo}>"