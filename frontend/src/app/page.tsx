import Link from "next/link";
import Image from "next/image";
import PublicNav from "@/components/layout/PublicNav";

const programas = [
  { icono: "⚡", nombre: "Maestría en Ingeniería Electrónica",                   duracion: "4 semestres", creditos: 56, color: "border-blue-500",   bg: "bg-blue-50" },
  { icono: "🔌", nombre: "Maestría en Ingeniería Eléctrica",                     duracion: "4 semestres", creditos: 52, color: "border-yellow-500", bg: "bg-yellow-50" },
  { icono: "📡", nombre: "Maestría en Ingeniería de Telecomunicaciones",          duracion: "4 semestres", creditos: 52, color: "border-purple-500", bg: "bg-purple-50" },
  { icono: "🔬", nombre: "Doctorado en Ingeniería — Ing. Eléctrica",             duracion: "8 semestres", creditos: 96, color: "border-green-600",  bg: "bg-green-50" },
  { icono: "🔬", nombre: "Doctorado en Ingeniería — Ing. Electrónica",           duracion: "8 semestres", creditos: 96, color: "border-blue-600",   bg: "bg-blue-50" },
  { icono: "🚀", nombre: "Doctorado en Ing. — Gestión y Desarrollo Tecnológico", duracion: "8 semestres", creditos: 96, color: "border-orange-500", bg: "bg-orange-50" },
];

const accesos = [
  { icono: "📅", titulo: "Calendarios",             descripcion: "Fechas de admisiones, créditos condonables y académico.", href: "/calendarios",           color: "border-blue-400" },
  { icono: "📚", titulo: "Planes de Estudio",        descripcion: "Consulta la malla curricular de cada programa.",          href: "/planes-estudio",        color: "border-purple-400" },
  { icono: "🔬", titulo: "Grupos de Investigación",  descripcion: "Conoce los grupos y sus proyectos activos 2025.",         href: "/grupos-investigacion",  color: "border-teal-400" },
  { icono: "🔐", titulo: "Portal de Gestión",        descripcion: "Accede a tus solicitudes, proyecto de grado y trámites.", href: "/login",                 color: "border-green-500" },
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

      {/* Accesos rápidos */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-3">¿Qué puedes hacer aquí?</h2>
          <p className="text-gray-500 text-center mb-12">
            Consulta información pública o ingresa al portal para gestionar tus trámites académicos.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {accesos.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className={`bg-white rounded-2xl p-6 border-t-4 ${a.color} shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center`}
              >
                <span className="text-4xl mb-3">{a.icono}</span>
                <h3 className="text-base font-bold text-gray-800 mb-2">{a.titulo}</h3>
                <p className="text-xs text-gray-500">{a.descripcion}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Programas */}
      <section className="py-20 px-6">
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
