"""
Corrige el director de proyecto para estudiantes cuyo director quedo mal
asignado por el bug de coincidencia parcial de nombres en buscar_director()
(seed_estudiantes_2026.py). Ese bug hacia match con el primer nombre comun
(ej. "Juan") encontrado en CUALQUIER persona, sin importar el apellido.

A diferencia del seed original, este script SI sobreescribe el director
aunque el proyecto ya tenga uno asignado.

Uso: python3 corregir_directores.py
"""
import sys, os, re
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import Persona, Estudiante, ProyectoGrado

db = SessionLocal()

# (correo_institucional, nombre_director_correcto)
CORREO_DIRECTOR = [
    ("emanuel2269080@correo.uis.edu.co", "María Alejandra Mantilla"),
    ("jose2269081@correo.uis.edu.co", "Germán Osma"),
    ("nicolas2248434@correo.uis.edu.co", "Juan Manuel Rey"),
    ("aldo2248435@correo.uis.edu.co", "Juan Manuel Rey"),
    ("alan2248436@correo.uis.edu.co", "German Osma"),
    ("luis2248437@correo.uis.edu.co", "César Duarte"),
    ("jhon2248094@correo.uis.edu.co", "Juan Manuel Rey"),
    ("edinson2248092@correo.uis.edu.co", "Ernesto Aguilera"),
    ("camilo2248093@correo.uis.edu.co", "Ivan David Serna"),
    ("cristhian2238243@correo.uis.edu.co", "César Duarte"),
    ("clara2238320@correo.uis.edu.co", "Franklyn Sepúlveda"),
    ("sergio2228528@correo.uis.edu.co", "Joahnn Farith"),
    ("liliana2228331@correo.uis.edu.co", "German Alfonso Osma"),
    ("jorge2228117@correo.uis.edu.co", "Edison Soto"),
    ("andres2178544@correo.uis.edu.co", "Maria Alejandra Mantilla"),
    ("rafael2269082@correo.uis.edu.co", "Henry Arguello"),
    ("joseph2269083@correo.uis.edu.co", "Hans Yecid García"),
    ("juan2258395@correo.uis.edu.co", "Carlos Augusto Fajardo"),
    ("ricardo2258396@correo.uis.edu.co", "Javier Ardila"),
    ("oscar2238476@correo.uis.edu.co", "Carlos Augusto Fajardo"),
    ("maria2269156@correo.uis.edu.co", "Said David Pertuz"),
    ("sergio2258049@correo.uis.edu.co", "Juan Manuel Rey"),
    ("daniel2258050@correo.uis.edu.co", "Franklin Sepulveda"),
    ("jorge2248431@correo.uis.edu.co", "Javier Ferney Ardila"),
    ("sebastian2248432@correo.uis.edu.co", "Henry Arguello"),
    ("juan2248433@correo.uis.edu.co", "Ana Beatriz"),
    ("alex2248086@correo.uis.edu.co", "Javier Ferney Ardila"),
    ("maria2248087@correo.uis.edu.co", "Carlos Augusto Fajardo"),
    ("natalia2248088@correo.uis.edu.co", "Said Pertuz"),
    ("luis2248089@correo.uis.edu.co", "Julian Rodríguez"),
    ("jeison2248090@correo.uis.edu.co", "Javier Ferney Ardila"),
    ("sergio2248091@correo.uis.edu.co", "Ana Beatriz"),
    ("mary2238319@correo.uis.edu.co", "Franklin Alexander"),
    ("oscar2228096@correo.uis.edu.co", "Juan Manuel Rey"),
    ("mauricio2228098@correo.uis.edu.co", "María Alejandra Mantilla"),
    ("leidy2198153@correo.uis.edu.co", "Rodolfo Villamizar"),
    ("johan2258397@correo.uis.edu.co", "Carlos Augusto Fajardo"),
    ("sebastian2258398@correo.uis.edu.co", "Juan Manuel Rey"),
    ("norbey2258051@correo.uis.edu.co", "Juan Manuel Rey"),
    ("juan2248438@correo.uis.edu.co", "Carlos Fajardo"),
    ("harold2248097@correo.uis.edu.co", "Carlos Fajardo"),
    ("david2248098@correo.uis.edu.co", "Efren Acevedo"),
    ("eduardo2248099@correo.uis.edu.co", "Javier Ferney Ardila"),
    ("elian2248100@correo.uis.edu.co", "Efren Acevedo"),
    ("gilbert2238322@correo.uis.edu.co", "Juan Manuel Rey"),
    ("pedro2218080@correo.uis.edu.co", "Julian Rodríguez"),
    ("joe2208470@correo.uis.edu.co", "Julian Rodríguez"),
    ("jherson2218425@correo.uis.edu.co", "Julian Rodríguez"),
    ("liliana2228331b@correo.uis.edu.co", "German Alfonso Osma"),
    ("cristhian2238234@correo.uis.edu.co", "Cesar Duarte"),
    ("clara2238320b@correo.uis.edu.co", "Mónica Andrea Botero"),
    ("nestor2148716@correo.uis.edu.co", "German Osma"),
    ("juan2208142@correo.uis.edu.co", "Juan Manuel Rey"),
    ("jose2148768@correo.uis.edu.co", "César Duarte"),
    ("alejandra2198146@correo.uis.edu.co", "German Osma"),
    ("jorge2148225@correo.uis.edu.co", "German Osma"),
    ("jose2218081@correo.uis.edu.co", "Oscar Quiroga"),
    ("david2148769@correo.uis.edu.co", "María Alejandra Mantilla"),
    ("camila2248439@correo.uis.edu.co", "Martha Liliana Torres"),
    ("andres2158769@correo.uis.edu.co", "Kafarov"),
    ("edher2218440@correo.uis.edu.co", "Clara Isabel"),
    ("pilar2117670@correo.uis.edu.co", "Oscar Quiroga"),
    ("dayhana2127825@correo.uis.edu.co", "Hugo Martínez"),
    ("gilbert2238322b@correo.uis.edu.co", "Juan Manuel Rey"),
    ("harold2248097b@correo.uis.edu.co", "Hans Yecid García"),
    ("maria2248087b@correo.uis.edu.co", "Hans Yecid García"),
    ("sebastian2248432b@correo.uis.edu.co", "Hans Yecid García"),
    ("william2238072@correo.uis.edu.co", "Said David Pertuz"),
    ("luisa2198610@correo.uis.edu.co", "Daniel Sierra"),
    ("juliam2238321@correo.uis.edu.co", "Juan Manuel Rey"),
    ("camilo2238323@correo.uis.edu.co", "Carlos Augusto Fajardo"),
    ("sergio2228328@correo.uis.edu.co", "Henry Arguello"),
    ("karen2228329@correo.uis.edu.co", "Henry Arguello"),
    ("pablo2228330@correo.uis.edu.co", "Henry Arguello"),
    ("roman2228081@correo.uis.edu.co", "Henry Arguello"),
    ("jeisson2169094@correo.uis.edu.co", "Mónica Andrea Botero"),
]

