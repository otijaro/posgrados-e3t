"""
Crea los proyectos de grado para los estudiantes ya registrados.
Corre DESPUÉS de seed_estudiantes_2026.py:
  python seed_proyectos_2026.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import Estudiante, ProyectoGrado
from app.models.proyecto import EstadoProyecto, TipoDocumento

db = SessionLocal()

try:
    estudiantes = db.query(Estudiante).all()
    creados = 0
    ya_tienen = 0

    print(f"\n🚀 Creando proyectos para {len(estudiantes)} estudiantes...\n")

    for est in estudiantes:
        # Verificar si ya tiene proyecto
        if db.query(ProyectoGrado).filter(ProyectoGrado.id_estudiante == est.id).first():
            ya_tienen += 1
            continue

        # Determinar tipo de documento según nivel del programa
        nivel = est.programa.nivel.value if est.programa else "maestria"
        if "doctorado" in nivel:
            tipo_doc = TipoDocumento.PROPUESTA_TESIS
        else:
            tipo_doc = TipoDocumento.PLAN_INVESTIGACION

        proyecto = ProyectoGrado(
            id_estudiante=est.id,
            id_director=None,   # Se actualizará luego si se conoce
            id_programa=est.id_programa,
            titulo=f"Proyecto de {est.persona.nombre_completo}",
            estado=EstadoProyecto.EN_DESARROLLO,
            tipo_documento=tipo_doc,
        )
        db.add(proyecto)
        db.flush()
        creados += 1
        print(f"  ✅ {est.persona.nombre_completo[:45]:<45} | {tipo_doc.value}")

    db.commit()
    print(f"\n{'='*60}")
    print(f"🎉 Proyectos creados:    {creados}")
    print(f"   Ya tenían proyecto:  {ya_tienen}")
    print(f"{'='*60}\n")

    # Ahora vincular directores desde la BD ya poblada
    print("🔗 Vinculando directores a proyectos...\n")

    from app.models import Persona

    DIRECTOR_MAP = [
        # (correo_estudiante, nombre_parcial_director)
        ("emanuel2269080@correo.uis.edu.co", "Alejandra Mantilla"),
        ("jose2269081@correo.uis.edu.co",    "Germán Osma"),
        ("nicolas2248434@correo.uis.edu.co",  "Juan Manuel Rey"),
        ("aldo2248435@correo.uis.edu.co",     "Juan Manuel Rey"),
        ("alan2248436@correo.uis.edu.co",     "German Osma"),
        ("luis2248437@correo.uis.edu.co",     "César Duarte"),
        ("jhon2248094@correo.uis.edu.co",     "Juan Manuel Rey"),
        ("edinson2248092@correo.uis.edu.co",  "Ernesto Aguilera"),
        ("camilo2248093@correo.uis.edu.co",   "Ivan David Serna"),
        ("cristhian2238243@correo.uis.edu.co","César Duarte"),
        ("clara2238320@correo.uis.edu.co",    "Franklyn Sepúlveda"),
        ("sergio2228528@correo.uis.edu.co",   "Joahnn Farith"),
        ("liliana2228331@correo.uis.edu.co",  "German Alfonso Osma"),
        ("jorge2228117@correo.uis.edu.co",    "Edison Soto"),
        ("andres2178544@correo.uis.edu.co",   "Alejandra Mantilla"),
        ("rafael2269082@correo.uis.edu.co",   "Henry Arguello"),
        ("joseph2269083@correo.uis.edu.co",   "Hans Yecid"),
        ("juan2258395@correo.uis.edu.co",     "Carlos Augusto Fajardo"),
        ("ricardo2258396@correo.uis.edu.co",  "Javier Ardila"),
        ("oscar2238476@correo.uis.edu.co",    "Carlos Augusto Fajardo"),
        ("maria2269156@correo.uis.edu.co",    "Said David Pertuz"),
        ("sergio2258049@correo.uis.edu.co",   "Juan Manuel Rey"),
        ("daniel2258050@correo.uis.edu.co",   "Franklin Sepulveda"),
        ("jorge2248431@correo.uis.edu.co",    "Javier Ferney Ardila"),
        ("sebastian2248432@correo.uis.edu.co","Henry Arguello"),
        ("juan2248433@correo.uis.edu.co",     "Ana Beatriz"),
        ("alex2248086@correo.uis.edu.co",     "Javier Ferney Ardila"),
        ("maria2248087@correo.uis.edu.co",    "Carlos Augusto Fajardo"),
        ("natalia2248088@correo.uis.edu.co",  "Said Pertuz"),
        ("luis2248089@correo.uis.edu.co",     "Julian Rodríguez"),
        ("jeison2248090@correo.uis.edu.co",   "Javier Ferney Ardila"),
        ("sergio2248091@correo.uis.edu.co",   "Ana Beatriz"),
        ("mary2238319@correo.uis.edu.co",     "Franklin"),
        ("oscar2228096@correo.uis.edu.co",    "Juan Manuel Rey"),
        ("mauricio2228098@correo.uis.edu.co", "Alejandra Mantilla"),
        ("leidy2198153@correo.uis.edu.co",    "Rodolfo Villamizar"),
        ("johan2258397@correo.uis.edu.co",    "Carlos Augusto Fajardo"),
        ("sebastian2258398@correo.uis.edu.co","Juan Manuel Rey"),
        ("norbey2258051@correo.uis.edu.co",   "Juan Manuel Rey"),
        ("juan2248438@correo.uis.edu.co",     "Carlos Fajardo"),
        ("harold2248097@correo.uis.edu.co",   "Carlos Fajardo"),
        ("david2248098@correo.uis.edu.co",    "Efren Acevedo"),
        ("eduardo2248099@correo.uis.edu.co",  "Javier Ferney Ardila"),
        ("elian2248100@correo.uis.edu.co",    "Efren Acevedo"),
        ("gilbert2238322@correo.uis.edu.co",  "Juan Manuel Rey"),
        ("pedro2218080@correo.uis.edu.co",    "Julian Rodríguez"),
        ("joe2208470@correo.uis.edu.co",      "Julian Rodríguez"),
        ("jherson2218425@correo.uis.edu.co",  "Julian Rodríguez"),
        ("liliana2228331b@correo.uis.edu.co", "German Alfonso Osma"),
        ("cristhian2238234@correo.uis.edu.co","Cesar Duarte"),
        ("clara2238320b@correo.uis.edu.co",   "Mónica Andrea Botero"),
        ("nestor2148716@correo.uis.edu.co",   "German Osma"),
        ("juan2208142@correo.uis.edu.co",     "Juan Manuel Rey"),
        ("jose2148768@correo.uis.edu.co",     "César Duarte"),
        ("alejandra2198146@correo.uis.edu.co","German Osma"),
        ("jorge2148225@correo.uis.edu.co",    "German Osma"),
        ("jose2218081@correo.uis.edu.co",     "Oscar Quiroga"),
        ("david2148769@correo.uis.edu.co",    "Alejandra Mantilla"),
        ("camila2248439@correo.uis.edu.co",   "Martha Liliana Torres"),
        ("andres2158769@correo.uis.edu.co",   "Kafarov"),
        ("edher2218440@correo.uis.edu.co",    "Clara Isabel"),
        ("pilar2117670@correo.uis.edu.co",    "Oscar Quiroga"),
        ("dayhana2127825@correo.uis.edu.co",  "Hugo Martínez"),
        ("gilbert2238322b@correo.uis.edu.co", "Juan Manuel Rey"),
        ("harold2248097b@correo.uis.edu.co",  "Hans Yecid"),
        ("maria2248087b@correo.uis.edu.co",   "Hans Yecid"),
        ("sebastian2248432b@correo.uis.edu.co","Hans Yecid"),
        ("william2238072@correo.uis.edu.co",  "Said David Pertuz"),
        ("luisa2198610@correo.uis.edu.co",    "Daniel Sierra"),
        ("juliam2238321@correo.uis.edu.co",   "Juan Manuel Rey"),
        ("camilo2238323@correo.uis.edu.co",   "Carlos Augusto Fajardo"),
        ("sergio2228328@correo.uis.edu.co",   "Henry Arguello"),
        ("karen2228329@correo.uis.edu.co",    "Henry Arguello"),
        ("pablo2228330@correo.uis.edu.co",    "Henry Arguello"),
        ("roman2228081@correo.uis.edu.co",    "Henry Arguello"),
        ("jeisson2169094@correo.uis.edu.co",  "Mónica Andrea"),
    ]

    vinculados = 0
    for correo_est, nombre_dir in DIRECTOR_MAP:
        persona_est = db.query(Persona).filter(Persona.email_institucional == correo_est).first()
        if not persona_est:
            continue

        est = db.query(Estudiante).filter(Estudiante.id_persona == persona_est.id).first()
        if not est:
            continue

        proyecto = db.query(ProyectoGrado).filter(ProyectoGrado.id_estudiante == est.id).first()
        if not proyecto:
            continue

        # Buscar director por nombre parcial
        partes = [p for p in nombre_dir.split() if len(p) > 3]
        director = None
        for parte in partes:
            director = db.query(Persona).filter(
                Persona.nombre_completo.ilike(f"%{parte}%")
            ).first()
            if director and director.id != persona_est.id:
                break

        if director and director.id != persona_est.id:
            proyecto.id_director = director.id
            vinculados += 1

    db.commit()
    print(f"  ✅ Directores vinculados: {vinculados} de {len(DIRECTOR_MAP)}\n")

except Exception as e:
    db.rollback()
    print(f"\n❌ Error: {e}")
    import traceback; traceback.print_exc()
finally:
    db.close()
