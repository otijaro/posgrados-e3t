from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class NivelPrograma(str, enum.Enum):
    """Niveles de formación posgradual."""
    ESPECIALIZACION = "especializacion"
    MAESTRIA = "maestria"
    DOCTORADO = "doctorado"


class Facultad(Base):
    """Facultad de la universidad."""
    __tablename__ = "facultad"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False, unique=True)
    codigo = Column(String(20), unique=True)
    
    # Relaciones
    escuelas = relationship("Escuela", back_populates="facultad")
    
    def __repr__(self):
        return f"<Facultad {self.nombre}>"


class Escuela(Base):
    """Escuela dentro de una facultad. Ejemplo: E3T."""
    __tablename__ = "escuela"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    codigo = Column(String(20), unique=True)
    id_facultad = Column(Integer, ForeignKey("facultad.id"), nullable=False)
    
    # Relaciones
    facultad = relationship("Facultad", back_populates="escuelas")
    programas = relationship("ProgramaPosgrado", back_populates="escuela")
    grupos_investigacion = relationship("GrupoInvestigacion", back_populates="escuela")
    
    def __repr__(self):
        return f"<Escuela {self.nombre}>"


class GrupoInvestigacion(Base):
    """Grupos de investigación vinculados a la escuela."""
    __tablename__ = "grupo_investigacion"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    codigo_minciencias = Column(String(50), unique=True)
    id_escuela = Column(Integer, ForeignKey("escuela.id"), nullable=False)
    descripcion = Column(Text)
    activo = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    escuela = relationship("Escuela", back_populates="grupos_investigacion")
    proyectos = relationship("ProyectoGrado", back_populates="grupo_investigacion")  # Comentado por ahora
    
    def __repr__(self):
        return f"<GrupoInvestigacion {self.nombre}>"


class ProgramaPosgrado(Base):
    """
    Programas de posgrado.
    Ejemplos: Maestría en Ingeniería Electrónica, Doctorado en Ingeniería.
    """
    __tablename__ = "programa_posgrado"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(300), nullable=False)
    codigo_snies = Column(String(20), unique=True)
    nivel = Column(Enum(NivelPrograma), nullable=False)
    id_escuela = Column(Integer, ForeignKey("escuela.id"), nullable=False)
    
    # Requisitos básicos
    creditos_totales = Column(Integer)
    creditos_obligatorios = Column(Integer)
    creditos_electivos = Column(Integer)
    creditos_investigacion = Column(Integer)
    duracion_semestres = Column(Integer)
    requiere_tesis = Column(Integer, default=1)
    requiere_idioma = Column(Integer, default=1)
    
    descripcion = Column(Text)
    activo = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    escuela = relationship("Escuela", back_populates="programas")
    cohortes = relationship("Cohorte", back_populates="programa")
    proyectos = relationship("ProyectoGrado", back_populates="programa")  # Comentado por ahora
    materias = relationship("Materia", back_populates="programa")
    
    def __repr__(self):
        return f"<ProgramaPosgrado {self.nombre}>"


class Cohorte(Base):
    """
    Cohorte de ingreso de estudiantes a un programa.
    Ejemplo: Maestría Electrónica 2024-1
    """
    __tablename__ = "cohorte"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    id_programa = Column(Integer, ForeignKey("programa_posgrado.id"), nullable=False)
    anio = Column(Integer, nullable=False)
    periodo = Column(Integer, nullable=False)
    fecha_inicio = Column(String(10))
    activo = Column(Integer, default=1)
    
    # Relaciones
    programa = relationship("ProgramaPosgrado", back_populates="cohortes")
    estudiantes = relationship("Estudiante", back_populates="cohorte")
    
    def __repr__(self):
        return f"<Cohorte {self.nombre} - {self.programa.nombre}>"


class Materia(Base):
    """
    Materias/asignaturas del programa de posgrado.
    Catálogo de materias que se pueden cursar.
    """
    __tablename__ = "materia"
    
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, nullable=False)
    nombre = Column(String(300), nullable=False)
    creditos = Column(Integer, nullable=False)
    id_programa = Column(Integer, ForeignKey("programa_posgrado.id"), nullable=False)
    
    # Tipo de materia
    es_obligatoria = Column(Integer, default=1)
    semestre_sugerido = Column(Integer)
    
    descripcion = Column(Text)
    prerequisitos = Column(Text)
    activo = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    programa = relationship("ProgramaPosgrado", back_populates="materias")
    inscripciones = relationship("InscripcionMateria", back_populates="materia")
    
    def __repr__(self):
        return f"<Materia {self.codigo} - {self.nombre}>"