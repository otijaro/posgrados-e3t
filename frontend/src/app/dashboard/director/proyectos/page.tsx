const proyectos = [
  {
    id: 1,
    titulo: "Diseño de convertidores DC-DC de alta eficiencia para energías renovables",
    estudiante: "Juliam Díaz",
    codigo: "2024101001",
    programa: "Maestría en Ingeniería Electrónica",
    estado: "En Desarrollo",
    semestre: 2,
    fecha_inicio: "2024-08-01",
    ultimo_reporte: "2025-2",
    aval_reporte: false,
    director: "Dr. Omar Tíjaro",
    grupo: "Grupo de Electrónica de Potencia",
  },
  {
    id: 2,
    titulo: "Análisis de redes de distribución inteligentes con integración de microredes",
    estudiante: "Carlos Pérez",
    codigo: "2023101045",
    programa: "Maestría en Ingeniería Eléctrica",
    estado: "En Evaluación",
    semestre: 4,
    fecha_inicio: "2023-08-01",
    ultimo_reporte: "2025-2",
    aval_reporte: true,
    director: "Dr. Omar Tíjaro",
    grupo: "Grupo de Electrónica de Potencia",
  },
  {
    id: 3,
    titulo: "Optimización de sistemas de comunicación 5G para entornos industriales",
    estudiante: "María López",
    codigo: "2022101012",
    programa: "Maestría en Ingeniería de Telecomunicaciones",
    estado: "Aprobado",
    semestre: 4,
    fecha_inicio: "2022-08-01",
    ultimo_reporte: "2025-1",
    aval_reporte: true,
    director: "Dr. Omar Tíjaro",
    grupo: "Grupo de Telecomunicaciones",
  },
  {
    id: 4,
    titulo: "Control predictivo de convertidores multinivel para tracción eléctrica",
    estudiante: "Andrés Gómez",
    codigo: "2024101033",
    programa: "Doctorado en Ingeniería",
    estado: "Propuesta",
    semestre: 1,
    fecha_inicio: "2024-08-01",
    ultimo_reporte: null,
    aval_reporte: false,
    director: "Dr. Omar Tíjaro",
    grupo: "Grupo de Electrónica de Potencia",
  },
];

const estadoColor: Record<string, string> = {
  "En Desarrollo": "bg-blue-100 text-blue-800",
  "En Evaluación": "bg-purple-100 text-purple-800",
  Aprobado: "bg-green-100 text-green-800",
  Propuesta: "bg-yellow-100 text-yellow-800",
  Sustentado: "bg-teal-100 text-teal-800",
};

export default function ProyectosDirectorPage() {
  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Proyectos Dirigidos</h1>
        <p className="text-gray-500 mt-1">Gestiona y hace seguimiento de todos tus proyectos</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3">
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500">
          <option>Todos los estados</option>
          <option>Propuesta</option>
          <option>En Desarrollo</option>
          <option>En Evaluación</option>
          <option>Aprobado</option>
          <option>Sustentado</option>
        </select>
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500">
          <option>Todos los programas</option>
          <option>Maestría en Ingeniería Electrónica</option>
          <option>Maestría en Ingeniería Eléctrica</option>
          <option>Maestría en Telecomunicaciones</option>
          <option>Doctorado en Ingeniería</option>
        </select>
        <input
          type="text"
          placeholder="Buscar estudiante o título..."
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 flex-1 min-w-48"
        />
      </div>

      {/* Tarjetas de proyectos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {proyectos.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100">
            {/* Cabecera */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">{p.programa}</p>
                <h3 className="text-sm font-bold text-gray-800 leading-snug line-clamp-2">
                  {p.titulo}
                </h3>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${estadoColor[p.estado]}`}>
                {p.estado}
              </span>
            </div>

            {/* Info del estudiante */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {p.estudiante.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{p.estudiante}</p>
                <p className="text-xs text-gray-400">{p.codigo} · Semestre {p.semestre}</p>
              </div>
            </div>

            {/* Detalles */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <p className="text-xs text-gray-400">Inicio</p>
                <p className="text-gray-700 font-medium">{p.fecha_inicio}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Último reporte</p>
                <p className="text-gray-700 font-medium">{p.ultimo_reporte ?? "Sin reportes"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Grupo</p>
                <p className="text-gray-700 font-medium text-xs">{p.grupo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Aval reporte</p>
                {p.ultimo_reporte ? (
                  p.aval_reporte ? (
                    <span className="text-green-600 font-bold text-sm">✓ Avalado</span>
                  ) : (
                    <span className="text-orange-600 font-bold text-sm">⚠ Pendiente</span>
                  )
                ) : (
                  <span className="text-gray-400 text-sm">—</span>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <button className="flex-1 text-xs bg-green-700 text-white px-3 py-2 rounded-lg hover:bg-green-800 transition-colors font-semibold">
                Ver proyecto
              </button>
              {!p.aval_reporte && p.ultimo_reporte && (
                <button className="flex-1 text-xs bg-orange-100 text-orange-700 px-3 py-2 rounded-lg hover:bg-orange-200 transition-colors font-semibold">
                  Dar aval
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
