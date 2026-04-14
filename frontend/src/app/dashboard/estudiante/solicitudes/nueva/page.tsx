"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const tiposSolicitud = [
  {
    id: "evaluacion",
    titulo: "Solicitud de Evaluación",
    descripcion: "Nombramiento de jurados para propuesta, trabajo final, tesis doctoral o examen de candidatura.",
    icono: "🔍",
    color: "border-blue-400 hover:bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    categoria: "Investigación",
    disponible: true,
  },
  {
    id: "credito_condonable",
    titulo: "Crédito Condonable",
    descripcion: "Solicitud de crédito condonable por docencia directa u otras modalidades según el Acuerdo 350.",
    icono: "💰",
    color: "border-yellow-400 hover:bg-yellow-50",
    badge: "bg-yellow-100 text-yellow-700",
    categoria: "Financiera",
    disponible: false,
  },
  {
    id: "prorroga",
    titulo: "Prórroga",
    descripcion: "Solicitud de prórroga del plazo para entrega de trabajo de grado o tesis doctoral.",
    icono: "⏳",
    color: "border-orange-400 hover:bg-orange-50",
    badge: "bg-orange-100 text-orange-700",
    categoria: "Académica",
    disponible: false,
  },
  {
    id: "cambio_director",
    titulo: "Cambio de Director",
    descripcion: "Solicitud de cambio del director del trabajo de grado o tesis doctoral.",
    icono: "👤",
    color: "border-purple-400 hover:bg-purple-50",
    badge: "bg-purple-100 text-purple-700",
    categoria: "Académica",
    disponible: false,
  },
  {
    id: "cambio_titulo",
    titulo: "Cambio de Título",
    descripcion: "Solicitud de modificación del título del trabajo de investigación o tesis.",
    icono: "✏️",
    color: "border-teal-400 hover:bg-teal-50",
    badge: "bg-teal-100 text-teal-700",
    categoria: "Académica",
    disponible: false,
  },
  {
    id: "retiro_materia",
    titulo: "Retiro de Materia",
    descripcion: "Solicitud de retiro de una asignatura inscrita en el periodo académico actual.",
    icono: "📚",
    color: "border-red-400 hover:bg-red-50",
    badge: "bg-red-100 text-red-700",
    categoria: "Académica",
    disponible: false,
  },
  {
    id: "homologacion",
    titulo: "Homologación",
    descripcion: "Solicitud de homologación o convalidación de asignaturas cursadas en otra institución.",
    icono: "📋",
    color: "border-green-400 hover:bg-green-50",
    badge: "bg-green-100 text-green-700",
    categoria: "Académica",
    disponible: false,
  },
  {
    id: "cancelacion_semestre",
    titulo: "Cancelación de Semestre",
    descripcion: "Solicitud de cancelación del semestre académico por causas justificadas.",
    icono: "🚫",
    color: "border-gray-400 hover:bg-gray-50",
    badge: "bg-gray-100 text-gray-700",
    categoria: "Administrativa",
    disponible: false,
  },
  {
    id: "solicitud_grado",
    titulo: "Solicitud de Grado",
    descripcion: "Inicio del proceso de grado una vez cumplidos todos los requisitos académicos.",
    icono: "🎓",
    color: "border-green-600 hover:bg-green-50",
    badge: "bg-green-100 text-green-800",
    categoria: "Grado",
    disponible: false,
  },
  {
    id: "otra",
    titulo: "Otra Solicitud",
    descripcion: "Cualquier otra solicitud académica o administrativa no contemplada en las anteriores.",
    icono: "📩",
    color: "border-gray-300 hover:bg-gray-50",
    badge: "bg-gray-100 text-gray-600",
    categoria: "General",
    disponible: false,
  },
];

const categorias = ["Todas", ...Array.from(new Set(tiposSolicitud.map((t) => t.categoria)))];

export default function NuevaSolicitudPage() {
  const router = useRouter();
  const [categoriaActiva, setCategoriaActiva] = useState("Todas");
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const filtrados =
    categoriaActiva === "Todas"
      ? tiposSolicitud
      : tiposSolicitud.filter((t) => t.categoria === categoriaActiva);

  const handleContinuar = () => {
    if (!seleccionado) return;
    if (seleccionado === "evaluacion") {
      router.push("/dashboard/estudiante/solicitudes/nueva/evaluacion");
    }
    // Aquí se agregarán más rutas a medida que se implementen
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Encabezado */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <Link href="/dashboard/estudiante/solicitudes" className="hover:text-green-700">
            Solicitudes
          </Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">Nueva Solicitud</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">📝 Nueva Solicitud</h1>
        <p className="text-gray-500 mt-1">
          Selecciona el tipo de solicitud que deseas realizar ante el Comité Asesor de Posgrados.
        </p>
      </div>

      {/* Filtros por categoría */}
      <div className="flex flex-wrap gap-2">
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaActiva(cat)}
            className={`text-sm px-4 py-1.5 rounded-full border font-medium transition-colors ${
              categoriaActiva === cat
                ? "bg-green-700 text-white border-green-700"
                : "bg-white text-gray-600 border-gray-200 hover:bg-green-700 hover:text-white hover:border-green-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de tipos de solicitud */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtrados.map((tipo) => (
          <button
            key={tipo.id}
            onClick={() => tipo.disponible && setSeleccionado(tipo.id)}
            disabled={!tipo.disponible}
            className={`relative text-left border-2 rounded-xl p-5 transition-all ${
              !tipo.disponible
                ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                : seleccionado === tipo.id
                ? `${tipo.color} border-opacity-100 ring-2 ring-green-500 ring-offset-2`
                : `${tipo.color} border-gray-200`
            }`}
          >
            {/* Check de selección */}
            {seleccionado === tipo.id && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            )}

            {/* Próximamente badge */}
            {!tipo.disponible && (
              <div className="absolute top-3 right-3">
                <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                  Próximamente
                </span>
              </div>
            )}

            <div className="flex items-start gap-4">
              <span className="text-3xl flex-shrink-0">{tipo.icono}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-sm font-bold text-gray-800">{tipo.titulo}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tipo.badge}`}>
                    {tipo.categoria}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{tipo.descripcion}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Barra inferior con botón continuar */}
      <div className={`sticky bottom-6 transition-all duration-300 ${seleccionado ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {seleccionado && (
              <>
                <span className="text-2xl">
                  {tiposSolicitud.find((t) => t.id === seleccionado)?.icono}
                </span>
                <div>
                  <p className="text-xs text-gray-400">Solicitud seleccionada</p>
                  <p className="text-sm font-bold text-gray-800">
                    {tiposSolicitud.find((t) => t.id === seleccionado)?.titulo}
                  </p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleContinuar}
            className="bg-green-700 text-white px-8 py-2.5 rounded-lg hover:bg-green-800 transition-colors font-semibold text-sm flex-shrink-0"
          >
            Continuar →
          </button>
        </div>
      </div>
    </div>
  );
}
