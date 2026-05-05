"""
Script de seed — crea usuarios y roles de prueba.
Ejecutar UNA sola vez desde la carpeta backend/:

    python seed.py

Usuarios creados:
  estudiante@uis.edu.co  / estudiante123
  director@uis.edu.co    / director123
  coordinador@uis.edu.co / coordinador123
  comite@uis.edu.co      / comite123
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models import (
    Persona, CatalogoRol, VinculacionActiva, ProgramaPosgrado,
    Facultad, Escuela, NivelPrograma
)
from app.services.auth import hash_password
from datetime import datetime

Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # ── 1. Roles ──────────────────────────────────────────────────────────────
    print("Creando roles...")
    roles_data = [
        {"codigo": "estudiante",   "nombre": "Estudiante",         "descripcion": "Estudiante activo de posgrado"},
        {"codigo": "director",     "nombre": "Director de Tesis",  "descripcion": "Director de proyecto de grado"},
        {"codigo": "coordinador",  "nombre": "Coordinador",        "descripcion": "Coordinador del programa"},
        {"codigo": "comite",       "nombre": "Comité de Posgrado", "descripcion": "Miembro del comité asesor"},
    ]
    roles = {}
    for r in roles_data:
        rol = db.query(CatalogoRol).filter(CatalogoRol.codigo == r["codigo"]).first()
        if not rol:
            rol = CatalogoRol(**r)
            db.add(rol)
            db.flush()
            print(f"  ✅ Rol creado: {r['codigo']}")
        else:
            print(f"  ⏭️  Rol ya existe: {r['codigo']}")
        roles[r["codigo"]] = rol

    # ── 2. Facultad ───────────────────────────────────────────────────────────
    print("\nCreando facultad...")
    facultad = db.query(Facultad).filter(Facultad.codigo == "FING").first()
    if not facultad:
        facultad = Facultad(nombre="Facultad de Ingenierías Físico-Mecánicas", codigo="FING")
        db.add(facultad)
        db.flush()
        print("  ✅ Facultad creada: FING")
    else:
        print("  ⏭️  Facultad ya existe: FING")

    # ── 3. Escuela ────────────────────────────────────────────────────────────
    print("\nCreando escuela...")
    escuela = db.query(Escuela).filter(Escuela.codigo == "E3T").first()
    if not escuela:
        escuela = Escuela(
            nombre="Escuela de Ingeniería Eléctrica, Electrónica y de Telecomunicaciones",
            codigo="E3T",
            id_facultad=facultad.id,
        )
        db.add(escuela)
        db.flush()
        print("  ✅ Escuela creada: E3T")
    else:
        print("  ⏭️  Escuela ya existe: E3T")

    # ── 4. Programa ───────────────────────────────────────────────────────────
    print("\nCreando programa...")
    programa = db.query(ProgramaPosgrado).filter(
        ProgramaPosgrado.codigo_snies == "MIE-001"
    ).first()
    if not programa:
        programa = ProgramaPosgrado(
            nombre="Maestría en Ingeniería Electrónica",
            codigo_snies="MIE-001",
            nivel=NivelPrograma.MAESTRIA,
            id_escuela=escuela.id,
            duracion_semestres=4,
            activo=1,
        )
        db.add(programa)
        db.flush()
        print(f"  ✅ Programa creado: {programa.nombre}")
    else:
        print(f"  ⏭️  Programa ya existe: {programa.nombre}")

    # ── 5. Usuarios ───────────────────────────────────────────────────────────
    print("\nCreando usuarios...")
    usuarios = [
        {
            "email_institucional": "estudiante@uis.edu.co",
            "nombre_completo": "Juliam Díaz Rodríguez",
            "documento_identidad": "1000000001",
            "password": "estudiante123",
            "rol": "estudiante",
        },
        {
            "email_institucional": "director@uis.edu.co",
            "nombre_completo": "Dr. Omar Tíjaro Rojas",
            "documento_identidad": "1000000002",
            "password": "director123",
            "rol": "director",
        },
        {
            "email_institucional": "coordinador@uis.edu.co",
            "nombre_completo": "Dra. Patricia Gómez León",
            "documento_identidad": "1000000003",
            "password": "coordinador123",
            "rol": "coordinador",
        },
        {
            "email_institucional": "comite@uis.edu.co",
            "nombre_completo": "Comité Asesor E3T",
            "documento_identidad": "1000000004",
            "password": "comite123",
            "rol": "comite",
        },
    ]

    for u in usuarios:
        persona = db.query(Persona).filter(
            Persona.email_institucional == u["email_institucional"]
        ).first()

        if not persona:
            persona = Persona(
                email_institucional=u["email_institucional"],
                nombre_completo=u["nombre_completo"],
                documento_identidad=u["documento_identidad"],
                hashed_password=hash_password(u["password"]),
            )
            db.add(persona)
            db.flush()
            print(f"  ✅ Usuario creado: {u['email_institucional']}")
        else:
            print(f"  ⏭️  Usuario ya existe: {u['email_institucional']}")

        # Asignar rol si no lo tiene
        vinculacion = db.query(VinculacionActiva).filter(
            VinculacionActiva.id_persona == persona.id,
            VinculacionActiva.id_rol == roles[u["rol"]].id,
        ).first()

        if not vinculacion:
            vinculacion = VinculacionActiva(
                id_persona=persona.id,
                id_rol=roles[u["rol"]].id,
                tipo_contexto="programa",
                id_contexto=programa.id,
                fecha_inicio=datetime.utcnow(),
                es_activo=1,
            )
            db.add(vinculacion)
            print(f"     → Rol '{u['rol']}' asignado")

    db.commit()
    print("\n✅ Seed completado exitosamente.")
    print("\nUsuarios disponibles:")
    print("  estudiante@uis.edu.co   / estudiante123")
    print("  director@uis.edu.co     / director123")
    print("  coordinador@uis.edu.co  / coordinador123")
    print("  comite@uis.edu.co       / comite123")

except Exception as e:
    db.rollback()
    print(f"\n❌ Error durante el seed: {e}")
    raise
finally:
    db.close()
