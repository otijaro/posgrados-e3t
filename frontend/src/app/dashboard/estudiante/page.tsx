import { StatCard } from "@/components/ui/StatCard";

// Datos de ejemplo (luego vendrán del backend)
const estudiante = {
  nombre: "Juliam Díaz",
  codigo: "2024101001",
  programa: "Maestría en Ingeniería Electrónica",
  semestre: 2,
  promedio: "4.3",
  estado: "Activo",
  fecha_max_graduacion: "2026-06-30",
};

const proyecto = {
  titulo: "Diseño de convertidores DC-DC de alta eficiencia para energías renovables",
  estado: "En Desarrollo",
  director: "Dr. Omar Tíjaro",
  ultimo_reporte: "2025-2",
};

const solicitudes = [
  { radicado: "SOL-2026-0001", tipo: "Crédito Condonable", estado: "Enviada", fecha: "2026-04-01" },
  { radicado: "SOL-2025-0015", tipo: "Prórroga", estado: "Aprobada", fecha: "2025-11-10" },
];

const estadoColor: Record<string, string> = {
  Enviada: "bg-yellow-100 text-yellow-800",
  Aprobada: "bg-green-100 text-green-800",
  Rechazada: "bg-red-100 text-red-800",
  "En Revisión": "bg-blue-100 text-blue-800",
};

const proyectoEstadoColor: Record<string, string> = {
  "En Desarrollo": "bg-blue-100 text-blue-800",
  Aprobado: "bg-green-100 text-green-800",
  Propuesta: "bg-yellow-100 text-yellow-800",
};

export default function EstudianteDashboard() {
  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Bienvenida, {estudiante.nombre} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {estudiante.programa} · Semestre {estudiante.semestre} · Código {estudiante.codigo}
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          titulo="Promedio Acumulado"
          valor={estudiante.promedio}
          descripcion="Sobre 5.0"
          icono="📊"
          color="border-green-500"
        />
        <StatCard
          titulo="Semestre Actual"
          valor={estudiante.semestre}
          descripcion="de 4 semestres"
          icono="🎓"
          color="border-blue-500"
        />
        <StatCard
          titulo="Estado"
          valor={estudiante.estado}
          descripcion="Sin observaciones"
          icono="✅"
          color="border-teal-500"
        />
        <StatCard
          titulo="Fecha Límite Grado"
          valor="Jun 2026"
          descripcion={estudiante.fecha_max_graduacion}
          icono="📅"
          color="border-orange-500"
        />
      </div>

      {/* Proyecto de grado */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">📄 Mi Proyecto de Grado</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Título</p>
            <p className="text-gray-800 font-medium mt-0.5">{proyecto.titulo}</p>
          </div>
          <div className="flex flex-wrap gap-6 mt-4">
            <div>
              <p className="text-sm text-gray-500">Director</p>
              <p className="text-gray-800 font-medium">{proyecto.director}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Último reporte</p>
              <p className="text-gray-800 font-medium">{proyecto.ultimo_reporte}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${proyectoEstadoColor[proyecto.estado]}`}>
                {proyecto.estado}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <a
            href="/dashboard/estudiante/proyecto"
            className="text-sm text-green-700 font-semibold hover:underline"
          >
            Ver detalle del proyecto →
          </a>
        </div>
      </div>

      {/* Solicitudes recientes */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">📋 Solicitudes Recientes</h2>
          <a
            href="/dashboard/estudiante/solicitudes"
            className="text-sm text-green-700 font-semibold hover:underline"
          >
            Ver todas →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Radicado</th>
                <th className="pb-3 font-medium">Tipo</th>
                <th className="pb-3 font-medium">Fecha</th>
                <th className="pb-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {solicitudes.map((s) => (
                <tr key={s.radicado} className="hover:bg-gray-50">
                  <td className="py-3 font-mono text-xs text-gray-600">{s.radicado}</td>
                  <td className="py-3 text-gray-800">{s.tipo}</td>
                  <td className="py-3 text-gray-500">{s.fecha}</td>
                  <td className="py-3">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${estadoColor[s.estado]}`}>
                      {s.estado}
                    </span>
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