def buscar_director(nombre_director):
    """Misma logica corregida de seed_estudiantes_2026.py."""
    nombre_director = nombre_director.strip()

    p = db.query(Persona).filter(Persona.nombre_completo.ilike(nombre_director)).first()
    if p:
        return p

    partes = [x for x in nombre_director.split() if len(x) > 2]
    for i in range(len(partes) - 1):
        combo = f"%{partes[i]}%{partes[i+1]}%"
        candidatos = db.query(Persona).filter(Persona.nombre_completo.ilike(combo)).all()
        if len(candidatos) == 1:
            return candidatos[0]

    if partes:
        candidatos = db.query(Persona).filter(
            Persona.nombre_completo.ilike(f"%{partes[-1]}%")
        ).all()
        if len(candidatos) == 1:
            return candidatos[0]

    email_gen = re.sub(r'[^a-z.]', '', nombre_director.lower().replace(" ", "."))[:30] + "@uis.edu.co"
    p = Persona(nombre_completo=nombre_director, email_institucional=email_gen)
    db.add(p)
    db.flush()
    return p

corregidos = 0
sin_cambio = 0
no_encontrados = []

print(f"\n🔧 Revisando director de {len(CORREO_DIRECTOR)} proyectos...\n")

for correo, dir_nombre in CORREO_DIRECTOR:
    persona = db.query(Persona).filter(Persona.email_institucional == correo).first()
    if not persona:
        no_encontrados.append(f"{correo}: persona no encontrada")
        continue

    estudiante = db.query(Estudiante).filter(Estudiante.id_persona == persona.id).first()
    if not estudiante:
        no_encontrados.append(f"{correo}: sin registro de estudiante")
        continue

    proyecto = db.query(ProyectoGrado).filter(ProyectoGrado.id_estudiante == estudiante.id).first()
    if not proyecto:
        no_encontrados.append(f"{correo}: sin proyecto de grado")
        continue

    director_correcto = buscar_director(dir_nombre)

    if proyecto.id_director != director_correcto.id:
        anterior = db.query(Persona).get(proyecto.id_director) if proyecto.id_director else None
        print(f"  🔄 {persona.nombre_completo[:35]:<35} | "
              f"{(anterior.nombre_completo if anterior else '(vacío)')[:25]:<25} → {director_correcto.nombre_completo}")
        proyecto.id_director = director_correcto.id
        corregidos += 1
    else:
        sin_cambio += 1

db.commit()

print(f"\n{'='*65}")
print(f"✅ Directores corregidos: {corregidos}")
print(f"🔹 Ya estaban correctos: {sin_cambio}")
if no_encontrados:
    print(f"⚠️  {len(no_encontrados)} sin resolver:")
    for x in no_encontrados:
        print(f"   - {x}")
print(f"{'='*65}\n")

db.close()
