"""
Seed masivo de estudiantes - versión corregida.
Separa la creación del estudiante de la del proyecto para evitar rollbacks.
  python seed_estudiantes_2026.py
"""
import sys, os, re
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import Persona, Estudiante, ProgramaPosgrado, Cohorte, ProyectoGrado
from app.models.programa import Escuela, NivelPrograma
from app.models.proyecto import EstadoProyecto, TipoDocumento
from app.services.auth import hash_password
from datetime import date

db = SessionLocal()

PROGRAMA_MAP = {
    "Maestría en Ingeniería Eléctrica":    "Maestría en Ingeniería Eléctrica",
    "Maestría en Ingeniería Electrónica":  "Maestría en Ingeniería Electrónica",
    "Maestría en Telecomunicaciones":      "Maestría en Ingeniería de Telecomunicaciones",
    "Doctorado en Ingeniería Eléctrica":   "Doctorado en Ingeniería — Área Ingeniería Eléctrica",
    "Doctorado en Ingeniería Electrónica": "Doctorado en Ingeniería — Área Ingeniería Electrónica",
    "Doctorado en Ingeniería G&DT":        "Doctorado en Ingeniería — Área Gestión y Desarrollo Tecnológico",
}

NIVEL_MAP = {
    "Maestría":  NivelPrograma.MAESTRIA,
    "Doctorado": NivelPrograma.DOCTORADO,
}

SEMESTRES_MAX_ANIOS = {"Maestría": 4, "Doctorado": 8}

