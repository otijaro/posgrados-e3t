"""
Servicio para validar reglas de negocio relacionadas con roles.
Implementa las restricciones del Reglamento de Posgrados UIS.
"""
from sqlalchemy.orm import Session
from typing import Optional
from app.models import (
    Persona,
    Estudiante,
    ProyectoGrado,
    VinculacionActiva,
    CatalogoRol,
    ProgramaPosgrado,
    NivelPrograma
)


class ValidacionRolesService:
    """
    Servicio para validar reglas de asignación de roles.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def puede_ser_director(
        self, 
        id_persona: int, 
        id_proyecto: int
    ) -> tuple[bool, str]:
        """
        Valida si una persona puede ser director de un proyecto específico.
        
        Reglas:
        1. No puede ser su propio director (estudiante != director)
        2. Si es estudiante de maestría, NO puede dirigir doctorados
        3. Si es estudiante de doctorado, SÍ puede dirigir maestrías
        4. Debe tener título mínimo de maestría (opcional, según reglamento)
        
        Returns:
            (puede_dirigir: bool, razon: str)
        """
        proyecto = self.db.query(ProyectoGrado).filter(
            ProyectoGrado.id == id_proyecto
        ).first()
        
        if not proyecto:
            return False, "Proyecto no encontrado"
        
        # Regla 1: No puede ser su propio director
        if proyecto.id_estudiante == proyecto.estudiante.id_persona:
            if proyecto.estudiante.id_persona == id_persona:
                return False, "Un estudiante no puede ser su propio director"
        
        # Obtener info del potencial director
        estudiante_director = self.db.query(Estudiante).filter(
            Estudiante.id_persona == id_persona,
            Estudiante.estado == "activo"
        ).first()
        
        # Si el potencial director también es estudiante activo
        if estudiante_director:
            programa_director = estudiante_director.programa
            programa_proyecto = proyecto.programa
            
            # Regla 2: Estudiante de maestría NO puede dirigir doctorados
            if (programa_director.nivel == NivelPrograma.MAESTRIA and 
                programa_proyecto.nivel == NivelPrograma.DOCTORADO):
                return False, "Un estudiante de maestría no puede dirigir proyectos de doctorado"
            
            # Regla 3: Estudiante de doctorado SÍ puede dirigir maestrías
            if (programa_director.nivel == NivelPrograma.DOCTORADO and 
                programa_proyecto.nivel == NivelPrograma.MAESTRIA):
                return True, "Estudiante de doctorado puede dirigir maestrías"
        
        # Si no es estudiante o no aplican restricciones
        return True, "Cumple requisitos para ser director"
    
    def puede_ser_evaluador(
        self, 
        id_persona: int, 
        id_proyecto: int
    ) -> tuple[bool, str]:
        """
        Valida si una persona puede ser evaluador de un proyecto.
        
        Reglas:
        1. Un director NO puede ser evaluador de sus propios trabajos
        2. El codirector tampoco puede ser evaluador
        3. No puede ser el mismo estudiante
        
        Returns:
            (puede_evaluar: bool, razon: str)
        """
        proyecto = self.db.query(ProyectoGrado).filter(
            ProyectoGrado.id == id_proyecto
        ).first()
        
        if not proyecto:
            return False, "Proyecto no encontrado"
        
        # Regla 1: Director no puede evaluar su propio trabajo
        if proyecto.id_director == id_persona:
            return False, "El director no puede ser evaluador de su propio proyecto"
        
        # Regla 2: Codirector tampoco
        if proyecto.id_codirector == id_persona:
            return False, "El codirector no puede ser evaluador del proyecto que codirige"
        
        # Regla 3: El estudiante no puede evaluarse a sí mismo
        if proyecto.estudiante.id_persona == id_persona:
            return False, "El estudiante no puede ser evaluador de su propio proyecto"
        
        return True, "Cumple requisitos para ser evaluador"
    
    def debe_firmar_acta_evaluacion(
        self, 
        id_persona: int, 
        id_proyecto: int
    ) -> bool:
        """
        Determina si una persona debe firmar el acta de evaluación.
        
        Reglas:
        - El director SIEMPRE firma (aunque no evalúa)
        - El codirector SIEMPRE firma (si existe)
        - Los evaluadores firman sus evaluaciones individuales
        """
        proyecto = self.db.query(ProyectoGrado).filter(
            ProyectoGrado.id == id_proyecto
        ).first()
        
        if not proyecto:
            return False
        
        # Director y codirector siempre firman
        if id_persona in [proyecto.id_director, proyecto.id_codirector]:
            return True
        
        return False
    
    def tiene_rol_activo(
        self, 
        id_persona: int, 
        codigo_rol: str, 
        tipo_contexto: Optional[str] = None,
        id_contexto: Optional[int] = None
    ) -> bool:
        """
        Verifica si una persona tiene un rol activo.
        
        Args:
            id_persona: ID de la persona
            codigo_rol: Código del rol (ej: "coordinador", "director")
            tipo_contexto: Tipo de contexto (opcional)
            id_contexto: ID del contexto (opcional)
        """
        query = self.db.query(VinculacionActiva).join(
            CatalogoRol
        ).filter(
            VinculacionActiva.id_persona == id_persona,
            CatalogoRol.codigo == codigo_rol,
            VinculacionActiva.es_activo == 1,
            VinculacionActiva.fecha_fin.is_(None)  # Sin fecha de fin = vigente
        )
        
        if tipo_contexto:
            query = query.filter(VinculacionActiva.tipo_contexto == tipo_contexto)
        
        if id_contexto:
            query = query.filter(VinculacionActiva.id_contexto == id_contexto)
        
        return query.first() is not None
    
    def asignar_rol(
        self,
        id_persona: int,
        codigo_rol: str,
        tipo_contexto: str,
        id_contexto: int,
        asignado_por: int,
        observaciones: Optional[str] = None
    ) -> tuple[bool, str, Optional[VinculacionActiva]]:
        """
        Asigna un rol a una persona en un contexto específico.
        Valida las reglas antes de asignar.
        
        Returns:
            (exito: bool, mensaje: str, vinculacion: VinculacionActiva o None)
        """
        # Obtener el rol del catálogo
        rol = self.db.query(CatalogoRol).filter(
            CatalogoRol.codigo == codigo_rol,
            CatalogoRol.activo == 1
        ).first()
        
        if not rol:
            return False, f"Rol '{codigo_rol}' no encontrado o inactivo", None
        
        # Validaciones específicas según el tipo de rol
        if codigo_rol == "director" and tipo_contexto == "proyecto":
            puede, razon = self.puede_ser_director(id_persona, id_contexto)
            if not puede:
                return False, razon, None
        
        if codigo_rol == "evaluador" and tipo_contexto == "proyecto":
            puede, razon = self.puede_ser_evaluador(id_persona, id_contexto)
            if not puede:
                return False, razon, None
        
        # Verificar si ya tiene una vinculación activa igual
        vinculacion_existente = self.db.query(VinculacionActiva).filter(
            VinculacionActiva.id_persona == id_persona,
            VinculacionActiva.id_rol == rol.id,
            VinculacionActiva.tipo_contexto == tipo_contexto,
            VinculacionActiva.id_contexto == id_contexto,
            VinculacionActiva.es_activo == 1
        ).first()
        
        if vinculacion_existente:
            return False, "La persona ya tiene este rol activo en este contexto", None
        
        # Crear la vinculación
        nueva_vinculacion = VinculacionActiva(
            id_persona=id_persona,
            id_rol=rol.id,
            tipo_contexto=tipo_contexto,
            id_contexto=id_contexto,
            asignado_por=asignado_por,
            observaciones=observaciones
        )
        
        self.db.add(nueva_vinculacion)
        
        try:
            self.db.commit()
            self.db.refresh(nueva_vinculacion)
            return True, "Rol asignado exitosamente", nueva_vinculacion
        except Exception as e:
            self.db.rollback()
            return False, f"Error al asignar rol: {str(e)}", None