"""
Script para probar las validaciones de roles.
Ejecutar: python test_validaciones.py
"""
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import (
    Persona,
    Estudiante,
    ProgramaPosgrado,
    ProyectoGrado,
    Cohorte,
    NivelPrograma,
    TipoDocumento,
    EstadoEstudiante
)
from app.services.validacion_roles import ValidacionRolesService
from datetime import datetime


def crear_datos_prueba(db: Session):
    """Crea datos de prueba para validar las reglas."""
    
    print("📦 Creando datos de prueba...\n")
    
    # 1. Crear personas
    persona_director = Persona(
        email_institucional="director@uis.edu.co",
        nombre_completo="Dr. Juan Pérez",
        documento_identidad="123456789",
        telefono="3001234567"
    )
    
    persona_estudiante_maestria = Persona(
        email_institucional="estudiante.maestria@uis.edu.co",
        nombre_completo="María López",
        documento_identidad="987654321",
        telefono="3009876543"
    )
    
    persona_estudiante_doctorado = Persona(
        email_institucional="estudiante.doctorado@uis.edu.co",
        nombre_completo="Carlos García",
        documento_identidad="456789123",
        telefono="3005555555"
    )
    
    persona_evaluador = Persona(
        email_institucional="evaluador@uis.edu.co",
        nombre_completo="Dra. Ana Martínez",
        documento_identidad="789123456",
        telefono="3007777777"
    )
    
    db.add_all([persona_director, persona_estudiante_maestria, 
                persona_estudiante_doctorado, persona_evaluador])
    db.flush()
    
    print(f"✅ Personas creadas:")
    print(f"   - Director: {persona_director.nombre_completo}")
    print(f"   - Estudiante Maestría: {persona_estudiante_maestria.nombre_completo}")
    print(f"   - Estudiante Doctorado: {persona_estudiante_doctorado.nombre_completo}")
    print(f"   - Evaluador: {persona_evaluador.nombre_completo}\n")
    
    # 2. Obtener programas
    maestria = db.query(ProgramaPosgrado).filter(
        ProgramaPosgrado.nivel == NivelPrograma.MAESTRIA
    ).first()
    
    doctorado = db.query(ProgramaPosgrado).filter(
        ProgramaPosgrado.nivel == NivelPrograma.DOCTORADO
    ).first()
    
    # 3. Crear cohortes
    cohorte_maestria = Cohorte(
        nombre="2024-1",
        id_programa=maestria.id,
        anio=2024,
        periodo=1,
        fecha_inicio="2024-02-01"
    )
    
    cohorte_doctorado = Cohorte(
        nombre="2024-1",
        id_programa=doctorado.id,
        anio=2024,
        periodo=1,
        fecha_inicio="2024-02-01"
    )
    
    db.add_all([cohorte_maestria, cohorte_doctorado])
    db.flush()
    
    # 4. Crear estudiantes
    estudiante_maestria = Estudiante(
        id_persona=persona_estudiante_maestria.id,
        id_programa=maestria.id,
        id_cohorte=cohorte_maestria.id,
        codigo_estudiante="2024101001",
        estado=EstadoEstudiante.ACTIVO,
        semestre_actual=1,
        fecha_ingreso=datetime(2024, 2, 1)
    )
    
    estudiante_doctorado = Estudiante(
        id_persona=persona_estudiante_doctorado.id,
        id_programa=doctorado.id,
        id_cohorte=cohorte_doctorado.id,
        codigo_estudiante="2024201001",
        estado=EstadoEstudiante.ACTIVO,
        semestre_actual=1,
        fecha_ingreso=datetime(2024, 2, 1)
    )
    
    db.add_all([estudiante_maestria, estudiante_doctorado])
    db.flush()
    
    print(f"✅ Estudiantes creados:")
    print(f"   - {estudiante_maestria.codigo_estudiante} en {maestria.nombre}")
    print(f"   - {estudiante_doctorado.codigo_estudiante} en {doctorado.nombre}\n")
    
    # 5. Crear proyectos
    proyecto_maestria = ProyectoGrado(
        titulo="Optimización de Sistemas de Control usando IA",
        id_estudiante=estudiante_maestria.id,
        id_director=persona_director.id,
        id_programa=maestria.id,
        tipo_documento=TipoDocumento.PLAN_INVESTIGACION
    )
    
    proyecto_doctorado = ProyectoGrado(
        titulo="Machine Learning Avanzado para Robótica",
        id_estudiante=estudiante_doctorado.id,
        id_director=persona_director.id,
        id_programa=doctorado.id,
        tipo_documento=TipoDocumento.PROPUESTA_TESIS
    )
    
    db.add_all([proyecto_maestria, proyecto_doctorado])
    db.commit()
    
    print(f"✅ Proyectos creados:")
    print(f"   - Proyecto Maestría ID: {proyecto_maestria.id}")
    print(f"   - Proyecto Doctorado ID: {proyecto_doctorado.id}\n")
    
    return {
        "personas": {
            "director": persona_director,
            "estudiante_maestria": persona_estudiante_maestria,
            "estudiante_doctorado": persona_estudiante_doctorado,
            "evaluador": persona_evaluador
        },
        "proyectos": {
            "maestria": proyecto_maestria,
            "doctorado": proyecto_doctorado
        }
    }


