"""
Servicio para validar reglas de negocio de solicitudes.
Implementa las restricciones del Reglamento de Posgrados.
"""
from sqlalchemy.orm import Session
from typing import Optional, Tuple
from datetime import datetime
from app.models import (
    Solicitud,
    TipoSolicitud,
    NivelAprobacion,
    CategoriasSolicitud,
    Estudiante,
    CalendarioSolicitud,
    CatalogoRol,
    VinculacionActiva
)


class ValidacionSolicitudesService:
    """Servicio para validar solicitudes según reglas del reglamento."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def puede_hacer_solicitud(
        self,
        id_persona: int,
        tipo_solicitud: TipoSolicitud,
        id_programa: int
    ) -> Tuple[bool, str]:
        """
        Valida si una persona puede hacer un tipo de solicitud específico.
        
        Reglas:
        1. Solo estudiantes pueden solicitar créditos condonables
        2. Solo directores pueden solicitar nombramiento de jurados
        3. Solo coordinadores pueden hacer ciertas solicitudes administrativas
        4. Verificar que esté dentro del periodo permitido
        
        Returns:
            (puede_solicitar: bool, razon: str)
        """
        
        # Verificar si está en el periodo permitido (calendario)
        en_periodo, mensaje_periodo = self._esta_en_periodo(tipo_solicitud)
        if not en_periodo:
            return False, mensaje_periodo
        
        # Reglas específicas por tipo
        if tipo_solicitud == TipoSolicitud.CREDITO_CONDONABLE:
            # Solo estudiantes activos
            estudiante = self.db.query(Estudiante).filter(
                Estudiante.id_persona == id_persona,
                Estudiante.id_programa == id_programa,
                Estudiante.estado == "activo"
            ).first()
            
            if not estudiante:
                return False, "Solo estudiantes activos pueden solicitar créditos condonables"
            
            return True, "Cumple requisitos para solicitar crédito condonable"
        
        if tipo_solicitud == TipoSolicitud.NOMBRAMIENTO_JURADO:
            # Solo directores o coordinadores
            tiene_rol = self._tiene_rol_director_o_coordinador(id_persona, id_programa)
            if not tiene_rol:
                return False, "Solo directores o coordinadores pueden solicitar nombramiento de jurados"
            
            return True, "Cumple requisitos para solicitar nombramiento de jurados"
        
        if tipo_solicitud in [TipoSolicitud.PRORROGA, TipoSolicitud.CAMBIO_DIRECTOR]:
            # Estudiantes activos
            estudiante = self.db.query(Estudiante).filter(
                Estudiante.id_persona == id_persona,
                Estudiante.estado == "activo"
            ).first()
            
            if not estudiante:
                return False, "Solo estudiantes activos pueden solicitar prórrogas o cambio de director"
            
            return True, "Cumple requisitos"
        
        # Por defecto, permitir (para solicitudes generales)
        return True, "Solicitud permitida"
    
    def _esta_en_periodo(self, tipo_solicitud: TipoSolicitud) -> Tuple[bool, str]:
        """Verifica si estamos dentro del periodo permitido para esta solicitud."""
        
        ahora = datetime.utcnow()
        
        # Buscar en el calendario
        calendario = self.db.query(CalendarioSolicitud).filter(
            CalendarioSolicitud.tipo_solicitud == tipo_solicitud,
            CalendarioSolicitud.fecha_apertura <= ahora,
            CalendarioSolicitud.fecha_cierre >= ahora
        ).first()
        
        if not calendario:
            # Si no hay calendario definido, permitir (para solicitudes sin restricción de fecha)
            if tipo_solicitud in [TipoSolicitud.CREDITO_CONDONABLE]:
                return False, f"No hay periodo abierto para {tipo_solicitud.value}"
            return True, "Sin restricción de periodo"
        
        return True, f"Dentro del periodo {calendario.periodo_completo}"
    
    def _tiene_rol_director_o_coordinador(self, id_persona: int, id_programa: int) -> bool:
        """Verifica si la persona es director o coordinador."""
        
        # Buscar vinculaciones activas
        vinculacion = self.db.query(VinculacionActiva).join(
            CatalogoRol
        ).filter(
            VinculacionActiva.id_persona == id_persona,
            CatalogoRol.codigo.in_(["director", "coordinador"]),
            VinculacionActiva.es_activo == 1
        ).first()
        
        return vinculacion is not None
    
    def determinar_nivel_aprobacion(
        self,
        tipo_solicitud: TipoSolicitud
    ) -> NivelAprobacion:
        """
        Determina qué nivel de aprobación requiere una solicitud.
        Basado en el reglamento de posgrados.
        """
        
        # Mapa de tipos de solicitud a nivel de aprobación
        niveles = {
            TipoSolicitud.RETIRO_MATERIA: NivelAprobacion.DIRECTOR,
            TipoSolicitud.CAMBIO_TITULO: NivelAprobacion.DIRECTOR,
            
            TipoSolicitud.PRORROGA: NivelAprobacion.COORDINADOR,
            TipoSolicitud.CAMBIO_DIRECTOR: NivelAprobacion.COORDINADOR,
            TipoSolicitud.MODIFICACION_DATOS: NivelAprobacion.COORDINADOR,
            
            TipoSolicitud.CREDITO_CONDONABLE: NivelAprobacion.COMITE,
            TipoSolicitud.NOMBRAMIENTO_JURADO: NivelAprobacion.COMITE,
            TipoSolicitud.REINGRESO: NivelAprobacion.COMITE,
            TipoSolicitud.VALIDACION_MATERIA: NivelAprobacion.COMITE,
            TipoSolicitud.HOMOLOGACION: NivelAprobacion.COMITE,
            
            TipoSolicitud.CANCELACION_SEMESTRE: NivelAprobacion.CONSEJO,
        }
        
        return niveles.get(tipo_solicitud, NivelAprobacion.COORDINADOR)
    
    def generar_numero_radicado(self, anio: int, id_programa: int) -> str:
        """
        Genera un número de radicado único para la solicitud.
        Formato: SOL-2024-E3T-001
        """
        
        # Contar solicitudes del año para este programa
        count = self.db.query(Solicitud).filter(
            Solicitud.id_programa == id_programa,
            Solicitud.fecha_creacion >= datetime(anio, 1, 1),
            Solicitud.fecha_creacion < datetime(anio + 1, 1, 1)
        ).count()
        
        consecutivo = count + 1
        
        return f"SOL-{anio}-{consecutivo:04d}"