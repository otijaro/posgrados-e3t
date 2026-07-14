from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class EstadoProyecto(str, enum.Enum):
    """Estados del ciclo de vida del proyecto de grado."""
    PROPUESTA = "propuesta"  # Propuesta enviada, pendiente de aprobación
    EN_DESARROLLO = "en_desarrollo"  # Propuesta aprobada, estudiante trabajando
    EN_EVALUACION = "en_evaluacion"  # Tesis enviada a evaluadores
    APROBADO = "aprobado"  # Aprobado para sustentación
    SUSTENTADO = "sustentado"  # Sustentación realizada
    GRADUADO = "graduado"  # Proceso completo


class EstadoPropuesta(str, enum.Enum):
    """Estados de la propuesta de tesis."""
    BORRADOR = "borrador"  # Estudiante editando
    ENVIADO = "enviado"  # Enviado al director
    RECIBIDO = "recibido"  # Director recibió
    EN_ESPERA_EVALUADORES = "en_espera_evaluadores"  # Esperando asignación
    ASIGNADO_EVALUADORES = "asignado_evaluadores"  # Evaluadores asignados
    EN_EVALUACION = "en_evaluacion"  # Evaluadores revisando
    SOLICITUD_NUEVA_VERSION = "solicitud_nueva_version"  # Requiere cambios mayores
    APROBADO_CON_CAMBIOS = "aprobado_con_cambios"  # Cambios menores
    NO_APROBADO = "no_aprobado"  # Rechazado
    APROBADO = "aprobado"  # Aprobado completamente


class TipoDocumento(str, enum.Enum):
    """Tipo de documento de grado según el programa."""
    PLAN_INVESTIGACION = "plan_investigacion"  # Maestrías
    PROPUESTA_TESIS = "propuesta_tesis"  # Doctorado
    MONOGRAFIA = "monografia"  # Especializaciones
    TRABAJO_APLICACION = "trabajo_aplicacion"  # Otros


class ProyectoGrado(Base):
    """
    Proyecto de grado (contenedor principal del proceso).
    Vincula estudiante, director, programa y seguimiento.
    """
    __tablename__ = "proyecto_grado"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Información básica
    titulo = Column(String(500), nullable=False)
    id_estudiante = Column(Integer, ForeignKey("estudiante.id"), nullable=False)
    id_director = Column(Integer, ForeignKey("persona.id"), nullable=False)
    id_codirector = Column(Integer, ForeignKey("persona.id"), nullable=True)  # Opcional
    
    # Contexto
    id_programa = Column(Integer, ForeignKey("programa_posgrado.id"), nullable=False)
    id_grupo_inv = Column(Integer, ForeignKey("grupo_investigacion.id"), nullable=True)
    
    # Estado
    estado = Column(SQLEnum(EstadoProyecto), default=EstadoProyecto.PROPUESTA)
    tipo_documento = Column(SQLEnum(TipoDocumento), nullable=False)
    
    # Fechas importantes
    fecha_inicio = Column(DateTime, default=datetime.utcnow)
    fecha_aprobacion_propuesta = Column(DateTime, nullable=True)
    fecha_sustentacion = Column(DateTime, nullable=True)
    fecha_grado = Column(DateTime, nullable=True)
    
    # Auditoría
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    estudiante = relationship("Estudiante", back_populates="proyecto")
    director = relationship("Persona", foreign_keys=[id_director])
    codirector = relationship("Persona", foreign_keys=[id_codirector])
    programa = relationship("ProgramaPosgrado")
    grupo_investigacion = relationship("GrupoInvestigacion")
    
    propuesta = relationship("PropuestaTesis", back_populates="proyecto", uselist=False)
    reportes = relationship("ReporteSemestral", back_populates="proyecto")
    evaluaciones = relationship("EvaluacionJurado", back_populates="proyecto")
    
    def __repr__(self):
        return f"<ProyectoGrado {self.titulo[:50]}>"


