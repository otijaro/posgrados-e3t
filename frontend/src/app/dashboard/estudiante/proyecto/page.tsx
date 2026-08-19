"use client";

import { useEffect, useState } from "react";
import { getMiPerfil, EstudianteInfo } from "@/lib/api";

const estadoReporteColor: Record<string, string> = {
  Aprobado:        "bg-green-100 text-green-800",
  "Pendiente aval":"bg-yellow-100 text-yellow-800",
  Rechazado:       "bg-red-100 text-red-800",
};

const PASOS = [
  "Propuesta enviada",
  "Propuesta aprobada",
  "En desarrollo",
  "Tesis enviada a evaluadores",
  "Aprobado para sustentación",
  "Sustentación realizada",
  "Graduado",
];

const ESTADO_PASO: Record<string, number> = {
  "en_desarrollo":            3,
  "tesis_en_evaluacion":      4,
  "aprobado_sustentacion":    5,
  "sustentacion_realizada":   6,
  "graduado":                 7,
};

export default function ProyectoPage() {
  const [perfil, setPerfil]     = useState<EstudianteInfo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    getMiPerfil()
      .then(setPerfil)
      .catch(e => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      Cargando proyecto...
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">⚠️ {error}</div>
  );

  const proyecto = perfil?.proyecto;
  const pasoActual = proyecto ? (ESTADO_PASO[proyecto.estado] ?? 3) : 0;
  const esDoctorado = perfil?.programa?.includes("Doctorado") ?? false;
  const tituloPagina = esDoctorado ? "Tesis de Investigación" : "Proyecto de Investigación";

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{tituloPagina}</h1>
        <p className="text-gray-500 mt-1">{perfil?.programa ?? "—"}</p>
      </div>

      {!proyecto ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-400">
          <p className="text-4xl mb-3">📄</p>
          <p className="font-medium">No tienes un proyecto registrado aún.</p>
        </div>
      ) : (
        <>
          {/* Info principal */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📄 Información General</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Título</p>
                <p className="text-gray-800 font-medium mt-0.5 text-lg">{proyecto.titulo}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <p className="text-sm text-gray-500">Director</p>
                  <p className="text-gray-800 font-medium">{proyecto.director}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Codirector</p>
                  <p className="text-gray-800 font-medium">{proyecto.codirector ?? "No asignado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                    {proyecto.estado.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Último reporte</p>
                  <p className="text-gray-800 font-medium">{proyecto.ultimo_reporte ?? "Sin reportes"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Código estudiante</p>
                  <p className="text-gray-800 font-medium">{perfil?.codigo_estudiante}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Semestre</p>
                  <p className="text-gray-800 font-medium">{perfil?.semestre_actual} de 8</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progreso */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">🚦 Progreso del Proyecto</h2>
            <div className="flex flex-col gap-3">
              {PASOS.map((paso, i) => {
                const cumplido = i + 1 <= pasoActual;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      cumplido ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                      {cumplido ? "✓" : i + 1}
                    </div>
                    <p className={`text-sm ${cumplido ? "text-gray-800 font-medium" : "text-gray-400"}`}>
                      {paso}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reportes semestrales */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">📊 Reportes Semestrales</h2>
              <button className="text-sm bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors">
                + Subir reporte
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-medium">Periodo</th>
                  <th className="pb-3 font-medium">Fecha carga</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium">Documento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(!proyecto.ultimo_reporte) ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      Sin reportes registrados
                    </td>
                  </tr>
                ) : (
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 font-semibold text-gray-700">{proyecto.ultimo_reporte}</td>
                    <td className="py-3 text-gray-500">—</td>
                    <td className="py-3">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-800">
                        Registrado
                      </span>
                    </td>
                    <td className="py-3 text-gray-400 text-xs">—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
