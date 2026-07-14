from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class TipoSolicitud(str, enum.Enum):
    """Tipos de solicitudes según el reglamento de posgrados."""
    # Académicas
    CREDITO_CONDONABLE = "credito_condonable"
    PRORROGA = "prorroga"
    CAMBIO_DIRECTOR = "cambio_director"
    CAMBIO_TITULO = "cambio_titulo"
    REINGRESO = "reingreso"
    RETIRO_MATERIA = "retiro_materia"
    VALIDACION_MATERIA = "validacion_materia"
    HOMOLOGACION = "homologacion"
    
    # Administrativas
    CANCELACION_SEMESTRE = "cancelacion_semestre"
    RESERVA_CUPO = "reserva_cupo"
    MODIFICACION_DATOS = "modificacion_datos"
    
    # Tesis/Grado
    NOMBRAMIENTO_JURADO = "nombramiento_jurado"
    SOLICITUD_GRADO = "solicitud_grado"
    AUTORIZACION_SUSTENTACION = "autorizacion_sustentacion"
    
    # Otras
    OTRA = "otra"


class CategoriasSolicitud(str, enum.Enum):
    """Categorías generales de solicitudes."""
    ACADEMICA = "academica"
    ADMINISTRATIVA = "administrativa"
    INVESTIGACION = "investigacion"
    FINANCIERA = "financiera"


class EstadoSolicitud(str, enum.Enum):
    """Estados del flujo de aprobación de una solicitud."""
    BORRADOR = "borrador"  # Estudiante editando
    ENVIADA = "enviada"  # Enviada, esperando revisión
    EN_REVISION = "en_revision"  # Director/Coordinador revisando
    EN_COMITE = "en_comite"  # En comité de posgrados
    APROBADA = "aprobada"  # Aprobada
    RECHAZADA = "rechazada"  # Rechazada
    DEVUELTA = "devuelta"  # Devuelta para correcciones
    CANCELADA = "cancelada"  # Cancelada por el solicitante


class NivelAprobacion(str, enum.Enum):
    """Niveles de aprobación requeridos según el tipo de solicitud."""
    DIRECTOR = "director"  # Solo requiere aval del director
    COORDINADOR = "coordinador"  # Requiere aprobación del coordinador
    COMITE = "comite"  # Requiere aprobación del comité de posgrados
    CONSEJO = "consejo"  # Requiere consejo de escuela/facultad


class Solicitud(Base):
    """
    Solicitud académica o administrativa.
    Maneja el flujo de aprobación según el tipo.
    """
    __tablename__ = "solicitud"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Identificación
    numero_radicado = Column(String(50), unique=True)  # Auto-generado: "SOL-2024-001"
    tipo_solicitud = Column(SQLEnum(TipoSolicitud), nullable=False)
    categoria = Column(SQLEnum(CategoriasSolicitud), nullable=False)
    
    # Solicitante
    id_solicitante = Column(Integer, ForeignKey("persona.id"), nullable=False)
    id_estudiante = Column(Integer, ForeignKey("estudiante.id"), nullable=True)  # Si aplica
    id_proyecto = Column(Integer, ForeignKey("proyecto_grado.id"), nullable=True)  # Si aplica
    id_programa = Column(Integer, ForeignKey("programa_posgrado.id"), nullable=False)
    
    # Contenido de la solicitud
    asunto = Column(String(500), nullable=False)
    descripcion = Column(Text, nullable=False)
    justificacion = Column(Text)
    
    # Documentos adjuntos (URLs o JSON con lista de archivos)
    documentos_adjuntos = Column(Text)  # JSON: [{"nombre": "...", "url": "..."}]
    
    # Estado y flujo
    estado = Column(SQLEnum(EstadoSolicitud), default=EstadoSolicitud.BORRADOR)
    nivel_aprobacion_requerido = Column(SQLEnum(NivelAprobacion), nullable=False)
    
    # Fechas
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_envio = Column(DateTime, nullable=True)
    fecha_limite_respuesta = Column(DateTime, nullable=True)
    fecha_aprobacion = Column(DateTime, nullable=True)
    fecha_rechazo = Column(DateTime, nullable=True)
    
    # Respuesta
    respuesta = Column(Text)  # Respuesta de quien aprueba/rechaza
    id_quien_responde = Column(Integer, ForeignKey("persona.id"), nullable=True)
    
    # Observaciones
    observaciones = Column(Text)
    
    # Auditoría
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    solicitante = relationship("Persona", foreign_keys=[id_solicitante])
    estudiante = relationship("Estudiante", foreign_keys=[id_estudiante])
    proyecto = relationship("ProyectoGrado")
    programa = relationship("ProgramaPosgrado")
    quien_responde = relationship("Persona", foreign_keys=[id_quien_responde])
    
    flujo_aprobacion = relationship("FlujoAprobacion", back_populates="solicitud")
    
    def __repr__(self):
        return f"<Solicitud {self.numero_radicado} - {self.tipo_solicitud.value}>"