class PropuestaTesis(Base):
    """
    Propuesta de tesis (documento fundacional).
    Plan de Investigación (maestrías) o Propuesta de Tesis (doctorado).
    """
    __tablename__ = "propuesta_tesis"
    
    id = Column(Integer, primary_key=True, index=True)
    id_proyecto = Column(Integer, ForeignKey("proyecto_grado.id"), nullable=False, unique=True)
    
    # Documento
    url_documento = Column(String(500), nullable=False)  # Link al PDF
    version = Column(Integer, default=1)  # Versión del documento
    
    # Estado y evaluadores
    estado = Column(SQLEnum(EstadoPropuesta), default=EstadoPropuesta.BORRADOR)
    evaluadores = Column(Text)  # JSON: [{"nombre": "Dr. X", "email": "...", "institucion": "..."}]
    
    # Fechas
    fecha_radicado = Column(DateTime, nullable=True)
    fecha_limite_evaluacion = Column(DateTime, nullable=True)
    fecha_aprobacion = Column(DateTime, nullable=True)
    
    # Observaciones
    observaciones = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    proyecto = relationship("ProyectoGrado", back_populates="propuesta")
    
    def __repr__(self):
        return f"<PropuestaTesis Proyecto:{self.id_proyecto} v{self.version}>"


class ReporteSemestral(Base):
    """
    Reportes semestrales de avance del proyecto.
    El estudiante sube un informe cada semestre después de aprobar su propuesta.
    """
    __tablename__ = "reporte_semestral"
    
    id = Column(Integer, primary_key=True, index=True)
    id_proyecto = Column(Integer, ForeignKey("proyecto_grado.id"), nullable=False)
    
    # Periodo
    periodo = Column(String(10), nullable=False)  # "2024-1", "2024-2"
    numero_reporte = Column(Integer)  # 1, 2, 3... (orden cronológico)
    
    # Documento
    url_informe = Column(String(500), nullable=False)
    
    # Validación del director
    aval_director = Column(Integer, default=0)  # 0=pendiente, 1=aprobado
    fecha_aval = Column(DateTime, nullable=True)
    observaciones_director = Column(Text)
    
    # Auditoría
    fecha_carga = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    proyecto = relationship("ProyectoGrado", back_populates="reportes")
    
    def __repr__(self):
        return f"<ReporteSemestral Proyecto:{self.id_proyecto} {self.periodo}>"


class EvaluacionJurado(Base):
    """
    Evaluaciones de jurados/evaluadores.
    Usado tanto para propuesta como para tesis final.
    """
    __tablename__ = "evaluacion_jurado"
    
    id = Column(Integer, primary_key=True, index=True)
    id_proyecto = Column(Integer, ForeignKey("proyecto_grado.id"), nullable=False)
    
    # Evaluador
    id_evaluador = Column(Integer, ForeignKey("persona.id"), nullable=True)  # Si está registrado
    nombre_evaluador = Column(String(255), nullable=False)  # Por si es externo
    email_evaluador = Column(String(255))
    institucion = Column(String(300))
    
    # Tipo de evaluación
    tipo_evaluacion = Column(String(50))  # "propuesta", "tesis_final"
    
    # Resultado
    concepto = Column(String(50))  # "aprobado", "aprobado_con_cambios", "no_aprobado", "meritoria", "laureada"
    calificacion = Column(String(10))  # "4.5", "5.0", etc.
    url_evaluacion = Column(String(500))  # PDF con la evaluación
    
    # Fechas
    fecha_asignacion = Column(DateTime, default=datetime.utcnow)
    fecha_limite = Column(DateTime)
    fecha_respuesta = Column(DateTime, nullable=True)
    
    # Observaciones
    observaciones = Column(Text)
    
    # Relaciones
    proyecto = relationship("ProyectoGrado", back_populates="evaluaciones")
    evaluador = relationship("Persona", foreign_keys=[id_evaluador])
    
    def __repr__(self):
        return f"<EvaluacionJurado {self.nombre_evaluador} - {self.tipo_evaluacion}>"