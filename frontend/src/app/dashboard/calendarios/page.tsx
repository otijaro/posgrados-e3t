"use client";

import { useState } from "react";

const calendarios = [
  {
    id: 1,
    titulo: "Calendario Admisiones Doctorado 2025",
    categoria: "Admisiones",
    descripcion: "Fechas y plazos para el proceso de admisión al programa de Doctorado en Ingeniería 2025.",
    url: "https://drive.google.com/file/d/1tUhHg3gj8dotOlz2mM8V-kIYVCK4g4WM/view?usp=drive_link",
    icono: "🎓",
    color: "border-blue-500",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-800",
  },
  {
    id: 2,
    titulo: "Convocatoria Créditos Educativos MinCiencias",
    categoria: "Financiación",
    descripcion: "Convocatoria de créditos educativos para investigación del Ministerio de Ciencias.",
    url: "https://convocatorias.uis.edu.co/convocatoria-creditos-educativos-para-investigacion-minciencias/",
    icono: "💰",
    color: "border-yellow-500",
    bg: "bg-yellow-50",
    badge: "bg-yellow-100 text-yellow-800",
  },
  {
    id: 3,
    titulo: "Calendario Admisiones 2026",
    categoria: "Admisiones",
    descripcion: "Cronograma completo del proceso de admisión para todos los programas de posgrado 2026.",
    url: "https://drive.google.com/file/d/1HJdNp-dtNPOp7AsBL913mWYFdN8bskc3/view?usp=drive_link",
    icono: "📅",
    color: "border-blue-500",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-800",
  },
  {
    id: 4,
    titulo: "Calendario Académico 2026",
    categoria: "Académico",
    descripcion: "Calendario oficial de actividades académicas de la UIS para el año 2026.",
    url: "https://documentos.uis.edu.co/wp-content/uploads/2025/09/acuerdo-252-del-23-de-septiembre-de-2025-consejo-academico.pdf",
    icono: "🏫",
    color: "border-green-500",
    bg: "bg-green-50",
    badge: "bg-green-100 text-green-800",
  },
  {
    id: 5,
    titulo: "Calendario Créditos Condonables — Docencia Directa",
    categoria: "Créditos Condonables",
    descripcion: "Fechas para solicitar y tramitar créditos condonables en modalidad de docencia directa.",
    url: "https://drive.google.com/file/d/1Nxw5SRkhKa6rZY-7OLachefh-sVEFff2/view?usp=sharing",
    icono: "📋",
    color: "border-orange-500",
    bg: "bg-orange-50",
    badge: "bg-orange-100 text-orange-800",
  },
  {
    id: 6,
    titulo: "Calendario Exámenes Instituto de Lenguas",
    categoria: "Idiomas",
    descripcion: "Fechas de exámenes de certificación de idiomas requeridos para grado.",
    url: "https://drive.google.com/file/d/12i16gLuy4A2R3q5E_ZQQZWuUFONMQ4tH/view?usp=drive_link",
    icono: "🌐",
    color: "border-purple-500",
    bg: "bg-purple-50",
    badge: "bg-purple-100 text-purple-800",
  },
  {
    id: 7,
    titulo: "Calendario Créditos Condonables 2026-1",
    categoria: "Créditos Condonables",
    descripcion: "Contraprestación docencia directa para el primer periodo académico de 2026.",
    url: "https://drive.google.com/file/d/1tUhHg3gj8dotOlz2mM8V-kIYVCK4g4WM/view?usp=drive_link",
    icono: "📋",
    color: "border-orange-500",
    bg: "bg-orange-50",
    badge: "bg-orange-100 text-orange-800",
  },
  {
    id: 8,
    titulo: "Calendario Admisiones 2026 — Becas para el Cambio 975",
    categoria: "Becas",
    descripcion: "Proceso de admisión para aspirantes con Beca para el Cambio, convocatoria 975.",
    url: "https://drive.google.com/file/d/16E9eDisdDoq1DA7L6ymTIgo6kFnii-Oq/view?usp=drive_link",
    icono: "🏆",
    color: "border-teal-500",
    bg: "bg-teal-50",
    badge: "bg-teal-100 text-teal-800",
  },
  {
    id: 9,
    titulo: "Calendario Admisiones 2026-2 — Beca Colombia Extranjeros ICETEX",
    categoria: "Becas",
    descripcion: "Admisiones para extranjeros con Beca Colombia del ICETEX, segundo semestre 2026.",
    url: "https://drive.google.com/file/d/1PdFouTAKuGOU3WRAflJ-kNOiblalXXX/view?usp=sharing",
    icono: "🌍",
    color: "border-teal-500",
    bg: "bg-teal-50",
    badge: "bg-teal-100 text-teal-800",
  },
  {
    id: 10,
    titulo: "Calendario Admisiones 2026 — Formación Capital Humano Alto Nivel",
    categoria: "Becas",
    descripcion: "Cronograma para la convocatoria de Formación de Capital Humano de Alto Nivel para las Regiones.",
    url: "https://drive.google.com/file/d/1xFgKG-y6qo21sDSBfJnA4b5LlsFS41-x/view?usp=sharing",
    icono: "🚀",
    color: "border-teal-500",
    bg: "bg-teal-50",
    badge: "bg-teal-100 text-teal-800",
  },
];

const categorias = ["Todos", ...Array.from(new Set(calendarios.map((c) => c.categoria)))];

export default function CalendariosPage() {
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");

  const filtrados =
    categoriaActiva === "Todos"
      ? calendarios
      : calendarios.filter((c) => c.categoria === categoriaActiva);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📅 Calendarios</h1>
        <p className="text-gray-500 mt-1">
          Consulta los calendarios académicos, de admisiones, créditos condonables y más.
        </p>
      </div>

      {/* Filtros */}
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
            {cat !== "Todos" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({calendarios.filter((c) => c.categoria === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-400">
        Mostrando <span className="font-semibold text-gray-600">{filtrados.length}</span> calendario{filtrados.length !== 1 ? "s" : ""}
        {categoriaActiva !== "Todos" && ` en "${categoriaActiva}"`}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtrados.map((cal) => (
          <div
            key={cal.id}
            className={`bg-white rounded-xl shadow-sm border-l-4 overflow-hidden hover:shadow-md transition-shadow flex flex-col ${cal.color}`}
          >
            {/* Preview — ícono grande con fondo de color */}
            <div className={`h-40 flex flex-col items-center justify-center gap-2 ${cal.bg}`}>
              <span className="text-6xl">{cal.icono}</span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${cal.badge}`}>
                {cal.categoria}
              </span>
            </div>

            {/* Contenido */}
            <div className="p-5 flex flex-col flex-1">
              <h3 className="text-sm font-bold text-gray-800 leading-snug mb-2">{cal.titulo}</h3>
              <p className="text-xs text-gray-500 leading-relaxed flex-1">{cal.descripcion}</p>
              <a
                href={cal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full text-center text-sm bg-green-700 text-white py-2.5 rounded-lg hover:bg-green-800 transition-colors font-semibold"
              >
                Ver calendario →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
