"use client";

import { useState } from "react";
import PublicNav from "@/components/layout/PublicNav";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const grupos = [
  { nombre: "GISEL",    descripcion: "Grupo de Investigación en Sistemas Eléctricos de Potencia",                          url_grupo: "https://uis.edu.co/ffm-gruinv-gisel-es/",       url_proyectos: "https://drive.google.com/file/d/1Pt24JUF9YEqpKeqsjWjj70Nwh16HPUM4/view?usp=sharing", icono: "⚡", color: "border-yellow-500", bg: "bg-yellow-50" },
  { nombre: "RadioGis", descripcion: "Grupo de Investigación en Radiocomunicaciones y Sistemas de Información Geográfica",  url_grupo: "https://uis.edu.co/ffm-gruinv-radiogis-es/",     url_proyectos: null, icono: "📡", color: "border-blue-500",   bg: "bg-blue-50" },
  { nombre: "CPS",      descripcion: "Grupo de Control y Procesamiento de Señales",                                        url_grupo: "https://uis.edu.co/ffm-gruinv-cps-es/",          url_proyectos: "https://drive.google.com/file/d/1AzJUFtrCfNDMZSlWGJY3gFS6TKSaePbo/view?usp=sharing", icono: "🎛️", color: "border-purple-500", bg: "bg-purple-50" },
  { nombre: "OnChip",   descripcion: "Grupo de Investigación en Diseño de Circuitos Integrados (CIDIC)",                   url_grupo: "https://uis.edu.co/ffm-gruinv-cidic-es/",        url_proyectos: "https://drive.google.com/file/d/16GYYaZpljFPdDlyl38ekR4TGN35-DP8G/view?usp=sharing", icono: "🔬", color: "border-indigo-500", bg: "bg-indigo-50" },
  { nombre: "CEMOS",    descripcion: "Grupo de Investigación en Compatibilidad Electromagnética y Osciladores",             url_grupo: "https://uis.edu.co/ffm-gruinv-cemos-es/",        url_proyectos: "https://drive.google.com/file/d/144Et94OvsGQg4ZH7gxw8gu1UidQnPu_L/view?usp=sharing", icono: "📶", color: "border-red-500",    bg: "bg-red-50" },
  { nombre: "HDSP",     descripcion: "Grupo de Procesamiento de Señales de Alta Definición",                               url_grupo: "https://uis.edu.co/ffm-gruinv-hdsp-es/",         url_proyectos: null, icono: "📊", color: "border-cyan-500",   bg: "bg-cyan-50" },
  { nombre: "GOTS",     descripcion: "Grupo de Óptica y Tratamiento de Señales",                                           url_grupo: "https://uis.edu.co/fc-gruinv-gots-es/",          url_proyectos: null, icono: "🔭", color: "border-teal-500",   bg: "bg-teal-50" },
  { nombre: "INNOTEC",  descripcion: "Grupo de Innovación y Transferencia Tecnológica",                                    url_grupo: "https://uis.edu.co/ffm-gruinv-innotec-es/",      url_proyectos: null, icono: "🚀", color: "border-orange-500", bg: "bg-orange-50" },
  { nombre: "Geomática, gestión y optimización de sistemas", descripcion: "Grupo de investigación en Geomática, Gestión y Optimización de Sistemas", url_grupo: "https://uis.edu.co/ffm-gruinv-geomatica-es/", url_proyectos: null, icono: "🗺️", color: "border-green-500", bg: "bg-green-50" },
  { nombre: "CIDES",    descripcion: "Centro de Investigación y Desarrollo en Electrónica y Software",                     url_grupo: "https://uis.edu.co/ffq-gruinv-cides-es/",        url_proyectos: null, icono: "💻", color: "border-slate-500",  bg: "bg-slate-50" },
];

