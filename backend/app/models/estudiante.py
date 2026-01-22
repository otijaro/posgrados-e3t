from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class EstadoEstudiante(str, enum.Enum):
    """Estados académicos del estudiante."""
    ASPIRANTE = "aspirante"  # Admitido pero no matriculado
    ACTIVO = "activo"  # Cursando normalmente
    CONDICIONAL = "condicional"  # Bajo rendimiento académico
    RESERVA = "reserva"  # Suspensión temporal aprobada
    GRADUADO = "graduado"
    RETIRADO = "retirado"
    CANCELADO = "cancelado"


class TipoInscripcion(str, enum.Enum):
    """Tipos de inscripción de materia."""
    PRIMERA_VEZ = "primera_vez"
    REPITIENDO = "repitiendo"
    VALIDACION = "validacion"  # Convalidación de otra universidad


class EstadoInscripcion(str, enum.Enum):
    """Estado de la inscripción a una materia."""
    INSCRITO = "inscrito"  # Inscrito pero no ha terminado el semestre
    APROBADO = "aprobado"
    REPROBADO = "reprobado"
    CANCELADO = "cancelado"  # Canceló la materia en el semestre


class Estudiante(Base):
    """
    Extensión de Persona para datos específicos del estudiante.
    Un estudiante pertenece a un programa y cohorte específicos.
    """
    __tablename__ = "estudiante"
    
    id = Column(Integer, primary_key=True, index=True)
    id_persona = Column(Integer, ForeignKey("persona.id"), nullable=False, unique=True)
    id_programa = Column(Integer, ForeignKey("programa_posgrado.id"), nullable=False)
    id_cohorte = Column(Integer, ForeignKey("cohorte.id"), nullable=False)
    
    # Información académica
    codigo_estudiante = Column(String(20), unique=True, nullable=False)  # Código UIS
    estado = Column(SQLEnum(EstadoEstudiante), default=EstadoEstudiante.ACTIVO)
    semestre_actual = Column(Integer, default=1)  # En qué semestre va
    promedio_acumulado = Column(String(10))  # "4.5", se calcula
    
    # Financiación
    tiene_beca = Column(Integer, default=0)
    tipo_beca = Column(String(100))  # "Condonable", "Asistente", etc.
    
    # Fechas importantes
    fecha_ingreso = Column(DateTime)
    fecha_max_graduacion = Column(DateTime)  # Límite según reglamento
    fecha_grado = Column(DateTime, nullable=True)
    
    # Observaciones
    observaciones = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    persona = relationship("Persona", backref="estudiante_info")
    programa = relationship("ProgramaPosgrado")
    cohorte = relationship("Cohorte", back_populates="estudiantes")
    inscripciones = relationship("InscripcionMateria", back_populates="estudiante")
    requisitos = relationship("RequisitoGrado", back_populates="estudiante")
    #proyecto = relationship("ProyectoGrado", back_populates="estudiante", uselist=False)
    
    def __repr__(self):
        return f"<Estudiante {self.codigo_estudiante} - {self.persona.nombre_completo}>"


class InscripcionMateria(Base):
    """
    Inscripción de un estudiante a una materia en un periodo específico.
    Historial académico del estudiante.
    """
    __tablename__ = "inscripcion_materia"
    
    id = Column(Integer, primary_key=True, index=True)
    id_estudiante = Column(Integer, ForeignKey("estudiante.id"), nullable=False)
    id_materia = Column(Integer, ForeignKey("materia.id"), nullable=False)
    
    # Periodo académico
    anio = Column(Integer, nullable=False)  # 2024
    periodo = Column(Integer, nullable=False)  # 1 o 2
    periodo_completo = Column(String(10))  # "2024-1" (para búsquedas fáciles)
    
    # Tipo y estado
    tipo_inscripcion = Column(SQLEnum(TipoInscripcion), default=TipoInscripcion.PRIMERA_VEZ)
    estado = Column(SQLEnum(EstadoInscripcion), default=EstadoInscripcion.INSCRITO)
    
    # Calificación
    nota_final = Column(String(10))  # "4.5", "3.0", etc.
    nota_aprobacion = Column(String(10), default="3.0")  # Mínima para aprobar
    
    # Auditoría
    fecha_inscripcion = Column(DateTime, default=datetime.utcnow)
    fecha_calificacion = Column(DateTime, nullable=True)
    
    # Relaciones
    estudiante = relationship("Estudiante", back_populates="inscripciones")
    materia = relationship("Materia", back_populates="inscripciones")
    
    def __repr__(self):
        return f"<Inscripcion {self.estudiante.codigo_estudiante} - {self.materia.codigo} ({self.periodo_completo})>"


class RequisitoGrado(Base):
    """
    Requisitos de grado del estudiante.
    Checklist de cumplimiento para graduarse.
    """
    __tablename__ = "requisito_grado"
    
    id = Column(Integer, primary_key=True, index=True)
    id_estudiante = Column(Integer, ForeignKey("estudiante.id"), nullable=False)
    
    # Requisitos académicos
    creditos_obligatorios_cumplidos = Column(Integer, default=0)
    creditos_electivos_cumplidos = Column(Integer, default=0)
    creditos_investigacion_cumplidos = Column(Integer, default=0)
    
    # Requisito de idioma
    idioma_aprobado = Column(Integer, default=0)  # 0=no, 1=sí
    tipo_certificacion_idioma = Column(String(100))  # "TOEFL", "Curso UIS", etc.
    fecha_aprobacion_idioma = Column(DateTime, nullable=True)
    
    # Requisito de tesis
    propuesta_aprobada = Column(Integer, default=0)
    tesis_aprobada = Column(Integer, default=0)
    fecha_sustentacion = Column(DateTime, nullable=True)
    
    # Requisitos adicionales (depende del programa)
    publicacion_requerida = Column(Integer, default=0)  # Para doctorado
    tiene_publicacion = Column(Integer, default=0)
    url_publicacion = Column(String(500), nullable=True)
    
    # Estado general
    cumple_todos_requisitos = Column(Integer, default=0)  # Se calcula automáticamente
    observaciones = Column(Text)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    estudiante = relationship("Estudiante", back_populates="requisitos")
    
    def __repr__(self):
        return f"<RequisitoGrado {self.estudiante.codigo_estudiante}>"