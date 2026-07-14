"""
Script para crear una solicitud de ejemplo y probar el flujo.
Ejecutar: python test_solicitud.py
"""
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import (
    Solicitud,
    FlujoAprobacion,
    CreditoCondonable,
    Estudiante,
    Persona,
    TipoSolicitud,
    CategoriasSolicitud,
    EstadoSolicitud,
    NivelAprobacion
)
from app.services.validacion_solicitudes import ValidacionSolicitudesService
from datetime import datetime


def crear_solicitud_ejemplo():
    """Crea una solicitud de crédito condonable como ejemplo."""
    
    db: Session = SessionLocal()
    
    try:
        print("📝 Creando solicitud de ejemplo...\n")
        
        # 1. Obtener un estudiante (usar uno de test_validaciones.py)
        estudiante = db.query(Estudiante).filter(
            Estudiante.codigo_estudiante == "2024101001"
        ).first()
        
        if not estudiante:
            print("❌ No se encontró el estudiante. Ejecuta primero test_validaciones.py")
            return
        
        persona_estudiante = estudiante.persona
        
        print(f"👤 Estudiante: {persona_estudiante.nombre_completo}")
        print(f"📚 Programa: {estudiante.programa.nombre}\n")
        
        # 2. Validar que puede hacer la solicitud
        validador = ValidacionSolicitudesService(db)
        
        puede, razon = validador.puede_hacer_solicitud(
            id_persona=persona_estudiante.id,
            tipo_solicitud=TipoSolicitud.CREDITO_CONDONABLE,
            id_programa=estudiante.id_programa
        )
        
        print(f"🔍 Validación: {'✅ PUEDE' if puede else '❌ NO PUEDE'} solicitar")
        print(f"   Razón: {razon}\n")
        
        if not puede:
            return
        
        # 3. Generar número de radicado
        numero_radicado = validador.generar_numero_radicado(2026, estudiante.id_programa)
        print(f"📋 Número de radicado: {numero_radicado}\n")
        
        # 4. Determinar nivel de aprobación
        nivel = validador.determinar_nivel_aprobacion(TipoSolicitud.CREDITO_CONDONABLE)
        print(f"👔 Nivel de aprobación requerido: {nivel.value}\n")
        
        # 5. Crear la solicitud
        solicitud = Solicitud(
            numero_radicado=numero_radicado,
            tipo_solicitud=TipoSolicitud.CREDITO_CONDONABLE,
            categoria=CategoriasSolicitud.FINANCIERA,
            id_solicitante=persona_estudiante.id,
            id_estudiante=estudiante.id,
            id_programa=estudiante.id_programa,
            asunto="Solicitud de Crédito Condonable 2026-1",
            descripcion="Solicito crédito condonable para el periodo 2026-1 en modalidad de docencia directa.",
            justificacion="Cumplo con los requisitos académicos y me encuentro en semestre 1.",
            nivel_aprobacion_requerido=nivel,
            estado=EstadoSolicitud.BORRADOR
        )
        
        db.add(solicitud)
        db.flush()
        
        print(f"✅ Solicitud creada: {solicitud.numero_radicado}")
        print(f"   Estado: {solicitud.estado.value}\n")
        
        # 6. Crear información específica del crédito condonable
        credito = CreditoCondonable(
            id_solicitud=solicitud.id,
            id_estudiante=estudiante.id,
            anio=2026,
            periodo=1,
            periodo_completo="2026-1",
            modalidad="Docencia Directa",
            materia_asignada="Electrónica de Potencia I",
            horas_semanales=12,
            url_carta_director="https://drive.google.com/example/carta_director.pdf",
            url_certificado_notas="https://drive.google.com/example/notas.pdf"
        )
        
        db.add(credito)
        db.flush()
        
        print(f"✅ Crédito condonable configurado:")
        print(f"   Modalidad: {credito.modalidad}")
        print(f"   Periodo: {credito.periodo_completo}")
        print(f"   Materia: {credito.materia_asignada}\n")
        
        # 7. Crear flujo de aprobación (Comité de Posgrados)
        flujo = FlujoAprobacion(
            id_solicitud=solicitud.id,
            orden=1,
            nivel=NivelAprobacion.COMITE,
            rol_responsable="comite",
            estado="pendiente",
            fecha_recepcion=datetime.utcnow(),
            comentarios="Pendiente de revisión en comité de posgrados"
        )
        
        db.add(flujo)
        
        print(f"✅ Flujo de aprobación creado:")
        print(f"   Paso 1: {flujo.nivel.value} - Estado: {flujo.estado}\n")
        
        # 8. Cambiar estado a "enviada"
        solicitud.estado = EstadoSolicitud.ENVIADA
        solicitud.fecha_envio = datetime.utcnow()
        
        db.commit()
        
        print("=" * 70)
        print("🎉 SOLICITUD CREADA EXITOSAMENTE")
        print("=" * 70)
        print(f"Radicado: {solicitud.numero_radicado}")
        print(f"Tipo: {solicitud.tipo_solicitud.value}")
        print(f"Solicitante: {persona_estudiante.nombre_completo}")
        print(f"Estado: {solicitud.estado.value}")
        print(f"Nivel de aprobación: {solicitud.nivel_aprobacion_requerido.value}")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    crear_solicitud_ejemplo()