interface Docente    { nombre: string; email: string; como_director: number; como_codirector: number; }
interface Estudiante { nombre: string; codigo: string; programa: string; titulo_proyecto: string; }
interface Miembros   { docentes: Docente[]; estudiantes: Estudiante[]; }

function GrupoCard({ grupo }: { grupo: typeof grupos[0] }) {
  const [abierto, setAbierto]       = useState(false);
  const [tab, setTab]               = useState<"docentes" | "estudiantes">("docentes");
  const [miembros, setMiembros]     = useState<Miembros | null>(null);
  const [cargando, setCargando]     = useState(false);

  const toggleAbierto = async () => {
    const nuevoEstado = !abierto;
    setAbierto(nuevoEstado);
    if (nuevoEstado && !miembros) {
      setCargando(true);
      try {
        const res = await fetch(
          `${API_URL}/api/programas/grupos-investigacion/${encodeURIComponent(grupo.nombre)}/miembros`
        );
        if (res.ok) setMiembros(await res.json());
      } catch { /* silencioso */ }
      finally { setCargando(false); }
    }
  };

  const docentes    = miembros?.docentes    ?? [];
  const estudiantes = miembros?.estudiantes ?? [];

  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${grupo.color} flex flex-col hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className={`${grupo.bg} px-5 pt-5 pb-4 flex items-start gap-4`}>
        <span className="text-4xl">{grupo.icono}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-800 leading-snug">{grupo.nombre}</h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{grupo.descripcion}</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="px-5 py-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <a href={grupo.url_grupo} target="_blank" rel="noopener noreferrer"
            className="flex-1 text-center text-sm bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 transition-colors font-semibold">
            🌐 Ver grupo
          </a>
          {grupo.url_proyectos && (
            <a href={grupo.url_proyectos} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center text-sm border border-green-700 text-green-700 py-2 rounded-lg hover:bg-green-50 transition-colors font-semibold">
              📄 Proyectos 2025
            </a>
          )}
        </div>

        {/* Botón desplegable */}
        <button onClick={toggleAbierto}
          className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-600 font-medium transition-colors border border-gray-200">
          <span>👥 Docentes y estudiantes</span>
          <span className={`transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}>▼</span>
        </button>

        {/* Contenido desplegable */}
        {abierto && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button onClick={() => setTab("docentes")}
                className={`flex-1 text-xs py-2 font-semibold transition-colors ${tab === "docentes" ? "bg-green-700 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                👨‍🏫 Docentes {miembros && `(${docentes.length})`}
              </button>
              <button onClick={() => setTab("estudiantes")}
                className={`flex-1 text-xs py-2 font-semibold transition-colors ${tab === "estudiantes" ? "bg-green-700 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                🎓 Estudiantes {miembros && `(${estudiantes.length})`}
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto">
              {cargando ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : tab === "docentes" ? (
                docentes.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Sin docentes registrados</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {docentes.map((d, i) => (
                      <li key={i} className="px-3 py-2.5">
                        <p className="text-xs font-semibold text-gray-800">{d.nombre}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{d.email}</p>
                        <div className="flex gap-3 mt-1">
                          {d.como_director > 0 && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Director: {d.como_director}
                            </span>
                          )}
                          {d.como_codirector > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              Codirector: {d.como_codirector}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                estudiantes.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Sin estudiantes registrados</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {estudiantes.map((e, i) => (
                      <li key={i} className="px-3 py-2.5">
                        <p className="text-xs font-semibold text-gray-800">{e.nombre}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{e.codigo} · {e.programa}</p>
                        {e.titulo_proyecto && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 italic">{e.titulo_proyecto}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GruposInvestigacionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🔬 Grupos de Investigación</h1>
          <p className="text-gray-500 mt-1">
            Grupos de investigación activos de la E3T vinculados a los programas de posgrado.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {grupos.map((g) => (
            <GrupoCard key={g.nombre} grupo={g} />
          ))}
        </div>
      </div>
    </div>
  );
}