def ejecutar_pruebas_validacion():
    """Ejecuta las pruebas de validación."""
    
    db: Session = SessionLocal()
    
    try:
        print("🧪 INICIANDO PRUEBAS DE VALIDACIÓN DE ROLES\n")
        print("=" * 70)
        
        # Crear datos de prueba
        datos = crear_datos_prueba(db)
        
        # Inicializar servicio de validación
        validador = ValidacionRolesService(db)
        
        print("\n" + "=" * 70)
        print("🔍 PRUEBA 1: Estudiante NO puede ser su propio director")
        print("=" * 70)
        
        puede, razon = validador.puede_ser_director(
            id_persona=datos["personas"]["estudiante_maestria"].id,
            id_proyecto=datos["proyectos"]["maestria"].id
        )
        print(f"Resultado: {'❌ RECHAZADO' if not puede else '✅ PERMITIDO'}")
        print(f"Razón: {razon}\n")
        
        
        print("=" * 70)
        print("🔍 PRUEBA 2: Estudiante de Maestría NO puede dirigir Doctorado")
        print("=" * 70)
        
        puede, razon = validador.puede_ser_director(
            id_persona=datos["personas"]["estudiante_maestria"].id,
            id_proyecto=datos["proyectos"]["doctorado"].id
        )
        print(f"Resultado: {'❌ RECHAZADO' if not puede else '✅ PERMITIDO'}")
        print(f"Razón: {razon}\n")
        
        
        print("=" * 70)
        print("🔍 PRUEBA 3: Estudiante de Doctorado SÍ puede dirigir Maestría")
        print("=" * 70)
        
        puede, razon = validador.puede_ser_director(
            id_persona=datos["personas"]["estudiante_doctorado"].id,
            id_proyecto=datos["proyectos"]["maestria"].id
        )
        print(f"Resultado: {'❌ RECHAZADO' if not puede else '✅ PERMITIDO'}")
        print(f"Razón: {razon}\n")
        
        
        print("=" * 70)
        print("🔍 PRUEBA 4: Director NO puede evaluar su propio proyecto")
        print("=" * 70)
        
        puede, razon = validador.puede_ser_evaluador(
            id_persona=datos["personas"]["director"].id,
            id_proyecto=datos["proyectos"]["maestria"].id
        )
        print(f"Resultado: {'❌ RECHAZADO' if not puede else '✅ PERMITIDO'}")
        print(f"Razón: {razon}\n")
        
        
        print("=" * 70)
        print("🔍 PRUEBA 5: Evaluador externo SÍ puede evaluar proyecto")
        print("=" * 70)
        
        puede, razon = validador.puede_ser_evaluador(
            id_persona=datos["personas"]["evaluador"].id,
            id_proyecto=datos["proyectos"]["maestria"].id
        )
        print(f"Resultado: {'❌ RECHAZADO' if not puede else '✅ PERMITIDO'}")
        print(f"Razón: {razon}\n")
        
        
        print("=" * 70)
        print("🔍 PRUEBA 6: Director debe firmar acta de evaluación")
        print("=" * 70)
        
        debe_firmar = validador.debe_firmar_acta_evaluacion(
            id_persona=datos["personas"]["director"].id,
            id_proyecto=datos["proyectos"]["maestria"].id
        )
        print(f"Resultado: {'✅ SÍ DEBE FIRMAR' if debe_firmar else '❌ NO DEBE FIRMAR'}\n")
        
        
        print("\n" + "=" * 70)
        print("🎉 PRUEBAS COMPLETADAS")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Error en las pruebas: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    ejecutar_pruebas_validacion()