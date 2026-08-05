import Link from "next/link";
import Image from "next/image";
import PublicNav from "@/components/layout/PublicNav";

const NOTEBOOKLM_URL = "https://notebooklm.google.com/notebook/52adb20c-7579-4086-88ef-ab38f2626018";

const programas = [
  { icono: "⚡", nombre: "Maestría en Ingeniería Electrónica",                        nivel: "Maestría",   duracion: "4 sem.", color: "border-blue-400",   bg: "bg-blue-50",   url: "https://posgrados.uis.edu.co/maestrias/maestria-en-ingenieria-electronica/index.html" },
  { icono: "🔌", nombre: "Maestría en Ingeniería Eléctrica",                          nivel: "Maestría",   duracion: "4 sem.", color: "border-yellow-400", bg: "bg-yellow-50", url: "https://posgrados.uis.edu.co/maestrias/maestria-en-ingenieria-electrica/index.html" },
  { icono: "📡", nombre: "Maestría en Ingeniería de Telecomunicaciones",               nivel: "Maestría",   duracion: "4 sem.", color: "border-purple-400", bg: "bg-purple-50", url: "https://posgrados.uis.edu.co/maestrias/maestria-en-ingenieria-de-telecomunicaciones/index.html" },
  { icono: "🔬", nombre: "Doctorado en Ingeniería — Área Ingeniería Eléctrica",        nivel: "Doctorado",  duracion: "8 sem.", color: "border-green-500",  bg: "bg-green-50",  url: "https://posgrados.uis.edu.co/doctorados/doctorado-en-ingenieria/index.html" },
  { icono: "🔬", nombre: "Doctorado en Ingeniería — Área Ingeniería Electrónica",      nivel: "Doctorado",  duracion: "8 sem.", color: "border-blue-500",   bg: "bg-blue-50",   url: "https://posgrados.uis.edu.co/doctorados/doctorado-en-ingenieria/index.html" },
  { icono: "🚀", nombre: "Doctorado en Ing. — Gestión y Desarrollo Tecnológico",       nivel: "Doctorado",  duracion: "8 sem.", color: "border-orange-400", bg: "bg-orange-50", url: "https://posgrados.uis.edu.co/doctorados/doctorado-en-ingenieria/index.html" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-800 to-green-900 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center gap-4 mb-5 justify-center">
            <div className="bg-white rounded-xl px-3 py-1.5">
              <Image src="/logouis.png" alt="UIS" width={90} height={36} className="object-contain" />
            </div>
            <div className="w-px h-8 bg-green-600" />
            <div className="bg-white rounded-xl px-3 py-2">
              <Image src="/E3T.png" alt="E3T" width={36} height={32} className="object-contain" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-2">
            Gestión de Posgrados — <span className="text-green-300">E3T · UIS</span>
          </h1>
          <p className="text-green-100 text-sm max-w-lg mx-auto mb-5">
            Portal académico para estudiantes, docentes y comité de posgrados de la Escuela de Ingeniería Eléctrica, Electrónica y de Telecomunicaciones.
          </p>
          <Link href="/login"
            className="inline-block bg-white text-green-800 font-semibold px-6 py-2 rounded-xl hover:bg-green-50 transition-colors text-sm">
            Ingresar al portal →
          </Link>
        </div>
      </section>

      {/* Programas */}
      <section className="py-14 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Programas de Posgrado</h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            6 programas vigentes — 3 maestrías y 3 doctorados
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programas.map((p) => (
              <a key={p.nombre} href={p.url} target="_blank" rel="noopener noreferrer"
                className={`rounded-xl border-l-4 ${p.color} ${p.bg} p-5 hover:shadow-md transition-shadow block`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl">{p.icono}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    p.nivel === "Doctorado" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  }`}>{p.nivel}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-800 mt-3 leading-snug">{p.nombre}</h3>
                <p className="text-xs text-gray-500 mt-1">⏱ {p.duracion}</p>
                <p className="text-xs text-green-600 mt-2 font-medium">Ver programa →</p>
              </a>
            ))}
          </div>
          <p className="text-center mt-6">
            <Link href="/planes-estudio"
              className="text-sm text-green-700 font-semibold hover:underline">
              Ver planes de estudio detallados →
            </Link>
          </p>
        </div>
      </section>

      {/* Reglamento */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Reglamento General de Posgrados</h2>
          <p className="text-gray-500 text-sm text-center mb-8">Consulta el Acuerdo 075 o pregúntale al asistente IA</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/reglamento"
              className="group bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📄</div>
              <div>
                <p className="text-sm font-bold text-gray-800 group-hover:text-green-700 transition-colors">Ver Reglamento</p>
                <p className="text-xs text-gray-500 mt-1">Acuerdo 075 — normas, plazos y requisitos</p>
                <span className="text-xs text-green-600 font-semibold mt-1 inline-block">Abrir →</span>
              </div>
            </Link>
            <a href={NOTEBOOKLM_URL} target="_blank" rel="noopener noreferrer"
              className="group bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🤖</div>
              <div>
                <p className="text-sm font-bold text-gray-800 group-hover:text-blue-700 transition-colors">Pregúntale al Asistente IA</p>
                <p className="text-xs text-gray-500 mt-1">Chat inteligente sobre el reglamento</p>
                <span className="text-xs text-blue-600 font-semibold mt-1 inline-block">Abrir NotebookLM →</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-900 text-green-200 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-xl px-4 py-2">
              <Image src="/logouis.png" alt="UIS" width={90} height={36} className="object-contain" />
            </div>
            <div className="bg-white rounded-xl px-3 py-2">
              <Image src="/E3T.png" alt="E3T" width={36} height={32} className="object-contain" />
            </div>
          </div>
          <div className="text-center md:text-right text-sm">
            <p className="font-semibold text-white">Portal de Gestión de Posgrados · E3T</p>
            <p className="mt-1 text-xs">Universidad Industrial de Santander · Bucaramanga, Colombia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
