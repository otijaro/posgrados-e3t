"""
Script para crear el calendario de solicitudes académicas.
Basado en el Acuerdo 350 de 2024 y reglamento general.
Ejecutar: python seed_calendario.py
"""
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import CalendarioSolicitud, TipoSolicitud
from datetime import datetime


def create_calendario_2026():
    """Crea el calendario de solicitudes para 2026."""
    
    db: Session = SessionLocal()
    
    try:
        print("📅 Creando calendario de solicitudes 2026...\n")
        
        calendarios = [
            # Primer Semestre 2026 - Créditos Condonables (Acuerdo 350)
            {
                "anio": 2026,
                "periodo": 1,
                "periodo_completo": "2026-1",
                "tipo_solicitud": TipoSolicitud.CREDITO_CONDONABLE,
                "fecha_apertura": datetime(2025, 12, 3),  # 3 de diciembre
                "fecha_cierre": datetime(2025, 12, 7),  # 7 de diciembre
                "fecha_publicacion_resultados": datetime(2025, 12, 15),
                "fecha_reporte_direccion": datetime(2025, 12, 15),
                "observaciones": "Según Acuerdo 350 - Modalidad Docencia Directa"
            },
            
            # Segundo Semestre 2026 - Créditos Condonables
            {
                "anio": 2026,
                "periodo": 2,
                "periodo_completo": "2026-2",
                "tipo_solicitud": TipoSolicitud.CREDITO_CONDONABLE,
                "fecha_apertura": datetime(2026, 6, 1),
                "fecha_cierre": datetime(2026, 6, 5),
                "fecha_publicacion_resultados": datetime(2026, 6, 18),
                "fecha_reporte_direccion": datetime(2026, 6, 19),
                "observaciones": "Segundo periodo académico 2026"
            },
            
            # Prórrogas - Todo el año (sin restricción estricta)
            {
                "anio": 2026,
                "periodo": 1,
                "periodo_completo": "2026-1",
                "tipo_solicitud": TipoSolicitud.PRORROGA,
                "fecha_apertura": datetime(2026, 1, 1),
                "fecha_cierre": datetime(2026, 6, 30),
                "observaciones": "Solicitudes de prórroga primer semestre"
            },
            {
                "anio": 2026,
                "periodo": 2,
                "periodo_completo": "2026-2",
                "tipo_solicitud": TipoSolicitud.PRORROGA,
                "fecha_apertura": datetime(2026, 7, 1),
                "fecha_cierre": datetime(2026, 12, 31),
                "observaciones": "Solicitudes de prórroga segundo semestre"
            },
            
            # Retiro de materias - Primeras 4 semanas del semestre
            {
                "anio": 2026,
                "periodo": 1,
                "periodo_completo": "2026-1",
                "tipo_solicitud": TipoSolicitud.RETIRO_MATERIA,
                "fecha_apertura": datetime(2026, 1, 19),
                "fecha_cierre": datetime(2026, 2, 16),
                "observaciones": "4 primeras semanas del semestre"
            },
            {
                "anio": 2026,
                "periodo": 2,
                "periodo_completo": "2026-2",
                "tipo_solicitud": TipoSolicitud.RETIRO_MATERIA,
                "fecha_apertura": datetime(2026, 7, 21),
                "fecha_cierre": datetime(2026, 8, 18),
                "observaciones": "4 primeras semanas del semestre"
            },
            
            # Solicitudes de grado - Antes de cada periodo de grados
            {
                "anio": 2026,
                "periodo": 1,
                "periodo_completo": "2026-1",
                "tipo_solicitud": TipoSolicitud.SOLICITUD_GRADO,
                "fecha_apertura": datetime(2026, 3, 1),
                "fecha_cierre": datetime(2026, 4, 30),
                "observaciones": "Grados de julio 2026"
            },
            {
                "anio": 2026,
                "periodo": 2,
                "periodo_completo": "2026-2",
                "tipo_solicitud": TipoSolicitud.SOLICITUD_GRADO,
                "fecha_apertura": datetime(2026, 9, 1),
                "fecha_cierre": datetime(2026, 10, 31),
                "observaciones": "Grados de diciembre 2026"
            },
        ]
        
        for cal_data in calendarios:
            # Verificar si ya existe
            existente = db.query(CalendarioSolicitud).filter(
                CalendarioSolicitud.anio == cal_data["anio"],
                CalendarioSolicitud.periodo == cal_data["periodo"],
                CalendarioSolicitud.tipo_solicitud == cal_data["tipo_solicitud"]
            ).first()
            
            if existente:
                print(f"⚠️  Calendario {cal_data['periodo_completo']} - {cal_data['tipo_solicitud'].value} ya existe")
                continue
            
            calendario = CalendarioSolicitud(**cal_data)
            db.add(calendario)
            print(f"✅ Calendario creado: {cal_data['periodo_completo']} - {cal_data['tipo_solicitud'].value}")
        
        db.commit()
        print(f"\n🎉 Calendario 2026 creado exitosamente!")
        print(f"   Total: {len(calendarios)} periodos configurados")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_calendario_2026()