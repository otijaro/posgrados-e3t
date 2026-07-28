import Link from "next/link";
import Image from "next/image";
import PublicNav from "@/components/layout/PublicNav";

const NOTEBOOKLM_URL = "https://notebooklm.google.com/notebook/52adb20c-7579-4086-88ef-ab38f2626018";

const programas = [
  { icono: "⚡", nombre: "Maestría en Ingeniería Electrónica",                   duracion: "4 semestres", creditos: 56, color: "border-blue-500",   bg: "bg-blue-50" },
  { icono: "🔌", nombre: "Maestría en Ingeniería Eléctrica",                     duracion: "4 semestres", creditos: 52, color: "border-yellow-500", bg: "bg-yellow-50" },
  { icono: "📡", nombre: "Maestría en Ingeniería de Telecomunicaciones",          duracion: "4 semestres", creditos: 52, color: "border-purple-500", bg: "bg-purple-50" },
  { icono: "🔬", nombre: "Doctorado en Ingeniería — Ing. Eléctrica",             duracion: "8 semestres", creditos: 96, color: "border-green-600",  bg: "bg-green-50" },
  { icono: "🔬", nombre: "Doctorado en Ingeniería — Ing. Electrónica",           duracion: "8 semestres", creditos: 96, color: "border-blue-600",   bg: "bg-blue-50" },
  { icono: "🚀", nombre: "Doctorado en Ing. — Gestión y Desarrollo Tecnológico", duracion: "8 semestres", creditos: 96, color: "border-orange-500", bg: "bg-orange-50" },
];

const accesos = [
  { icono: "📅", titulo: "Calendarios",            descripcion: "Fechas de admisiones, créditos condonables y académico.", href: "/calendarios",          color: "border-blue-400" },
  { icono: "📚", titulo: "Planes de Estudio",       descripcion: "Consulta la malla curricular de cada programa.",          href: "/planes-estudio",       color: "border-purple-400" },
  { icono: "🔬", titulo: "Grupos de Investigación", descripcion: "Conoce los grupos y sus proyectos activos 2025.",         href: "/grupos-investigacion", color: "border-teal-400" },
  { icono: "🔐", titulo: "Portal de Gestión",       descripcion: "Accede a tus solicitudes, proyecto de grado y trámites.", href: "/login",                color: "border-green-500" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-800 to-green-900 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-6 mb-10 justify-center">
            <div className="bg-white rounded-2xl px-5 py-3">
              <Image src="/logouis.png" alt="Universidad Industrial de Santander" width={160} height={60} className="object-contain" />
            </div>
            <div className="w-px h-16 bg-green-600" />
            <div className="bg-white rounded-2xl px-5 py-4">
              <Image src="/E3T.png" alt="E3T" width={64} height={56} className="object-contain" />
            </div>
          </div>
          <div className="text-center">
            <span className="inline-block bg-green-700 text-green-200 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
              Portal Académico
            </span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Gestión de Posgrados<br />
              <span className="text-green-300">E3T · UIS</span>
            </h1>
            <p className="text-green-100 text-lg max-w-2xl mx-auto mb-10">
              Portal de gestión académica para estudiantes, directores y el comité de posgrados
              de la Escuela de Ingeniería Eléctrica, Electrónica y de Telecomunicaciones.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="bg-white text-green-800 font-semibold px-8 py-3 rounded-xl hover:bg-green-50 transition-colors">
                Ingresar al portal →
              </Link>
              <Link href="/calendarios" className="border border-green-500 text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-700 transition-colors">
                Ver calendarios
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Reglamento General de Posgrados */}
      <section className="py-14 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">📜 Reglamento General de Posgrados</h2>
          <p className="text-gray-500 text-center mb-8">Consulta el Acuerdo 075 o hazle preguntas al asistente IA</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Visor del reglamento */}
            <Link href="/reglamento"
              className="group bg-white rounded-2xl border border-gray-200 p-7 shadow-sm hover:shadow-md transition-all flex items-center gap-5">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                📄
              </div>
              <div>
                <p className="text-base font-bold text-gray-800 group-hover:text-green-700 transition-colors">
                  Ver Reglamento
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Acuerdo 075 — Consulta las normas, plazos y requisitos de los programas de posgrado
                </p>
                <span className="text-xs text-green-600 font-semibold mt-2 inline-block">Abrir →</span>
              </div>
            </Link>

            {/* Chat IA */}
            <a href={NOTEBOOKLM_URL} target="_blank" rel="noopener noreferrer"
              className="group bg-white rounded-2xl border border-gray-200 p-7 shadow-sm hover:shadow-md transition-all flex items-center gap-5">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                🤖
              </div>
              <div>
                <p className="text-base font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                  Pregúntale al Asistente IA
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Haz preguntas sobre el reglamento en lenguaje natural — respuestas basadas en el Acuerdo 075
                </p>
                <span className="text-xs text-blue-600 font-semibold mt-2 inline-block">Abrir NotebookLM →</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-3">¿Qué puedes hacer aquí?</h2>
          <p className="text-gray-500 text-center mb-12">
            Consulta información pública o ingresa al portal para gestionar tus trámites académicos.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {accesos.map((a) => (
              <Link key={a.href} href={a.href}
                className={`bg-white rounded-2xl p-6 border-t-4 ${a.color} shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center`}>
                <span className="text-4xl mb-3">{a.icono}</span>
                <h3 className="text-base font-bold text-gray-800 mb-2">{a.titulo}</h3>
                <p className="text-xs text-gray-500">{a.descripcion}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Programas */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-3">Programas disponibles</h2>
          <p className="text-gray-500 text-center mb-12">
            Este portal da soporte a los siguientes programas de posgrado de la E3T.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {programas.map((p) => (
              <div key={p.nombre} className={`rounded-xl border-l-4 ${p.color} ${p.bg} p-6 hover:shadow-sm transition-shadow`}>
                <span className="text-3xl">{p.icono}</span>
                <h3 className="text-sm font-bold text-gray-800 mt-3 leading-snug">{p.nombre}</h3>
                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                  <span>⏱ {p.duracion}</span>
                  <span>📖 {p.creditos} créditos</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/planes-estudio" className="inline-block bg-green-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-800 transition-colors">
              Ver planes de estudio →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-900 text-green-200 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-xl px-4 py-2">
              <Image src="/logouis.png" alt="UIS" width={100} height={40} className="object-contain" />
            </div>
            <div className="bg-white rounded-xl px-3 py-2">
              <Image src="/E3T.png" alt="E3T" width={40} height={36} className="object-contain" />
            </div>
          </div>
          <div className="text-center md:text-right text-sm">
            <p className="font-semibold text-white">Portal de Gestión de Posgrados · E3T</p>
            <p className="mt-1">Universidad Industrial de Santander · Bucaramanga, Colombia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
