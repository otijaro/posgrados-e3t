"""
Seed de profesores y personal administrativo - versión corregida.
Las personas ya quedaron creadas, este script solo vincula los roles.
También crea las personas que no existan.
  python seed_profesores_2026.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import Persona, CatalogoRol, VinculacionActiva
from app.services.auth import hash_password

db = SessionLocal()

PERSONAS = [
    # (nombre, tipo_contratacion, cargo, celular, correo)
    ("Abreo Carrillo Sergio Alberto",        "Profesor Cátedra",    "Profesor",       "3165387089", "abreosergio@gmail.com"),
    ("Acevedo Cardenas Efren Dario",         "Profesor Cátedra",    "Profesor",       "3138682820", "efrenacevedoc@gmail.com"),
    ("Acevedo Velasquez Jeison Herney",      "Profesor Cátedra",    "Profesor",       "3188984679", "jherney30@gmail.com"),
    ("Amorocho Sepulveda Faver Adrian",      "Profesor Cátedra",    "Profesor",       "3177113921", "faveramorocho@gmail.com"),
    ("Angarita Macias Wilson Vladimir",      "Profesor Cátedra",    "Profesor",       "3013335663", "wilsonangarita@gmail.com"),
    ("Angulo Julio Carlos Andres",           "Profesor Cátedra",    "Profesor",       "3002191965", "carlos.angulo@e3t.uis.edu.co"),
    ("Ariza Angarita Carlos Uriel",          "Profesor Cátedra",    "Profesor",       "3175763598", "cuas67@gmail.com"),
    ("Boada Quijano Carlos Arturo",          "Profesor Cátedra",    "Profesor",       "3005703850", "carturoboada@gmail.com"),
    ("Caballero Barajas Eduardo",            "Profesor Cátedra",    "Profesor",       "3132317291", "ec340121@gmail.com"),
    ("Camacho Navarro Jhonatan",             "Profesor Cátedra",    "Profesor",       "3002061494", "camacho.navarro.jhonatan@gmail.com"),
    ("Cardenas Rangel Jorge Luis",           "Profesor Cátedra",    "Profesor",       "3133178000", "jolucara22@gmail.com"),
    ("Carreño Barrera Luis Felipe",          "Profesor Cátedra",    "Profesor",       "3176229437", "lucarreno13@gmail.com"),
    ("Castelblanco Rodriguez Nelfor Samael", "Profesor Cátedra",    "Profesor",       "3102786795", "nelforcastel@yahoo.es"),
    ("Castillo Bohorquez Jeison Arley",      "Profesor Cátedra",    "Profesor",       "3167097507", "jeison.castillo.ai@gmail.com"),
    ("Castro Jaluba William Razvan",         "Profesor Cátedra",    "Profesor",       "3165774847", "williamrazvan@gmail.com"),
    ("Chacon Velasco Julio Cesar",           "Profesor Cátedra",    "Profesor",       "3157912529", "jcchaconv@gmail.com"),
    ("Correa Dominguez William Fernando",    "Profesor Cátedra",    "Profesor",       "3105760865", "wicorrea@hotmail.com"),
    ("Cortes Torres Jose David",             "Profesor Cátedra",    "Profesor",       "3192991845", "jose.cortes@saber.uis.edu.co"),
    ("Dovale Vargas Luisa Fernanda",         "Profesor Cátedra",    "Profesor",       "3154021483", "Luisafernanda.dovale@gmail.com"),
    ("Espitia Gonzalez Christian Hernando",  "Profesor Cátedra",    "Profesor",       "3166948553", "christianespitia@gmail.com"),
    ("Franco Salazar Juan David",            "Profesor Cátedra",    "Profesor",       "3107724930", "juand_0532@hotmail.com"),
    ("Galeano Traslaviña Yuber Alejandro",   "Profesor Cátedra",    "Profesor",       "3007096099", "yuberku@gmail.com"),
    ("Galindez Ortiz Guillermo Humberto",    "Profesor Cátedra",    "Profesor",       "3124927197", "gzitro1985@gmail.com"),
    ("Galindo Noguera Ana Lisbeth",          "Profesor Cátedra",    "Profesor",       "3112073760", "lisbethgn37@gmail.com"),
    ("Giraldo Picón Wilson",                 "Profesor Cátedra",    "Profesor",       "3004627301", "wgiraldo@correo.uis.edu.co"),
    ("Godoy Rojas Adriana Carolina",         "Profesor Cátedra",    "Profesor",       "3118633865", "acgodoyr@correo.uis.edu.co"),
    ("Gomez Tapias Jairo",                   "Profesor Cátedra",    "Profesor",       "",           "jairojgt@hotmail.com"),
    ("Gonzalez Mateus David Alejandro",      "Profesor Cátedra",    "Profesor",       "3161082020", "davidalejandro20178@gmail.com"),
    ("Gómez Ardila Luis Antonio",            "Profesor Cátedra",    "Profesor",       "3123056619", "luisgomezardila@gmail.com"),
    ("Haskpiel Rodriguez Maria Alejandra",   "Profesor Cátedra",    "Profesor",       "3043772721", "mhakspiel@gmail.com"),
    ("Hulse Pamela Mara",                    "Profesor Cátedra",    "Profesor",       "3165161684", "pamelam.hulse@gmail.com"),
    ("Jimenez Manjarres Yulieth",            "Profesor Cátedra",    "Profesor",       "3016477444", "yulijmanjarres@yahoo.com"),
    ("Latorre Ortiz Sonia Juliana",          "Profesor Cátedra",    "Profesor",       "",           ""),
    ("Lizarazo Maldonado Alan Ferney",       "Profesor Cátedra",    "Profesor",       "3182359877", "alizarazo205@gmail.com"),
    ("Lopez Ramirez Pedro Antonio",          "Profesor Cátedra",    "Profesor",       "3158194374", "palopez@uis.edu.co"),
    ("Mantilla Espinosa Luis Carlos",        "Profesor Cátedra",    "Profesor",       "3045738009", "luismantillaespinosa@gmail.com"),
    ("Mantilla Rios Alex Julian",            "Profesor Cátedra",    "Profesor",       "3187847799", "alexmantilla97@gmail.com"),
    ("Mantilla Villalobos Jairo Andrés",     "Profesor Cátedra",    "Profesor",       "3043255942", "cpcaluil@correo.uis.edu.co"),
    ("Marin Pinzón Nicolas Augusto",         "Profesor Cátedra",    "Profesor",       "3124987887", "nicolas.marin.pinzon@gmail.com"),
    ("Mejía Iguaran Juan Alexis",            "Profesor Cátedra",    "Profesor",       "3166259522", "mejiaiguaran@gmail.com"),
    ("Mercado Polo Verena De Jesus",         "Profesor Cátedra",    "Profesor",       "3102341697", "verenamercado@gmail.com"),
    ("Mier Martinez Javier Enrique",         "Profesor Cátedra",    "Profesor",       "3165371668", "jmier@uis.edu.co"),
    ("Morales Rey Wilman",                   "Profesor Cátedra",    "Profesor",       "3176364298", "morales.wilman@gmail.com"),
    ("Motta Nieto Diego Fernando",           "Profesor Cátedra",    "Profesor",       "3046566433", "diemotta@hotmail.com"),
    ("Navarro Martinez Luis Carlos",         "Profesor Cátedra",    "Profesor",       "3045738009", "luismantillaespinosa@gmail.com"),
    ("Nieto Garzón Nury Audrey",             "Profesor Cátedra",    "Profesor",       "3156634035", "nury.audrey@gmail.com"),
    ("Ortiz Rangel Manuel Jose",             "Profesor Cátedra",    "Profesor",       "3125496109", "majortiz@gmail.com"),
    ("Osorio Silva Fausto",                  "Profesor Cátedra",    "Profesor",       "3153094470", "fst_502@hotmail.com"),
    ("Poveda Rodríguez Diana Katheryn",      "Profesor Cátedra",    "Profesor",       "3123807768", "dk.poveda@uniandes.edu.co"),
    ("Quintero Muñoz Jorge Eduardo",         "Profesor Cátedra",    "Profesor",       "3102651042", "Jorgequintero92@gmail.com"),
    ("Rincón Saravia Rolando Andrés",        "Profesor Cátedra",    "Profesor",       "3008661543", "roanrisa@correo.uis.edu.co"),
    ("Rizo Casadiegos Aldo Marcel",          "Profesor Cátedra",    "Profesor",       "3246302796", "aldorizo7@gmail.com"),
    ("Rojas Rincon Clara Lizeth",            "Profesor Cátedra",    "Profesor",       "",           ""),
    ("Salamanca Becerra William Alexander",  "Profesor Cátedra",    "Profesor",       "3107688172", "williamsalamanca@gmail.com"),
    ("Salcedo Duran Juan Jose",              "Profesor Cátedra",    "Profesor",       "3143438863", "jjmorphy@hotmail.com"),
    ("Serrano Duran Giobani",               "Profesor Cátedra",    "Profesor",       "3183501890", "serdgio@gmail.com"),
    ("Soto Garnica Jorge Leonardo",          "Profesor Cátedra",    "Profesor",       "3222574822", "leonardosoto.design@gmail.com"),
    ("Suarez Salcedo Belsy Carina",          "Profesor Cátedra",    "Profesor",       "",           ""),
    ("Triana Ramirez Alvaro Alyamani",       "Profesor Cátedra",    "Profesor",       "3107967822", "Alvaro.triana@correo.uis.edu.co"),
    ("Trujillo Tarazona Pedro Javier",       "Profesor Cátedra",    "Profesor",       "3167838737", "pjttru@yahoo.com"),
    ("Urquijo Torrado Jorge",                "Profesor Cátedra",    "Profesor",       "3115325888", "gerencia@copower.com.co"),
    ("Valdivieso Bohorquez Raul Francisco",  "Profesor Cátedra",    "Profesor",       "3112509961", "raulfvaldiviesob@gmail.com"),
    ("Vargas Molano Andres Felipe",          "Profesor Cátedra",    "Profesor",       "3123291727", "afvarmol@correo.uis.edu.co"),
    ("Velez Sanchez Jeisson Emilio",         "Profesor Cátedra",    "Profesor",       "3125019986", "jeissonv@gmail.com"),
    ("Vera Caycedo Edwin",                   "Profesor Cátedra",    "Profesor",       "3016650594", "Evera71@hotmail.com"),
    ("Villarreal Solano Ariel Yesid",        "Profesor Cátedra",    "Profesor",       "3002183981", "arielyezid@hotmail.com"),
    ("Zamora Lizarazo Jorge Andres",         "Profesor Cátedra",    "Profesor",       "3176879767", "zamoralizarazo@gmail.com"),
    ("Zamora Musa Ronald",                   "Profesor Cátedra",    "Profesor",       "3008033852", "zamoramusa@gmail.com"),
    # Planta
    ("Adarme López Edinson Fabián",          "Profesor Planta",     "Profesor",       "3157116793", "efadalop@uis.edu.co"),
    ("Aguilera Bermúdez Ernesto",            "Profesor Planta",     "Profesor",       "3143052135", "eaguiler@uis.edu.co"),
    ("Amaya Palacio José Alejandro",         "Profesor Planta",     "Profesor",       "3004712142", "jaamaya@uis.edu.co"),
    ("Ardila Ochoa Javier Ferney",           "Profesor Planta",     "Profesor",       "3163930458", "jardilao@uis.edu.co"),
    ("Barrero Pérez Jaime Guillermo",        "Profesor Planta",     "Profesor",       "3115978489", "jbarrero@uis.edu.co"),
    ("Botero Londoño Mónica Andrea",         "Profesor Planta",     "Profesor",       "3108352329", "mabotero@uis.edu.co"),
    ("Blanco Solano Jairo",                  "Profesor Planta",     "Profesor",       "3005163935", "jablanso@uis.edu.co"),
    ("Correa Cely Carlos Rodrigo",           "Profesor Planta",     "Profesor",       "3133599101", "crcorrea@uis.edu.co"),
    ("Carreño Zagarra José Jorge",           "Profesor Planta",     "Profesor",       "3016322610", "jjcarzag@uis.edu.co"),
    ("Díaz Flórez Guillermo Andrés",         "Profesor Planta",     "Profesor",       "3242014933", "gadiafeh@uis.edu.co"),
    ("Duarte Gualdron César Antonio",        "Profesor Planta",     "Profesor",       "3163571429", "cedagua@uis.edu.co"),
    ("Fajardo Ariza Carlos Augusto",         "Profesor Planta",     "Profesor",       "3112392861", "cafajar@uis.edu.co"),
    ("Garcia Arenas Hans Yecid",             "Profesor Planta",     "Profesor",       "3166143883", "hayegaar@uis.edu.co"),
    ("Herrera Celis José Luis",              "Profesor Planta",     "Profesor",       "3162723927", "jherrece@uis.edu.co"),
    ("Latorre Bayona Gerardo",               "Profesor Planta",     "Profesor",       "3164733517", "glatorre@uis.edu.co"),
    ("Mantilla Villalobos María Alejandra",  "Profesor Planta",     "Profesor",       "3002923535", "marialem@uis.edu.co"),
    ("Ordóñez Plata Gabriel",               "Profesor Planta",     "Profesor",       "3002169526", "gaby@uis.edu.co"),
    ("Orozco Henao César Augusto",           "Profesor Planta",     "Profesor",       "3117291591", "caorohen@uis.edu.co"),
    ("Ortega Boada Homero",                  "Profesor Planta",     "Profesor",       "3002052527", "hortegab@uis.edu.co"),
    ("Osma Pinto German Alfonso",            "Profesor Planta",     "Profesor",       "3155689136", "german.osma@gmail.com"),
    ("Petit Suárez Johann Farith",           "Profesor Planta",     "Profesor",       "3175385600", "jfpetit@uis.edu.co"),
    ("Pertuz Arroyo Said David",             "Profesor Planta",     "Profesor",       "3046647362", "sdpertuz@gmail.com"),
    ("Quiroga Quiroga Oscar Arnulfo",        "Profesor Planta",     "Profesor",       "3105734899", "oquiroga@uis.edu.co"),
    ("Ramírez Silva Ana Beatriz",            "Profesor Planta",     "Profesor",       "3143411543", "anaberam@uis.edu.co"),
    ("Rey López Juan Manuel",               "Profesor Planta",     "Profesor",       "3166043342", "juanmrey@uis.edu.co"),
    ("Roa Elkim Felipe",                     "Profesor Planta",     "Profesor",       "3143129631", "efroa@uis.edu.co"),
    ("Rodriguez Ferreira Julián Gustavo",    "Profesor Planta",     "Profesor",       "3023298782", "jgrodrif@uis.edu.co"),
    ("Sepúlveda Franklin Alexander",         "Profesor Planta",     "Profesor",       "3153913001", "alexander.sepulveda@saber.uis.edu.co"),
    ("Serna Suarez Iván David",              "Profesor Planta",     "Profesor",       "3144252368", "idsersua@uis.edu.co"),
    ("Sierra Bueno Daniel Alfonso",          "Profesor Planta",     "Profesor",       "3162854242", "dasierra@uis.edu.co"),
    ("Soto Rios Edinson",                    "Profesor Planta",     "Profesor",       "3103261196", "easotor@uis.edu.co"),
    ("Tíjaro Rojas Omar Javier",             "Profesor Planta",     "Profesor",       "3173497044", "ojtijaro@uis.edu.co"),
    ("Villamizar Mejía Rodolfo",             "Profesor Planta",     "Profesor",       "3187361555", "rovillam@uis.edu.co"),
    # Administrativos
    ("Amorocho Gualdrón Yolanda",           "Administrativo",      "Administrativo", "3173841175", "yolamoro@uis.edu.co"),
    ("Galindez Ortiz Guillermo Humberto",    "Administrativo",      "Administrativo", "3124927197", "ghgalind@uis.edu.co"),
    ("García Averón Ingrid Julieth",         "Administrativo",      "Administrativo", "3172294121", "ingridga@uis.edu.co"),
    ("Hernández Pabón Leidy Katherine",      "Administrativo",      "Administrativo", "3004503301", "lekahepa@uis.edu.co"),
    ("Latorre Bayona Gustavo",               "Administrativo",      "Administrativo", "3118538495", "guslator@uis.edu.co"),
    ("Llanes Torra Leidy Viviana",           "Administrativo",      "Administrativo", "3162821961", "leivilla@uis.edu.co"),
    ("Mantilla Mantilla Jairo",              "Administrativo",      "Administrativo", "3005723370", "jmantilm@uis.edu.co"),
    ("Pabon Becerra Jairo Andres",           "Administrativo",      "Administrativo", "3209988528", "jairoapb@uis.edu.co"),
    ("Quiñonez Mantilla Liliana Andrea",     "Administrativo",      "Administrativo", "3158254006", "laquiman@uis.edu.co"),
    ("Uribe Rincón Diana Carolina",          "Administrativo",      "Administrativo", "3164132033", "dicaurin@uis.edu.co"),
    ("Sonia Stella Serrano Garcia",          "Administrativo",      "Administrativo", "3212795626", "secre3t1@uis.edu.co"),
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def get_or_create_rol(codigo, nombre):
    rol = db.query(CatalogoRol).filter(CatalogoRol.codigo == codigo).first()
    if not rol:
        rol = CatalogoRol(codigo=codigo, nombre=nombre)
        db.add(rol)
        db.flush()
    return rol

def vincular_rol(persona_id, rol_id):
    v = db.query(VinculacionActiva).filter(
        VinculacionActiva.id_persona == persona_id,
        VinculacionActiva.id_rol == rol_id,
    ).first()
    if not v:
        db.add(VinculacionActiva(
            id_persona=persona_id,
            id_rol=rol_id,
            tipo_contexto="escuela",  # ← campo obligatorio
            id_contexto=1,
            es_activo=1,
        ))

def generar_correo_temporal(nombre):
    """Genera un correo provisional para personas sin correo en la fuente de datos.
    email_institucional es NOT NULL en la BD, así que no podemos insertar None."""
    import re
    slug = re.sub(r'[^a-z.]', '', nombre.lower().replace(" ", "."))[:30]
    return f"{slug}@pendiente.uis.edu.co"

def buscar_persona(nombre, correo):
    if correo:
        p = db.query(Persona).filter(Persona.email_institucional == correo).first()
        if p:
            return p
    apellido = nombre.split()[0]
    segunda = nombre.split()[1] if len(nombre.split()) > 1 else ""
    candidatos = db.query(Persona).filter(
        Persona.nombre_completo.ilike(f"%{apellido}%")
    ).all()
    for c in candidatos:
        if segunda and segunda.lower() in (c.nombre_completo or "").lower():
            return c
    return None

# ── Main ──────────────────────────────────────────────────────────────────────

try:
    rol_cathedra = get_or_create_rol("prof_catedra",   "Profesor Cátedra")
    rol_planta   = get_or_create_rol("prof_planta",    "Profesor Planta")
    rol_admin    = get_or_create_rol("administrativo", "Personal Administrativo")
    db.flush()

    creados = actualizados = errores = 0
    print(f"\n🚀 Procesando {len(PERSONAS)} personas...\n")

    for (nombre, tipo, cargo, celular, correo) in PERSONAS:
        try:
            rol = rol_planta if tipo == "Profesor Planta" else (
                  rol_cathedra if tipo == "Profesor Cátedra" else rol_admin)

            persona = buscar_persona(nombre, correo)

            if persona:
                # Actualizar datos faltantes
                if correo and not persona.email_institucional:
                    persona.email_institucional = correo
                if celular and not persona.telefono:
                    persona.telefono = celular
                if not persona.hashed_password:
                    persona.hashed_password = hash_password("uis2026")
                vincular_rol(persona.id, rol.id)
                db.commit()
                actualizados += 1
                print(f"  🔄 {nombre[:45]:<45} | {tipo[:20]}")
            else:
                persona = Persona(
                    nombre_completo=nombre,
                    email_institucional=correo if correo else generar_correo_temporal(nombre),
                    telefono=celular if celular else None,
                    hashed_password=hash_password("uis2026"),
                )
                db.add(persona)
                db.flush()
                vincular_rol(persona.id, rol.id)
                db.commit()
                creados += 1
                print(f"  ✅ {nombre[:45]:<45} | {tipo[:20]}")

        except Exception as e:
            db.rollback()
            print(f"  ❌ {nombre[:40]} → {e}")
            errores += 1

    print(f"\n{'='*65}")
    print(f"🎉 Completado:")
    print(f"   ✅ Creados:      {creados}")
    print(f"   🔄 Actualizados: {actualizados}")
    print(f"   ❌ Errores:      {errores}")
    print(f"\n   🔑 Contraseña: uis2026")
    print(f"{'='*65}\n")

except Exception as e:
    db.rollback()
    print(f"\n❌ Error general: {e}")
    import traceback; traceback.print_exc()
finally:
    db.close()