class FlujoAprobacion(Base):
    """
    Flujo de aprobación de una solicitud.
    Rastrea quién tiene que aprobar y en qué orden.
    """
    __tablename__ = "flujo_aprobacion"
    
    id = Column(Integer, primary_key=True, index=True)
    id_solicitud = Column(Integer, ForeignKey("solicitud.id"), nullable=False)
    
    # Paso en el flujo
    orden = Column(Integer, nullable=False)  # 1, 2, 3...
    nivel = Column(SQLEnum(NivelAprobacion), nullable=False)
    
    # Responsable de este paso
    id_responsable = Column(Integer, ForeignKey("persona.id"), nullable=True)  # Puede ser NULL si es "comité"
    rol_responsable = Column(String(50))  # "director", "coordinador", "comite"
    
    # Estado de este paso
    estado = Column(String(50), default="pendiente")  # "pendiente", "aprobado", "rechazado"
    
    # Fechas
    fecha_recepcion = Column(DateTime, nullable=True)
    fecha_limite = Column(DateTime, nullable=True)
    fecha_respuesta = Column(DateTime, nullable=True)
    
    # Comentarios
    comentarios = Column(Text)
    
    # Relaciones
    solicitud = relationship("Solicitud", back_populates="flujo_aprobacion")
    responsable = relationship("Persona", foreign_keys=[id_responsable])
    
    def __repr__(self):
        return f"<FlujoAprobacion Solicitud:{self.id_solicitud} Paso:{self.orden}>"


class CreditoCondonable(Base):
    """
    Información específica para solicitudes de crédito condonable.
    Extiende la solicitud con datos particulares de esta modalidad.
    """
    __tablename__ = "credito_condonable"
    
    id = Column(Integer, primary_key=True, index=True)
    id_solicitud = Column(Integer, ForeignKey("solicitud.id"), nullable=False, unique=True)
    id_estudiante = Column(Integer, ForeignKey("estudiante.id"), nullable=False)
    
    # Periodo solicitado
    anio = Column(Integer, nullable=False)
    periodo = Column(Integer, nullable=False)  # 1 o 2
    periodo_completo = Column(String(10))  # "2024-1"
    
    # Tipo de crédito
    modalidad = Column(String(100))  # "Docencia Directa", "Asistente de Investigación", etc.
    
    # Asignación
    materia_asignada = Column(String(300))  # Si aplica docencia
    horas_semanales = Column(Integer)
    
    # Fechas importantes (según Acuerdo 350)
    fecha_vinculacion = Column(DateTime, nullable=True)  # Fecha de vinculación docente
    fecha_liquidacion = Column(DateTime, nullable=True)
    fecha_pago = Column(DateTime, nullable=True)
    
    # Documentos específicos
    url_carta_director = Column(String(500))  # Carta aval del director
    url_certificado_notas = Column(String(500))
    url_paz_salvo = Column(String(500))
    
    # Estado específico del crédito
    aprobado_comite = Column(Integer, default=0)  # 0=no, 1=sí
    fecha_aprobacion_comite = Column(DateTime, nullable=True)
    
    # Relaciones
    solicitud = relationship("Solicitud")
    estudiante = relationship("Estudiante")
    
    def __repr__(self):
        return f"<CreditoCondonable {self.periodo_completo} - Estudiante:{self.id_estudiante}>"


class CalendarioSolicitud(Base):
    """
    Calendario de fechas límite para solicitudes.
    Define ventanas de tiempo para cada tipo de solicitud.
    Basado en acuerdos como el 350 de 2024.
    """
    __tablename__ = "calendario_solicitud"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Periodo académico
    anio = Column(Integer, nullable=False)
    periodo = Column(Integer, nullable=False)
    periodo_completo = Column(String(10))  # "2024-1"
    
    # Tipo de solicitud
    tipo_solicitud = Column(SQLEnum(TipoSolicitud), nullable=False)
    
    # Fechas
    fecha_apertura = Column(DateTime, nullable=False)  # Desde cuándo se puede solicitar
    fecha_cierre = Column(DateTime, nullable=False)  # Hasta cuándo
    fecha_publicacion_resultados = Column(DateTime, nullable=True)
    fecha_reporte_direccion = Column(DateTime, nullable=True)  # Para reportes a dirección
    
    # Observaciones
    observaciones = Column(Text)
    
    # Auditoría
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<CalendarioSolicitud {self.tipo_solicitud.value} - {self.periodo_completo}>"