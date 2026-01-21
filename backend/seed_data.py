"""
Script para crear datos iniciales en la base de datos.
Ejecutar: python seed_data.py
"""
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import (
    Facultad,
    Escuela,
    ProgramaPosgrado,
    NivelPrograma,
    GrupoInvestigacion
)


def create_initial_data():
    """Crea la estructura organizacional y programas de E3T."""
    
    db: Session = SessionLocal()
    
    try:
        print("🚀 Iniciando creación de datos iniciales...")
        
        # 1. Crear Facultad
        facultad = Facultad(
            nombre="Facultad de Ingenierías Físico-Mecánicas",
            codigo="FING"
        )
        db.add(facultad)
        db.flush()
        print(f"✅ Facultad creada: {facultad.nombre}")
        
        # 2. Crear Escuela E3T
        escuela = Escuela(
            nombre="Escuela de Ingenierías Eléctrica, Electrónica y de Telecomunicaciones",  # ✅ Correcto
            codigo="E3T",
            id_facultad=facultad.id
        )
        db.add(escuela)
        db.flush()
        print(f"✅ Escuela creada: {escuela.nombre}")
        
        # 3. Crear Grupos de Investigación
        grupos = [
            GrupoInvestigacion(
                nombre="Grupo de Investigación en Electrónica de Potencia",
                codigo_minciencias="COL0012345",
                id_escuela=escuela.id,
                descripcion="Investigación en electrónica de potencia y control",
                activo=1
            ),
            GrupoInvestigacion(
                nombre="Grupo de Investigación en Telecomunicaciones",
                codigo_minciencias="COL0012346",
                id_escuela=escuela.id,
                descripcion="Investigación en comunicaciones y redes",
                activo=1
            ),
        ]
        
        for grupo in grupos:
            db.add(grupo)
        db.flush()
        print(f"✅ {len(grupos)} grupos de investigación creados")
        
        # 4. Crear las 4 Maestrías
        maestrias = [
            {
                "nombre": "Maestría en Ingeniería Electrónica",
                "codigo_snies": "12345",
                "creditos_totales": 48,
                "creditos_obligatorios": 24,
                "creditos_electivos": 12,
                "creditos_investigacion": 12,
                "duracion_semestres": 4
            },
            {
                "nombre": "Maestría en Ingeniería Eléctrica",
                "codigo_snies": "12346",
                "creditos_totales": 48,
                "creditos_obligatorios": 24,
                "creditos_electivos": 12,
                "creditos_investigacion": 12,
                "duracion_semestres": 4
            },
            {
                "nombre": "Maestría en Ingeniería de Telecomunicaciones",
                "codigo_snies": "12347",
                "creditos_totales": 48,
                "creditos_obligatorios": 24,
                "creditos_electivos": 12,
                "creditos_investigacion": 12,
                "duracion_semestres": 4
            },
            {
                "nombre": "Maestría en Ingeniería Industrial",
                "codigo_snies": "12348",
                "creditos_totales": 48,
                "creditos_obligatorios": 24,
                "creditos_electivos": 12,
                "creditos_investigacion": 12,
                "duracion_semestres": 4
            }
        ]
        
        for m_data in maestrias:
            maestria = ProgramaPosgrado(
                nombre=m_data["nombre"],
                codigo_snies=m_data["codigo_snies"],
                nivel=NivelPrograma.MAESTRIA,
                id_escuela=escuela.id,
                creditos_totales=m_data["creditos_totales"],
                creditos_obligatorios=m_data["creditos_obligatorios"],
                creditos_electivos=m_data["creditos_electivos"],
                creditos_investigacion=m_data["creditos_investigacion"],
                duracion_semestres=m_data["duracion_semestres"],
                requiere_tesis=1,
                requiere_idioma=1,
                activo=1
            )
            db.add(maestria)
            print(f"✅ Programa creado: {maestria.nombre}")
        
        # 5. Crear Doctorado
        doctorado = ProgramaPosgrado(
            nombre="Doctorado en Ingeniería",
            codigo_snies="12349",
            nivel=NivelPrograma.DOCTORADO,
            id_escuela=escuela.id,
            creditos_totales=60,
            creditos_obligatorios=12,
            creditos_electivos=8,
            creditos_investigacion=40,
            duracion_semestres=8,
            requiere_tesis=1,
            requiere_idioma=1,
            activo=1
        )
        db.add(doctorado)
        print(f"✅ Programa creado: {doctorado.nombre}")
        
        # Commit
        db.commit()
        print("\n🎉 ¡Datos iniciales creados exitosamente!")
        print(f"   - 1 Facultad")
        print(f"   - 1 Escuela (E3T)")
        print(f"   - {len(grupos)} Grupos de Investigación")
        print(f"   - 4 Maestrías")
        print(f"   - 1 Doctorado")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_initial_data()