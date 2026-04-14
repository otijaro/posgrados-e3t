const proyecto = {
  titulo: "Diseño de convertidores DC-DC de alta eficiencia para energías renovables",
  estado: "En Desarrollo",
  tipo: "Plan de Investigación",
  director: "Dr. Omar Tíjaro",
  codirector: null,
  programa: "Maestría en Ingeniería Electrónica",
  fecha_inicio: "2024-08-01",
  fecha_aprobacion_propuesta: "2024-10-15",
  fecha_sustentacion: null,
  reportes: [
    { periodo: "2024-2", estado: "Aprobado", url: "#", fecha: "2025-01-10" },
    { periodo: "2025-1", estado: "Aprobado", url: "#", fecha: "2025-06-15" },
    { periodo: "2025-2", estado: "Pendiente aval", url: "#", fecha: "2026-01-20" },
  ],
};

const estadoReporteColor: Record<string, string> = {
  Aprobado: "bg-green-100 text-green-800",
  "Pendiente aval": "bg-yellow-100 text-yellow-800",
  Rechazado: "bg-red-100 text-red-800",
};

const pasos = [
  { label: "Propuesta enviada", cumplido: true },
  { label: "Propuesta aprobada", cumplido: true },
  { label: "En desarrollo", cumplido: true },
  { label: "Tesis enviada a evaluadores", cumplido: false },
  { label: "Aprobado para sustentación", cumplido: false },
  { label: "Sustentación realizada", cumplido: false },
  { label: "Graduado", cumplido: false },
];

export default function ProyectoPage() {
  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mi Proyecto de Grado</h1>
        <p className="text-gray-500 mt-1">{proyecto.tipo} · {proyecto.programa}</p>
      </div>

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
              <p className="text-sm text-gray-500">Fecha de inicio</p>
              <p className="text-gray-800 font-medium">{proyecto.fecha_inicio}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Aprobación propuesta</p>
              <p className="text-gray-800 font-medium">{proyecto.fecha_aprobacion_propuesta}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Sustentación</p>
              <p className="text-gray-800 font-medium">{proyecto.fecha_sustentacion ?? "Por definir"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                {proyecto.estado}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progreso */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-6">🚦 Progreso del Proyecto</h2>
        <div className="flex flex-col gap-3">
          {pasos.map((paso, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                paso.cumplido ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
              }`}>
                {paso.cumplido ? "✓" : i + 1}
              </div>
              <p className={`text-sm ${paso.cumplido ? "text-gray-800 font-medium" : "text-gray-400"}`}>
                {paso.label}
              </p>
            </div>
          ))}
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
            {proyecto.reportes.map((r) => (
              <tr key={r.periodo} className="hover:bg-gray-50">
                <td className="py-3 font-semibold text-gray-700">{r.periodo}</td>
                <td className="py-3 text-gray-500">{r.fecha}</td>
                <td className="py-3">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${estadoReporteColor[r.estado]}`}>
                    {r.estado}
                  </span>
                </td>
                <td className="py-3">
                  <a href={r.url} className="text-green-700 hover:underline text-xs font-semibold">
                    Ver PDF →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
