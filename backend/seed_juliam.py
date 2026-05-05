"""
Script para crear los datos de prueba de Juliam Díaz.
Ejecutar desde la carpeta backend/:

    python seed_juliam.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models import (
    Persona, Estudiante, ProyectoGrado, ProgramaPosgrado, Cohorte,
    Escuela, EstadoEstudiante, EstadoProyecto, TipoDocumento, NivelPrograma
)
from app.services.auth import hash_password
from datetime import datetime

Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:
    # ── 1. Personas ───────────────────────────────────────────────────────────
    juliam = db.query(Persona).filter(Persona.email_institucional == "estudiante@uis.edu.co").first()
    if not juliam:
        raise Exception("No se encontró estudiante@uis.edu.co")
    print(f"✅ Juliam encontrada: {juliam.nombre_completo} (id={juliam.id})")

    director = db.query(Persona).filter(Persona.email_institucional == "director@uis.edu.co").first()
    if not director:
        raise Exception("No se encontró director@uis.edu.co")
    print(f"✅ Director encontrado: {director.nombre_completo} (id={director.id})")

    codirector = db.query(Persona).filter(Persona.nombre_completo == "Ivan David Serna Suarez").first()
    if not codirector:
        codirector = Persona(
            nombre_completo="Ivan David Serna Suarez",
            email_institucional="idserna@uis.edu.co",
            documento_identidad="1000000005",
            hashed_password=hash_password("codirector123"),
        )
        db.add(codirector)
        db.flush()
        print(f"  ✅ Codirector creado: {codirector.nombre_completo} (id={codirector.id})")
    else:
        print(f"  ⏭️  Codirector ya existe: {codirector.nombre_completo} (id={codirector.id})")

    # ── 2. Programa: Doctorado en Ingeniería Electrónica ──────────────────────
    escuela = db.query(Escuela).filter(Escuela.codigo == "E3T").first()
    if not escuela:
        raise Exception("No se encontró la escuela E3T. Ejecuta seed.py primero.")

    programa = db.query(ProgramaPosgrado).filter(
        ProgramaPosgrado.codigo_snies == "DIE-001"
    ).first()
    if not programa:
        programa = ProgramaPosgrado(
            nombre="Doctorado en Ingeniería — Área Ingeniería Electrónica",
            codigo_snies="DIE-001",
            nivel=NivelPrograma.DOCTORADO,
            id_escuela=escuela.id,
            duracion_semestres=8,
            activo=1,
        )
        db.add(programa)
        db.flush()
        print(f"  ✅ Programa creado: {programa.nombre}")
    else:
        print(f"  ⏭️  Programa ya existe: {programa.nombre}")

    # ── 3. Cohorte 2025-2 ─────────────────────────────────────────────────────
    cohorte = db.query(Cohorte).filter(
        Cohorte.id_programa == programa.id,
        Cohorte.anio == 2025,
        Cohorte.periodo == 2,
    ).first()
    if not cohorte:
        cohorte = Cohorte(
            id_programa=programa.id,
            anio=2025,
            periodo=2,
            nombre="2025-2",
            fecha_inicio="2025-07-14",
            activo=1,
        )
        db.add(cohorte)
        db.flush()
        print(f"  ✅ Cohorte creada: {cohorte.nombre}")
    else:
        print(f"  ⏭️  Cohorte ya existe: {cohorte.nombre}")

    # ── 4. Estudiante ─────────────────────────────────────────────────────────
    estudiante = db.query(Estudiante).filter(Estudiante.id_persona == juliam.id).first()
    if not estudiante:
        estudiante = Estudiante(
            id_persona=juliam.id,
            id_programa=programa.id,
            id_cohorte=cohorte.id,
            codigo_estudiante="2238321",
            estado=EstadoEstudiante.ACTIVO,
            semestre_actual=2,
            promedio_acumulado="4.3",
            fecha_ingreso=datetime(2025, 7, 14),
            fecha_max_graduacion=datetime(2029, 12, 31),
        )
        db.add(estudiante)
        db.flush()
        print(f"  ✅ Estudiante creado: código {estudiante.codigo_estudiante}")
    else:
        estudiante.codigo_estudiante    = "2238321"
        estudiante.id_programa          = programa.id
        estudiante.id_cohorte           = cohorte.id
        estudiante.semestre_actual      = 2
        estudiante.fecha_ingreso        = datetime(2025, 7, 14)
        estudiante.fecha_max_graduacion = datetime(2029, 12, 31)
        db.flush()
        print(f"  ⏭️  Estudiante actualizado: semestre {estudiante.semestre_actual}")

    # ── 5. Proyecto de Grado ──────────────────────────────────────────────────
    proyecto = db.query(ProyectoGrado).filter(
        ProyectoGrado.id_estudiante == estudiante.id
    ).first()
    titulo = "Modelo de gestión de datos para redes eléctricas inteligentes mediante una arquitectura basada en Unified Namespace"
    if not proyecto:
        proyecto = ProyectoGrado(
            titulo=titulo,
            id_estudiante=estudiante.id,
            id_director=director.id,
            id_codirector=codirector.id,
            id_programa=programa.id,
            estado=EstadoProyecto.EN_DESARROLLO,
            tipo_documento=TipoDocumento.PROPUESTA_TESIS,
            fecha_inicio=datetime(2025, 7, 14),
        )
        db.add(proyecto)
        db.flush()
        print(f"  ✅ Proyecto creado")
    else:
        proyecto.titulo        = titulo
        proyecto.id_director   = director.id
        proyecto.id_codirector = codirector.id
        proyecto.id_programa   = programa.id
        db.flush()
        print(f"  ⏭️  Proyecto actualizado")

    db.commit()
    print("\n✅ Seed de Juliam completado.\n")
    print(f"  Persona id:  {juliam.id}")
    print(f"  Código:      {estudiante.codigo_estudiante}")
    print(f"  Cohorte:     {cohorte.nombre}")
    print(f"  Semestre:    {estudiante.semestre_actual}")
    print(f"  Programa:    {programa.nombre}")
    print(f"  Director:    {director.nombre_completo}")
    print(f"  Codirector:  {codirector.nombre_completo}")
    print(f"  Título:      {titulo[:70]}...")

except Exception as e:
    db.rollback()
    print(f"\n❌ Error: {e}")
    raise
finally:
    db.close()
