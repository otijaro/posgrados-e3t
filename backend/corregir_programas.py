"""
Corrige la asignación de programas a estudiantes.
  python corregir_programas.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import ProgramaPosgrado, Estudiante, Persona, Cohorte
from app.models.programa import NivelPrograma, Escuela

db = SessionLocal()

# Correos de estudiantes por programa correcto
MAESTRIA_ELECTRICA = [
    "emanuel2269080@correo.uis.edu.co", "jose2269081@correo.uis.edu.co",
    "nicolas2248434@correo.uis.edu.co", "aldo2248435@correo.uis.edu.co",
    "alan2248436@correo.uis.edu.co",    "luis2248437@correo.uis.edu.co",
    "jhon2248094@correo.uis.edu.co",    "edinson2248092@correo.uis.edu.co",
    "camilo2248093@correo.uis.edu.co",  "cristhian2238243@correo.uis.edu.co",
    "clara2238320@correo.uis.edu.co",   "sergio2228528@correo.uis.edu.co",
    "liliana2228331@correo.uis.edu.co", "jorge2228117@correo.uis.edu.co",
    "andres2178544@correo.uis.edu.co",
]

DOC_ELECTRICA = [
    "liliana2228331b@correo.uis.edu.co", "cristhian2238234@correo.uis.edu.co",
    "clara2238320b@correo.uis.edu.co",   "nestor2148716@correo.uis.edu.co",
    "juan2208142@correo.uis.edu.co",     "jose2148768@correo.uis.edu.co",
    "alejandra2198146@correo.uis.edu.co","jorge2148225@correo.uis.edu.co",
    "jose2218081@correo.uis.edu.co",     "david2148769@correo.uis.edu.co",
]

DOC_GDT = [
    "camila2248439@correo.uis.edu.co", "andres2158769@correo.uis.edu.co",
    "edher2218440@correo.uis.edu.co",  "pilar2117670@correo.uis.edu.co",
    "dayhana2127825@correo.uis.edu.co",
]

try:
    escuela = db.query(Escuela).first()
    escuela_id = escuela.id if escuela else 1

    # ── Asegurar que existen los programas correctos ──────────────────────────

    def get_or_create_prog(nombre, nivel_str):
        nivel = NivelPrograma.MAESTRIA if nivel_str == "maestria" else NivelPrograma.DOCTORADO
        p = db.query(ProgramaPosgrado).filter(
            ProgramaPosgrado.nombre == nombre
        ).first()
        if not p:
            p = ProgramaPosgrado(nombre=nombre, nivel=nivel, id_escuela=escuela_id)
            db.add(p)
            db.flush()
            print(f"  📚 Programa creado: {nombre} (id={p.id})")
        else:
            print(f"  ✅ Programa existe: {nombre} (id={p.id})")
        return p

    print("\n🔍 Verificando programas...\n")
    prog_mae_elec    = get_or_create_prog("Maestría en Ingeniería Eléctrica",                                 "maestria")
    prog_doc_electrica = get_or_create_prog("Doctorado en Ingeniería — Área Ingeniería Eléctrica",           "doctorado")
    prog_doc_gdt     = get_or_create_prog("Doctorado en Ingeniería — Área Gestión y Desarrollo Tecnológico", "doctorado")
    prog_doc_electronica = db.query(ProgramaPosgrado).filter(
        ProgramaPosgrado.nombre == "Doctorado en Ingeniería — Área Ingeniería Electrónica"
    ).first()
    db.commit()

    # ── Función para reasignar programa ───────────────────────────────────────

    def reasignar(correos, programa):
        corregidos = 0
        for correo in correos:
            persona = db.query(Persona).filter(Persona.email_institucional == correo).first()
            if not persona:
                print(f"  ⚠️  Persona no encontrada: {correo}")
                continue
            est = db.query(Estudiante).filter(Estudiante.id_persona == persona.id).first()
            if not est:
                print(f"  ⚠️  Estudiante no encontrado: {correo}")
                continue
            if est.id_programa != programa.id:
                # Buscar o crear cohorte para el programa correcto
                cohorte = db.query(Cohorte).filter(
                    Cohorte.id_programa == programa.id,
                    Cohorte.nombre == "2025-II"
                ).first()
                if not cohorte:
                    cohorte = Cohorte(
                        id_programa=programa.id,
                        nombre="2025-II", anio=2025, periodo=2,
                        fecha_inicio="2025-07-14", activo=1,
                    )
                    db.add(cohorte)
                    db.flush()

                est.id_programa = programa.id
                est.id_cohorte  = cohorte.id

                # Actualizar proyecto si existe
                if est.proyecto:
                    est.proyecto.id_programa = programa.id

                corregidos += 1
        return corregidos

    print("\n🔧 Reasignando programas...\n")

    n = reasignar(MAESTRIA_ELECTRICA, prog_mae_elec)
    print(f"  ✅ Maestría Eléctrica:           {n} estudiantes corregidos")

    n = reasignar(DOC_ELECTRICA, prog_doc_electrica)
    print(f"  ✅ Doctorado Eléctrica:          {n} estudiantes corregidos")

    n = reasignar(DOC_GDT, prog_doc_gdt)
    print(f"  ✅ Doctorado G&DT:               {n} estudiantes corregidos")

    db.commit()

    # ── Verificación final ────────────────────────────────────────────────────
    print("\n📊 Estado final:\n")
    for p in db.query(ProgramaPosgrado).order_by(ProgramaPosgrado.id).all():
        count = db.query(Estudiante).filter(Estudiante.id_programa == p.id).count()
        print(f"  id={p.id:<3} {p.nombre:<60} {count} est.")

    print("\n✅ Corrección completada.\n")

except Exception as e:
    db.rollback()
    print(f"\n❌ Error: {e}")
    import traceback; traceback.print_exc()
finally:
    db.close()