ESTUDIANTES = [
    # (nombre, programa_excel, semestre, nivel, correo, celular, nombre_director)
    ("Manzano Verjel Emanuel José",        "Maestría en Ingeniería Eléctrica",        1,  "Maestría",  "emanuel2269080@correo.uis.edu.co",  "3155960271", "María Alejandra Mantilla"),
    ("Rojas Paez José Camilo",             "Maestría en Ingeniería Eléctrica",        1,  "Maestría",  "jose2269081@correo.uis.edu.co",      "3015698321", "Germán Osma"),
    ("Marin Pinzón Nicolas Augusto",       "Maestría en Ingeniería Eléctrica",        4,  "Maestría",  "nicolas2248434@correo.uis.edu.co",   "3124987887", "Juan Manuel Rey"),
    ("Rizo Casadiego Aldo Marcel",         "Maestría en Ingeniería Eléctrica",        4,  "Maestría",  "aldo2248435@correo.uis.edu.co",      "3246302796", "Juan Manuel Rey"),
    ("Lizarazo Maldonado Alan Ferney",     "Maestría en Ingeniería Eléctrica",        4,  "Maestría",  "alan2248436@correo.uis.edu.co",      "3182359877", "German Osma"),
    ("Carreño Barrera Luis Felipe",        "Maestría en Ingeniería Eléctrica",        4,  "Maestría",  "luis2248437@correo.uis.edu.co",      "3174641354", "César Duarte"),
    ("Sandoval Manrique Jhon Héctor",      "Maestría en Ingeniería Eléctrica",        5,  "Maestría",  "jhon2248094@correo.uis.edu.co",      "3108123872", "Juan Manuel Rey"),
    ("Adarme López Edinson Fabian",        "Maestría en Ingeniería Eléctrica",        5,  "Maestría",  "edinson2248092@correo.uis.edu.co",   "3157116793", "Ernesto Aguilera"),
    ("Carrillo Valera Camilo Esteban",     "Maestría en Ingeniería Eléctrica",        5,  "Maestría",  "camilo2248093@correo.uis.edu.co",    "3017545999", "Ivan David Serna"),
    ("Torres Alfonso Cristhian Camilo",    "Maestría en Ingeniería Eléctrica",        5,  "Maestría",  "cristhian2238243@correo.uis.edu.co", "3162383445", "César Duarte"),
    ("Rojas Rincón Clara Lizeth",          "Maestría en Ingeniería Eléctrica",        6,  "Maestría",  "clara2238320@correo.uis.edu.co",     "3118380125", "Franklyn Sepúlveda"),
    ("Brito García Sergio",                "Maestría en Ingeniería Eléctrica",        7,  "Maestría",  "sergio2228528@correo.uis.edu.co",    "3166861087", "Joahnn Farith"),
    ("Ortega Díaz Liliana Patricia",       "Maestría en Ingeniería Eléctrica",        8,  "Maestría",  "liliana2228331@correo.uis.edu.co",   "3154581651", "German Alfonso Osma"),
    ("Zamora Lizarazo Jorge Andres",       "Maestría en Ingeniería Eléctrica",        9,  "Maestría",  "jorge2228117@correo.uis.edu.co",     "3176879767", "Edison Soto"),
    ("Gómez Carreño Andres Mauricio",      "Maestría en Ingeniería Eléctrica",        9,  "Maestría",  "andres2178544@correo.uis.edu.co",    "3164641020", "Maria Alejandra Mantilla"),
    ("Suárez Gil Rafael Santiago",         "Maestría en Ingeniería Electrónica",      1,  "Maestría",  "rafael2269082@correo.uis.edu.co",    "3166480179", "Henry Arguello"),
    ("Trigos Delgado Joseph Fernando",     "Maestría en Ingeniería Electrónica",      1,  "Maestría",  "joseph2269083@correo.uis.edu.co",    "3183981460", "Hans Yecid García"),
    ("Sarmiento Gómez Juan Camilo",        "Maestría en Ingeniería Electrónica",      2,  "Maestría",  "juan2258395@correo.uis.edu.co",      "3159209999", "Carlos Augusto Fajardo"),
    ("Vergel Sanabria Ricardo Matheo",     "Maestría en Ingeniería Electrónica",      2,  "Maestría",  "ricardo2258396@correo.uis.edu.co",   "3132549576", "Javier Ardila"),
    ("Olejua Santos Oscar Danilo",         "Maestría en Ingeniería Electrónica",      2,  "Maestría",  "oscar2238476@correo.uis.edu.co",     "3222276685", "Carlos Augusto Fajardo"),
    ("Valenzuela Sánchez María Fernanda",  "Maestría en Ingeniería Electrónica",      2,  "Maestría",  "maria2269156@correo.uis.edu.co",     "3213305267", "Said David Pertuz"),
    ("Uribe Gómez Sergio Alejandro",       "Maestría en Ingeniería Electrónica",      3,  "Maestría",  "sergio2258049@correo.uis.edu.co",    "3158464496", "Juan Manuel Rey"),
    ("Cerro Ramos Daniel Andres",          "Maestría en Ingeniería Electrónica",      3,  "Maestría",  "daniel2258050@correo.uis.edu.co",    "3115373727", "Franklin Sepulveda"),
    ("Angarita Pérez Jorge Eduardo",       "Maestría en Ingeniería Electrónica",      4,  "Maestría",  "jorge2248431@correo.uis.edu.co",     "3165115131", "Javier Ferney Ardila"),
    ("Ardila Leal Sebastian",              "Maestría en Ingeniería Electrónica",      4,  "Maestría",  "sebastian2248432@correo.uis.edu.co", "3144300093", "Henry Arguello"),
    ("Solano Torres Juan Carlos",          "Maestría en Ingeniería Electrónica",      4,  "Maestría",  "juan2248433@correo.uis.edu.co",      "3183567246", "Ana Beatriz"),
    ("Mantilla Rios Alex Julian",          "Maestría en Ingeniería Electrónica",      5,  "Maestría",  "alex2248086@correo.uis.edu.co",      "3187847799", "Javier Ferney Ardila"),
    ("Bravo Bravo María Angelica",         "Maestría en Ingeniería Electrónica",      5,  "Maestría",  "maria2248087@correo.uis.edu.co",     "3135379021", "Carlos Augusto Fajardo"),
    ("Cabeza Gutierrez Natalia Johanna",   "Maestría en Ingeniería Electrónica",      5,  "Maestría",  "natalia2248088@correo.uis.edu.co",   "3005580557", "Said Pertuz"),
    ("Niño Celis Luis Fernando",           "Maestría en Ingeniería Electrónica",      5,  "Maestría",  "luis2248089@correo.uis.edu.co",      "3203913379", "Julian Rodríguez"),
    ("Acevedo Velasquez Jeison Herney",    "Maestría en Ingeniería Electrónica",      5,  "Maestría",  "jeison2248090@correo.uis.edu.co",    "3188984679", "Javier Ferney Ardila"),
    ("Gil Moreno Sergio Andres",           "Maestría en Ingeniería Electrónica",      5,  "Maestría",  "sergio2248091@correo.uis.edu.co",    "3107733851", "Ana Beatriz"),
    ("Jimenez Díaz Mary Zuleika",          "Maestría en Ingeniería Electrónica",      6,  "Maestría",  "mary2238319@correo.uis.edu.co",      "3012357267", "Franklin Alexander"),
    ("Galvis Díaz Oscar Alexis",           "Maestría en Ingeniería Electrónica",      7,  "Maestría",  "oscar2228096@correo.uis.edu.co",     "3204488619", "Juan Manuel Rey"),
    ("Bautista Porras Mauricio",           "Maestría en Ingeniería Electrónica",      7,  "Maestría",  "mauricio2228098@correo.uis.edu.co",  "3214665281", "María Alejandra Mantilla"),
    ("Arias Cabeza Leidy Lorena",          "Maestría en Ingeniería Electrónica",      10, "Maestría",  "leidy2198153@correo.uis.edu.co",     "3183843503", "Rodolfo Villamizar"),
    ("Castillo Caballero Johan Alfonso",   "Maestría en Telecomunicaciones",          2,  "Maestría",  "johan2258397@correo.uis.edu.co",     "3156606874", "Carlos Augusto Fajardo"),
    ("Muñoz Vasquez Sebastian",            "Maestría en Telecomunicaciones",          2,  "Maestría",  "sebastian2258398@correo.uis.edu.co", "3168243440", "Juan Manuel Rey"),
    ("Infante Villamil Norbey Camilo",     "Maestría en Telecomunicaciones",          3,  "Maestría",  "norbey2258051@correo.uis.edu.co",    "3005443248", "Juan Manuel Rey"),
    ("Espinoza Caro Juan Daniel",          "Maestría en Telecomunicaciones",          4,  "Maestría",  "juan2248438@correo.uis.edu.co",      "3138129079", "Carlos Fajardo"),
    ("Rodríguez Rodríguez Harold Hernando","Maestría en Telecomunicaciones",          5,  "Maestría",  "harold2248097@correo.uis.edu.co",    "3173678407", "Carlos Fajardo"),
    ("Gonzalez Mateus David Alejandro",    "Maestría en Telecomunicaciones",          5,  "Maestría",  "david2248098@correo.uis.edu.co",     "3161082020", "Efren Acevedo"),
    ("Caballero Barajas Eduardo",          "Maestría en Telecomunicaciones",          5,  "Maestría",  "eduardo2248099@correo.uis.edu.co",   "3132317291", "Javier Ferney Ardila"),
    ("Calderon Quintero Elian",            "Maestría en Telecomunicaciones",          5,  "Maestría",  "elian2248100@correo.uis.edu.co",     "3008243749", "Efren Acevedo"),
    ("Delgado López Gilbert Joaquin",      "Maestría en Telecomunicaciones",          6,  "Maestría",  "gilbert2238322@correo.uis.edu.co",   "3184038281", "Juan Manuel Rey"),
    ("Salgado Meza Pedro Andres",          "Maestría en Telecomunicaciones",          8,  "Maestría",  "pedro2218080@correo.uis.edu.co",     "3113536931", "Julian Rodríguez"),
    ("Salas Pérez Joe Rolando",            "Maestría en Telecomunicaciones",          9,  "Maestría",  "joe2208470@correo.uis.edu.co",       "3164615274", "Julian Rodríguez"),
    ("Caceres Chanaga Jherson Ferley",     "Maestría en Telecomunicaciones",          9,  "Maestría",  "jherson2218425@correo.uis.edu.co",   "3222158297", "Julian Rodríguez"),
    ("Ortega Diaz Liliana Patricia",       "Doctorado en Ingeniería Eléctrica",       1,  "Doctorado", "liliana2228331b@correo.uis.edu.co",  "3154581651", "German Alfonso Osma"),
    ("Torres Alfonso Cristhian Camilo",    "Doctorado en Ingeniería Eléctrica",       1,  "Doctorado", "cristhian2238234@correo.uis.edu.co", "3162383445", "Cesar Duarte"),
    ("Rojas Rincón Clara Liseth",          "Doctorado en Ingeniería Eléctrica",       1,  "Doctorado", "clara2238320b@correo.uis.edu.co",    "3118380125", "Mónica Andrea Botero"),
    ("Balaguera Castro Nestor Alejandro",  "Doctorado en Ingeniería Eléctrica",       3,  "Doctorado", "nestor2148716@correo.uis.edu.co",    "3507267458", "German Osma"),
    ("Caballero Peña Juan Diego",          "Doctorado en Ingeniería Eléctrica",       8,  "Doctorado", "juan2208142@correo.uis.edu.co",      "3183907098", "Juan Manuel Rey"),
    ("Cortes Torres Jose David",           "Doctorado en Ingeniería Eléctrica",       4,  "Doctorado", "jose2148768@correo.uis.edu.co",      "3192991845", "César Duarte"),
    ("Martínez Peñaloza Alejandra",        "Doctorado en Ingeniería Eléctrica",       9,  "Doctorado", "alejandra2198146@correo.uis.edu.co", "3153919395", "German Osma"),
    ("Cárdenas Rangel Jorge Luis",         "Doctorado en Ingeniería Eléctrica",       9,  "Doctorado", "jorge2148225@correo.uis.edu.co",     "3133178000", "German Osma"),
    ("Esparza Gómez Jose David",           "Doctorado en Ingeniería Eléctrica",       8,  "Doctorado", "jose2218081@correo.uis.edu.co",      "3156781057", "Oscar Quiroga"),
    ("Rincón Adarme David Javier",         "Doctorado en Ingeniería Eléctrica",       9,  "Doctorado", "david2148769@correo.uis.edu.co",     "3026667307", "María Alejandra Mantilla"),
    ("León Vanegas Camila Alejandra",      "Doctorado en Ingeniería G&DT",            4,  "Doctorado", "camila2248439@correo.uis.edu.co",    "3184667621", "Martha Liliana Torres"),
    ("Leon Esteban Andres Felipe",         "Doctorado en Ingeniería G&DT",            5,  "Doctorado", "andres2158769@correo.uis.edu.co",    "3163398051", "Kafarov"),
    ("Fonseca Abril Edher Duvan",          "Doctorado en Ingeniería G&DT",            8,  "Doctorado", "edher2218440@correo.uis.edu.co",     "3185068250", "Clara Isabel"),
    ("Parada Mayorga Pilar Tatiana",       "Doctorado en Ingeniería G&DT",            12, "Doctorado", "pilar2117670@correo.uis.edu.co",     "3114993900", "Oscar Quiroga"),
    ("Guarin Manrique Dayhana",            "Doctorado en Ingeniería G&DT",            14, "Doctorado", "dayhana2127825@correo.uis.edu.co",   "3106964594", "Hugo Martínez"),
    ("Delgado Lopez Gilbert Joaquin",      "Doctorado en Ingeniería Electrónica",     1,  "Doctorado", "gilbert2238322b@correo.uis.edu.co",  "3184038281", "Juan Manuel Rey"),
    ("Rodríguez Rodríguez Harold Hernando","Doctorado en Ingeniería Electrónica",     1,  "Doctorado", "harold2248097b@correo.uis.edu.co",   "3173678407", "Hans Yecid García"),
    ("Bravo Bravo María Angelica",         "Doctorado en Ingeniería Electrónica",     1,  "Doctorado", "maria2248087b@correo.uis.edu.co",    "3135379021", "Hans Yecid García"),
    ("Ardila Leal Sebastian",              "Doctorado en Ingeniería Electrónica",     1,  "Doctorado", "sebastian2248432b@correo.uis.edu.co","3144300093", "Hans Yecid García"),
    ("Cancino Rey William Andrés",         "Doctorado en Ingeniería Electrónica",     1,  "Doctorado", "william2238072@correo.uis.edu.co",   "3166908121", "Said David Pertuz"),
    ("Dovale Vargas Luisa Fernanda",       "Doctorado en Ingeniería Electrónica",     1,  "Doctorado", "luisa2198610@correo.uis.edu.co",     "3154021483", "Daniel Sierra"),
    ("Díaz Barrera Juliam Andres",         "Doctorado en Ingeniería Electrónica",     2,  "Doctorado", "juliam2238321@correo.uis.edu.co",    "3156494472", "Juan Manuel Rey"),
    ("Santos Ortiz Camilo Andres",         "Doctorado en Ingeniería Electrónica",     2,  "Doctorado", "camilo2238323@correo.uis.edu.co",    "3158024039", "Carlos Augusto Fajardo"),
    ("Vecino Urrea Sergio Andres",         "Doctorado en Ingeniería Electrónica",     5,  "Doctorado", "sergio2228328@correo.uis.edu.co",    "3163401960", "Henry Arguello"),
    ("Fonseca Estupiñan Karen Andrea",     "Doctorado en Ingeniería Electrónica",     5,  "Doctorado", "karen2228329@correo.uis.edu.co",     "3212594255", "Henry Arguello"),
    ("Gómez Toloza Pablo Andres",          "Doctorado en Ingeniería Electrónica",     5,  "Doctorado", "pablo2228330@correo.uis.edu.co",     "3005535021", "Henry Arguello"),
    ("Jacome Roman Alejandro",             "Doctorado en Ingeniería Electrónica",     3,  "Doctorado", "roman2228081@correo.uis.edu.co",     "3166265615", "Henry Arguello"),
    ("Velez Sánchez Jeisson Emilio",       "Doctorado en Ingeniería Electrónica",     12, "Doctorado", "jeisson2169094@correo.uis.edu.co",   "3125019986", "Mónica Andrea Botero"),
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def get_or_create_programa(nombre_excel, nivel):
    nombre_bd = PROGRAMA_MAP.get(nombre_excel, nombre_excel)
    prog = db.query(ProgramaPosgrado).filter(
        ProgramaPosgrado.nombre.ilike(f"%{nombre_bd[:25]}%")
    ).first()
    if not prog:
        escuela = db.query(Escuela).first()
        prog = ProgramaPosgrado(
            nombre=nombre_bd,
            nivel=NIVEL_MAP.get(nivel, NivelPrograma.MAESTRIA),
            id_escuela=escuela.id if escuela else 1,
        )
        db.add(prog)
        db.flush()
        print(f"  📚 Programa creado: {nombre_bd}")
    return prog

def get_or_create_cohorte(programa_id):
    cohorte = db.query(Cohorte).filter(
        Cohorte.id_programa == programa_id,
        Cohorte.nombre == "2025-II",
    ).first()
    if not cohorte:
        cohorte = Cohorte(
            id_programa=programa_id,
            nombre="2025-II",
            anio=2025,
            periodo=2,
            fecha_inicio="2025-07-14",
            activo=1,
        )
        db.add(cohorte)
        db.flush()
    return cohorte

def get_or_create_persona(nombre, correo, celular):
    persona = db.query(Persona).filter(Persona.email_institucional == correo).first()
    if not persona:
        persona = Persona(
            nombre_completo=nombre,
            email_institucional=correo,
            telefono=celular,
            hashed_password=hash_password("uis2026"),
        )
        db.add(persona)
        db.flush()
    else:
        if not persona.hashed_password:
            persona.hashed_password = hash_password("uis2026")
        db.flush()
    return persona

def buscar_director(nombre_director):
    partes = [p for p in nombre_director.strip().split() if len(p) > 3]
    for parte in partes:
        p = db.query(Persona).filter(Persona.nombre_completo.ilike(f"%{parte}%")).first()
        if p:
            return p
    # Crear sin contraseña
    email_gen = re.sub(r'[^a-z.]', '', nombre_director.lower().replace(" ", "."))[:30] + "@uis.edu.co"
    p = Persona(nombre_completo=nombre_director, email_institucional=email_gen)
    db.add(p)
    db.flush()
    return p

def extraer_codigo(correo):
    m = re.search(r'(\d{7,})', correo)
    return m.group(1) if m else correo.split("@")[0][-7:]

# ── Main ──────────────────────────────────────────────────────────────────────

try:
    creados = actualizados = errores_est = errores_proy = 0
    print(f"\n🚀 Procesando {len(ESTUDIANTES)} estudiantes...\n")

    for (nombre, prog_excel, semestre, nivel, correo, celular, dir_nombre) in ESTUDIANTES:

        # ── PASO 1: Estudiante (transacción independiente) ──────────────────
        try:
            programa = get_or_create_programa(prog_excel, nivel)
            cohorte  = get_or_create_cohorte(programa.id)
            persona  = get_or_create_persona(nombre, correo, celular)
            codigo   = extraer_codigo(correo)

            anio_ing = int("20" + codigo[:2]) if len(codigo) >= 7 else 2024
            fecha_max = date(anio_ing + SEMESTRES_MAX_ANIOS.get(nivel, 4), 12, 31)

            est = db.query(Estudiante).filter(
                Estudiante.id_persona == persona.id,
                Estudiante.id_programa == programa.id,
            ).first()

            if not est:
                # Verificar que el código no esté duplicado
                est_cod = db.query(Estudiante).filter(
                    Estudiante.codigo_estudiante == codigo
                ).first()
                if est_cod:
                    # El código ya existe para otro programa, usar código modificado
                    codigo = codigo + "x"

                est = Estudiante(
                    id_persona=persona.id,
                    id_programa=programa.id,
                    id_cohorte=cohorte.id,
                    codigo_estudiante=codigo,
                    semestre_actual=semestre,
                    estado="activo",
                    fecha_max_graduacion=fecha_max,
                )
                db.add(est)
                db.commit()
                creados += 1
            else:
                est.semestre_actual = semestre
                est.estado = "activo"
                db.commit()
                actualizados += 1

        except Exception as e:
            db.rollback()
            print(f"  ❌ Est: {nombre[:35]} → {e}")
            errores_est += 1
            continue

        # ── PASO 2: Proyecto (transacción independiente) ────────────────────
        try:
            proyecto = db.query(ProyectoGrado).filter(
                ProyectoGrado.id_estudiante == est.id
            ).first()

            if not proyecto:
                director = buscar_director(dir_nombre) if dir_nombre else None

                tipo_doc = (TipoDocumento.PROPUESTA_TESIS
                            if nivel == "Doctorado"
                            else TipoDocumento.PLAN_INVESTIGACION)

                proyecto = ProyectoGrado(
                    id_estudiante=est.id,
                    id_director=director.id if director else None,
                    id_programa=programa.id,
                    titulo=f"Proyecto de {nombre}",
                    estado=EstadoProyecto.EN_DESARROLLO,
                    tipo_documento=tipo_doc,
                )
                db.add(proyecto)
                db.commit()
            else:
                # Actualizar director si no tiene
                if not proyecto.id_director and dir_nombre:
                    director = buscar_director(dir_nombre)
                    if director:
                        proyecto.id_director = director.id
                        db.commit()

        except Exception as e:
            db.rollback()
            print(f"  ⚠️  Proy: {nombre[:35]} → {e}")
            errores_proy += 1

        print(f"  ✅ {nombre[:40]:<40} | Sem {semestre} | {prog_excel[:25]}")

    print(f"\n{'='*65}")
    print(f"🎉 Completado:")
    print(f"   ✅ Estudiantes creados:      {creados}")
    print(f"   🔄 Estudiantes actualizados: {actualizados}")
    print(f"   ❌ Errores estudiante:       {errores_est}")
    print(f"   ⚠️  Errores proyecto:        {errores_proy}")
    print(f"\n   🔑 Contraseña: uis2026")
    print(f"{'='*65}\n")

except Exception as e:
    db.rollback()
    print(f"\n❌ Error general: {e}")
    import traceback; traceback.print_exc()
finally:
    db.close()
