import PublicNav from "@/components/layout/PublicNav";

const grupos = [
  {
    nombre: "GISEL",
    descripcion: "Grupo de Investigación en Sistemas Eléctricos de Potencia",
    url_grupo: "https://uis.edu.co/ffm-gruinv-gisel-es/",
    url_proyectos: "https://drive.google.com/file/d/1Pt24JUF9YEqpKeqsjWjj70Nwh16HPUM4/view?usp=sharing",
    icono: "⚡",
    color: "border-yellow-500",
    bg: "bg-yellow-50",
    badge: "bg-yellow-100 text-yellow-800",
  },
  {
    nombre: "RadioGis",
    descripcion: "Grupo de Investigación en Radiocomunicaciones y Sistemas de Información Geográfica",
    url_grupo: "https://uis.edu.co/ffm-gruinv-radiogis-es/",
    url_proyectos: null,
    icono: "📡",
    color: "border-blue-500",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-800",
  },
  {
    nombre: "CPS",
    descripcion: "Grupo de Control y Procesamiento de Señales",
    url_grupo: "https://uis.edu.co/ffm-gruinv-cps-es/",
    url_proyectos: "https://drive.google.com/file/d/1AzJUFtrCfNDMZSlWGJY3gFS6TKSaePbo/view?usp=sharing",
    icono: "🎛️",
    color: "border-purple-500",
    bg: "bg-purple-50",
    badge: "bg-purple-100 text-purple-800",
  },
  {
    nombre: "OnChip",
    descripcion: "Grupo de Investigación en Diseño de Circuitos Integrados (CIDIC)",
    url_grupo: "https://uis.edu.co/ffm-gruinv-cidic-es/",
    url_proyectos: "https://drive.google.com/file/d/16GYYaZpljFPdDlyl38ekR4TGN35-DP8G/view?usp=sharing",
    icono: "🔬",
    color: "border-indigo-500",
    bg: "bg-indigo-50",
    badge: "bg-indigo-100 text-indigo-800",
  },
  {
    nombre: "CEMOS",
    descripcion: "Grupo de Investigación en Compatibilidad Electromagnética y Osciladores",
    url_grupo: "https://uis.edu.co/ffm-gruinv-cemos-es/",
    url_proyectos: "https://drive.google.com/file/d/144Et94OvsGQg4ZH7gxw8gu1UidQnPu_L/view?usp=sharing",
    icono: "📶",
    color: "border-red-500",
    bg: "bg-red-50",
    badge: "bg-red-100 text-red-800",
  },
  {
    nombre: "HDSP",
    descripcion: "Grupo de Procesamiento de Señales de Alta Definición",
    url_grupo: "https://uis.edu.co/ffm-gruinv-hdsp-es/",
    url_proyectos: null,
    icono: "📊",
    color: "border-cyan-500",
    bg: "bg-cyan-50",
    badge: "bg-cyan-100 text-cyan-800",
  },
  {
    nombre: "GOTS",
    descripcion: "Grupo de Óptica y Tratamiento de Señales",
    url_grupo: "https://uis.edu.co/fc-gruinv-gots-es/",
    url_proyectos: null,
    icono: "🔭",
    color: "border-teal-500",
    bg: "bg-teal-50",
    badge: "bg-teal-100 text-teal-800",
  },
  {
    nombre: "INNOTEC",
    descripcion: "Grupo de Innovación y Transferencia Tecnológica",
    url_grupo: "https://uis.edu.co/ffm-gruinv-innotec-es/",
    url_proyectos: null,
    icono: "🚀",
    color: "border-orange-500",
    bg: "bg-orange-50",
    badge: "bg-orange-100 text-orange-800",
  },
  {
    nombre: "Geomática, Gestión y Optimización de Sistemas",
    descripcion: "Grupo de investigación en Geomática, Gestión y Optimización de Sistemas",
    url_grupo: "https://uis.edu.co/ffm-gruinv-geomatica-es/",
    url_proyectos: null,
    icono: "🗺️",
    color: "border-green-500",
    bg: "bg-green-50",
    badge: "bg-green-100 text-green-800",
  },
  {
    nombre: "CIDES",
    descripcion: "Centro de Investigación y Desarrollo en Electrónica y Software",
    url_grupo: "https://uis.edu.co/ffq-gruinv-cides-es/",
    url_proyectos: null,
    icono: "💻",
    color: "border-slate-500",
    bg: "bg-slate-50",
    badge: "bg-slate-100 text-slate-800",
  },
];

const conProyectos = grupos.filter((g) => g.url_proyectos).length;

export default function GruposInvestigacionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* Encabezado */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🔬 Grupos de Investigación</h1>
          <p className="text-gray-500 mt-1">
            Grupos de investigación activos de la E3T vinculados a los programas de posgrado.
          </p>
        </div>

        {/* Resumen */}
        <div className="flex gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center min-w-36">
            <p className="text-3xl font-bold text-green-700">{grupos.length}</p>
            <p className="text-sm text-gray-500 mt-1">Grupos activos</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center min-w-36">
            <p className="text-3xl font-bold text-blue-600">{conProyectos}</p>
            <p className="text-sm text-gray-500 mt-1">Con proyectos 2025</p>
          </div>
        </div>

        {/* Grid de grupos */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {grupos.map((g) => (
            <div
              key={g.nombre}
              className={`bg-white rounded-xl shadow-sm border-l-4 ${g.color} flex flex-col hover:shadow-md transition-shadow`}
            >
              {/* Header */}
              <div className={`${g.bg} px-5 pt-5 pb-4 flex items-start gap-4`}>
                <span className="text-4xl">{g.icono}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-800 leading-snug">{g.nombre}</h3>
                  <span className={`inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${g.badge}`}>
                    Grupo de investigación
                  </span>
                </div>
              </div>

              {/* Descripción */}
              <div className="px-5 py-4 flex-1">
                <p className="text-sm text-gray-500 leading-relaxed">{g.descripcion}</p>
              </div>

              {/* Acciones */}
              <div className="px-5 pb-5 flex flex-col gap-2">
                <a
                  href={g.url_grupo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center text-sm bg-green-700 text-white py-2.5 rounded-lg hover:bg-green-800 transition-colors font-semibold"
                >
                  🌐 Ver grupo
                </a>

                {g.url_proyectos ? (
                  <a
                    href={g.url_proyectos}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center text-sm border border-green-700 text-green-700 py-2.5 rounded-lg hover:bg-green-50 transition-colors font-semibold"
                  >
                    📄 Proyectos 2025
                  </a>
                ) : (
                  <div className="w-full text-center text-sm text-gray-300 py-2.5 rounded-lg border border-gray-100 bg-gray-50 cursor-not-allowed">
                    Sin proyectos 2025 disponibles
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
