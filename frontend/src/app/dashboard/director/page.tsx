import { StatCard } from "@/components/ui/StatCard";
import Link from "next/link";

const director = {
  nombre: "Dr. Omar Tíjaro",
  cargo: "Director de Trabajos de Grado",
  email: "ojtijaro@uis.edu.co",
};

const proyectos = [
  {
    id: 1,
    titulo: "Diseño de convertidores DC-DC de alta eficiencia para energías renovables",
    estudiante: "Juliam Díaz",
    codigo: "2024101001",
    programa: "Maestría en Ingeniería Electrónica",
    estado: "En Desarrollo",
    semestre: 2,
    ultimo_reporte: "2025-2",
    aval_reporte: false,
  },
  {
    id: 2,
    titulo: "Análisis de redes de distribución inteligentes con integración de microredes",
    estudiante: "Carlos Pérez",
    codigo: "2023101045",
    programa: "Maestría en Ingeniería Eléctrica",
    estado: "En Evaluación",
    semestre: 4,
    ultimo_reporte: "2025-2",
    aval_reporte: true,
  },
  {
    id: 3,
    titulo: "Optimización de sistemas de comunicación 5G para entornos industriales",
    estudiante: "María López",
    codigo: "2022101012",
    programa: "Maestría en Ingeniería de Telecomunicaciones",
    estado: "Aprobado",
    semestre: 4,
    ultimo_reporte: "2025-1",
    aval_reporte: true,
  },
  {
    id: 4,
    titulo: "Control predictivo de convertidores multinivel para tracción eléctrica",
    estudiante: "Andrés Gómez",
    codigo: "2024101033",
    programa: "Doctorado en Ingeniería",
    estado: "Propuesta",
    semestre: 1,
    ultimo_reporte: null,
    aval_reporte: false,
  },
];

const pendientes = [
  { tipo: "Aval de reporte", estudiante: "Juliam Díaz", fecha: "2026-04-01", urgente: true },
  { tipo: "Revisión propuesta", estudiante: "Andrés Gómez", fecha: "2026-04-05", urgente: true },
  { tipo: "Firma acta evaluación", estudiante: "Carlos Pérez", fecha: "2026-04-10", urgente: false },
];

const estadoColor: Record<string, string> = {
  "En Desarrollo": "bg-blue-100 text-blue-800",
  "En Evaluación": "bg-purple-100 text-purple-800",
  Aprobado: "bg-green-100 text-green-800",
  Propuesta: "bg-yellow-100 text-yellow-800",
  Sustentado: "bg-teal-100 text-teal-800",
};

export default function DirectorDashboard() {
  const pendientesAval = proyectos.filter((p) => !p.aval_reporte && p.ultimo_reporte).length;
  const enDesarrollo = proyectos.filter((p) => p.estado === "En Desarrollo").length;
  const enEvaluacion = proyectos.filter((p) => p.estado === "En Evaluación").length;

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Bienvenido, {director.nombre} 👨‍🏫
        </h1>
        <p className="text-gray-500 mt-1">{director.cargo} · {director.email}</p>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          titulo="Proyectos Activos"
          valor={proyectos.length}
          descripcion="bajo tu dirección"
          icono="📁"
          color="border-green-500"
        />
        <StatCard
          titulo="En Desarrollo"
          valor={enDesarrollo}
          descripcion="trabajando activamente"
          icono="⚙️"
          color="border-blue-500"
        />
        <StatCard
          titulo="En Evaluación"
          valor={enEvaluacion}
          descripcion="con evaluadores asignados"
          icono="🔍"
          color="border-purple-500"
        />
        <StatCard
          titulo="Avales Pendientes"
          valor={pendientesAval}
          descripcion="reportes sin aval"
          icono="⚠️"
          color="border-orange-500"
        />
      </div>

      {/* Tareas pendientes */}
      {pendientes.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-orange-800 mb-4">⚠️ Acciones Pendientes</h2>
          <div className="space-y-3">
            {pendientes.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white rounded-lg px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${p.urgente ? "bg-red-500" : "bg-yellow-400"}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.tipo}</p>
                    <p className="text-xs text-gray-500">{p.estudiante} · Fecha límite: {p.fecha}</p>
                  </div>
                </div>
                <button className="text-xs text-orange-700 font-semibold hover:underline">
                  Resolver →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de proyectos */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">📁 Mis Proyectos Dirigidos</h2>
          <Link
            href="/dashboard/director/proyectos"
            className="text-sm text-green-700 font-semibold hover:underline"
          >
            Ver todos →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Estudiante</th>
                <th className="pb-3 font-medium">Título</th>
                <th className="pb-3 font-medium">Programa</th>
                <th className="pb-3 font-medium">Semestre</th>
                <th className="pb-3 font-medium">Último reporte</th>
                <th className="pb-3 font-medium">Estado</th>
                <th className="pb-3 font-medium">Aval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {proyectos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="py-3">
                    <p className="font-semibold text-gray-800">{p.estudiante}</p>
                    <p className="text-xs text-gray-400">{p.codigo}</p>
                  </td>
                  <td className="py-3 text-gray-600 max-w-xs">
                    <p className="truncate" title={p.titulo}>{p.titulo}</p>
                  </td>
                  <td className="py-3 text-gray-500 text-xs">{p.programa}</td>
                  <td className="py-3 text-center text-gray-700 font-medium">{p.semestre}</td>
                  <td className="py-3 text-gray-500 text-center">
                    {p.ultimo_reporte ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="py-3">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${estadoColor[p.estado]}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    {p.ultimo_reporte ? (
                      p.aval_reporte ? (
                        <span className="text-green-600 font-bold">✓</span>
                      ) : (
                        <button className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-semibold hover:bg-orange-200 transition-colors">
                          Pendiente
                        </button>
                      )
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
