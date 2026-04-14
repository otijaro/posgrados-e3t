import Link from "next/link";

const programas: Record<string, {
  nombre: string; nivel: string; codigo: string; plan: string;
  duracion: string; creditos_totales: number; descripcion: string;
  icono: string; badge: string; url_drive: string;
  semestres: { numero: number; creditos: number; materias: { codigo: string; nombre: string; creditos: number; tipo: "Obligatoria" | "Electiva" | "Electiva Énfasis"; requisito?: string }[] }[];
  electivas_enfasis: { codigo: string; nombre: string; creditos: number }[];
  electivas: { codigo: string; nombre: string; creditos: number; requisito?: string }[];
}> = {
  "maestria-electronica": {
    nombre: "Maestría en Ingeniería Electrónica",
    nivel: "Maestría", codigo: "254", plan: "Plan 3",
    duracion: "4 semestres", creditos_totales: 56,
    descripcion: "Forma investigadores en modelado, simulación y áreas avanzadas de la ingeniería electrónica.",
    icono: "⚡", badge: "bg-blue-100 text-blue-800",
    url_drive: "https://drive.google.com/drive/folders/17bFtb-Wq5503QRDlXAyXI57ndbrh494A",
    semestres: [
      { numero: 1, creditos: 15, materias: [
        { codigo: "27191", nombre: "Modelado y Simulación I", creditos: 6, tipo: "Obligatoria" },
        { codigo: "27193", nombre: "Propuesta de Investigación I", creditos: 3, tipo: "Obligatoria" },
        { codigo: "—", nombre: "Electiva: Énfasis de Área", creditos: 6, tipo: "Electiva Énfasis" },
      ]},
      { numero: 2, creditos: 15, materias: [
        { codigo: "27192", nombre: "Modelado y Simulación II", creditos: 6, tipo: "Obligatoria", requisito: "27191" },
        { codigo: "27194", nombre: "Propuesta de Investigación II", creditos: 3, tipo: "Obligatoria", requisito: "27193" },
        { codigo: "—", nombre: "Electiva", creditos: 6, tipo: "Electiva" },
      ]},
      { numero: 3, creditos: 16, materias: [
        { codigo: "27195", nombre: "Seminario de Investigación I", creditos: 2, tipo: "Obligatoria", requisito: "27194" },
        { codigo: "27196", nombre: "Trabajo de Investigación I", creditos: 8, tipo: "Obligatoria", requisito: "27194" },
        { codigo: "—", nombre: "Electiva", creditos: 6, tipo: "Electiva" },
      ]},
      { numero: 4, creditos: 10, materias: [
        { codigo: "27197", nombre: "Seminario de Investigación II", creditos: 2, tipo: "Obligatoria", requisito: "27196, 27195" },
        { codigo: "27198", nombre: "Trabajo de Investigación II", creditos: 8, tipo: "Obligatoria", requisito: "27196, 27195" },
      ]},
    ],
    electivas_enfasis: [
      { codigo: "27199", nombre: "Procesamiento Digital de Señales", creditos: 6 },
    ],
    electivas: [
      { codigo: "27200", nombre: "Tópicos Especiales I", creditos: 6 },
      { codigo: "27201", nombre: "Tópicos Especiales II", creditos: 6 },
      { codigo: "27202", nombre: "Técnicas Avanzadas de Control", creditos: 6 },
      { codigo: "27203", nombre: "Robótica", creditos: 6 },
      { codigo: "27204", nombre: "Ingeniería de las Comunicaciones Móviles", creditos: 6 },
      { codigo: "27205", nombre: "Diseño de Experimentos", creditos: 6 },
      { codigo: "27206", nombre: "Electromagnetismo Computacional", creditos: 6 },
      { codigo: "27207", nombre: "Arquitectura de Computadores", creditos: 6 },
      { codigo: "27208", nombre: "Electrónica de Potencia Avanzada", creditos: 6 },
      { codigo: "27209", nombre: "Bioingeniería", creditos: 6 },
    ],
  },
  "maestria-electrica": {
    nombre: "Maestría en Ingeniería Eléctrica",
    nivel: "Maestría", codigo: "270", plan: "Plan 4",
    duracion: "4 semestres", creditos_totales: 52,
    descripcion: "Profundiza en sistemas de potencia, energías renovables y calidad de la energía eléctrica.",
    icono: "🔌", badge: "bg-yellow-100 text-yellow-800",
    url_drive: "https://drive.google.com/drive/folders/1e2wKH6wTNy5UOI1AtEZ09XlqyqCOh1Kz",
    semestres: [
      { numero: 1, creditos: 13, materias: [
        { codigo: "29811", nombre: "Modelado y Simulación I", creditos: 5, tipo: "Obligatoria" },
        { codigo: "29812", nombre: "Propuesta de Investigación", creditos: 8, tipo: "Obligatoria" },
      ]},
      { numero: 2, creditos: 13, materias: [
        { codigo: "29813", nombre: "Trabajo de Investigación I", creditos: 3, tipo: "Obligatoria", requisito: "29812" },
        { codigo: "—", nombre: "Asignaturas Electivas", creditos: 5, tipo: "Electiva" },
        { codigo: "—", nombre: "Electiva: Énfasis de Área", creditos: 5, tipo: "Electiva Énfasis" },
      ]},
      { numero: 3, creditos: 13, materias: [
        { codigo: "29815", nombre: "Trabajo de Investigación II", creditos: 6, tipo: "Obligatoria", requisito: "29813" },
        { codigo: "29814", nombre: "Seminario de Investigación", creditos: 2, tipo: "Obligatoria", requisito: "29813" },
        { codigo: "—", nombre: "Asignaturas Electivas", creditos: 5, tipo: "Electiva" },
      ]},
      { numero: 4, creditos: 13, materias: [
        { codigo: "29816", nombre: "Trabajo de Investigación III", creditos: 13, tipo: "Obligatoria", requisito: "29815, 29814" },
      ]},
    ],
    electivas_enfasis: [
      { codigo: "29830", nombre: "Análisis Avanzado de Sistema de Potencia", creditos: 5 },
    ],
    electivas: [
      { codigo: "29817", nombre: "Estabilidad de Sistemas de Potencia", creditos: 5 },
      { codigo: "29818", nombre: "Tópicos Especiales I", creditos: 5 },
      { codigo: "29819", nombre: "Tópicos Especiales II", creditos: 5 },
      { codigo: "29820", nombre: "Operación de Sistemas de Potencia", creditos: 5 },
      { codigo: "29821", nombre: "Mercados de Energía Eléctrica", creditos: 5 },
      { codigo: "29822", nombre: "Transitorios Electromagnéticos", creditos: 5 },
      { codigo: "29823", nombre: "Dieléctricos y Aislamientos en Sistemas de Potencia", creditos: 5 },
      { codigo: "29824", nombre: "Análisis de Confiabilidad en Sistemas de Potencia", creditos: 5 },
      { codigo: "29825", nombre: "Diseño de Experimentos", creditos: 5 },
      { codigo: "29826", nombre: "Electromagnetismo Computacional", creditos: 5 },
      { codigo: "29827", nombre: "Electrónica de Potencia Avanzada", creditos: 5 },
      { codigo: "29828", nombre: "Calidad de la Energía Eléctrica", creditos: 5 },
      { codigo: "29829", nombre: "Modelado y Simulación II", creditos: 5, requisito: "29811" },
    ],
  },
  "maestria-telecomunicaciones": {
    nombre: "Maestría en Ingeniería de Telecomunicaciones",
    nivel: "Maestría", codigo: "305", plan: "Plan 3",
    duracion: "4 semestres", creditos_totales: 52,
    descripcion: "Comunicaciones móviles, procesamiento de señales, gestión del espectro y redes de telecomunicaciones.",
    icono: "📡", badge: "bg-purple-100 text-purple-800",
    url_drive: "https://drive.google.com/drive/folders/1KvPXb1M1GmoLfpP0_N4SjtmVt26gZVpP",
    semestres: [
      { numero: 1, creditos: 13, materias: [
        { codigo: "29811", nombre: "Modelado y Simulación I", creditos: 5, tipo: "Obligatoria" },
        { codigo: "29812", nombre: "Propuesta de Investigación", creditos: 8, tipo: "Obligatoria" },
      ]},
      { numero: 2, creditos: 13, materias: [
        { codigo: "29813", nombre: "Trabajo de Investigación I", creditos: 3, tipo: "Obligatoria", requisito: "29812" },
        { codigo: "—", nombre: "Asignaturas Electivas", creditos: 5, tipo: "Electiva" },
        { codigo: "—", nombre: "Electiva: Énfasis de Área", creditos: 5, tipo: "Electiva Énfasis" },
      ]},
      { numero: 3, creditos: 13, materias: [
        { codigo: "29814", nombre: "Seminario de Investigación", creditos: 2, tipo: "Obligatoria", requisito: "29813" },
        { codigo: "29815", nombre: "Trabajo de Investigación II", creditos: 6, tipo: "Obligatoria", requisito: "29813" },
        { codigo: "—", nombre: "Asignaturas Electivas", creditos: 5, tipo: "Electiva" },
      ]},
      { numero: 4, creditos: 13, materias: [
        { codigo: "29816", nombre: "Trabajo de Investigación III", creditos: 13, tipo: "Obligatoria", requisito: "29815, 29814" },
      ]},
    ],
    electivas_enfasis: [
      { codigo: "29721", nombre: "Procesamiento Digital de Señales", creditos: 5 },
      { codigo: "29722", nombre: "Procesamiento Estadístico de Señales", creditos: 5 },
    ],
    electivas: [
      { codigo: "29710", nombre: "Tópicos Especiales I", creditos: 5 },
      { codigo: "29711", nombre: "Tópicos Especiales II", creditos: 5 },
      { codigo: "29712", nombre: "Técnicas de Modulación Digital", creditos: 5 },
      { codigo: "29713", nombre: "Radiopropagación y Antenas", creditos: 5 },
      { codigo: "29714", nombre: "Comunicaciones Móviles", creditos: 5 },
      { codigo: "29715", nombre: "Gerencia de Negocios Digitales", creditos: 5 },
      { codigo: "29716", nombre: "Gestión del Espectro", creditos: 5 },
      { codigo: "29717", nombre: "Arquitectura y Servicios TIC", creditos: 5 },
      { codigo: "29718", nombre: "Teoría de la Información y Codificación", creditos: 5 },
      { codigo: "29719", nombre: "Protocolos Avanzados TCP/IP", creditos: 5 },
      { codigo: "29720", nombre: "Modelado y Simulación II", creditos: 5, requisito: "29704" },
    ],
  },
  "doctorado-electrica": {
    nombre: "Doctorado en Ingeniería — Área Ingeniería Eléctrica",
    nivel: "Doctorado", codigo: "308", plan: "Plan 3",
    duracion: "8 semestres", creditos_totales: 96,
    descripcion: "Forma doctores en sistemas de potencia, energía eléctrica y áreas afines.",
    icono: "🔬", badge: "bg-green-100 text-green-800",
    url_drive: "https://drive.google.com/drive/folders/18AomHosLXVZnEwtus-HjbrFjzVo1BOaS",
    semestres: [
      { numero: 1, creditos: 13, materias: [
        { codigo: "40287", nombre: "Modelado y Simulación I", creditos: 5, tipo: "Obligatoria" },
        { codigo: "40288", nombre: "Seminario de Investigación I", creditos: 3, tipo: "Obligatoria" },
        { codigo: "—", nombre: "Electiva: Énfasis de Área", creditos: 5, tipo: "Electiva Énfasis" },
      ]},
      { numero: 2, creditos: 13, materias: [
        { codigo: "40289", nombre: "Seminario de Investigación II", creditos: 3, tipo: "Obligatoria", requisito: "40288" },
        { codigo: "40290", nombre: "Tesis Doctoral I", creditos: 5, tipo: "Obligatoria" },
        { codigo: "—", nombre: "Electiva", creditos: 5, tipo: "Electiva" },
      ]},
      { numero: 3, creditos: 12, materias: [
        { codigo: "40291", nombre: "Tesis Doctoral II", creditos: 12, tipo: "Obligatoria", requisito: "40290" },
      ]},
      { numero: 4, creditos: 12, materias: [
        { codigo: "40292", nombre: "Tesis Doctoral III", creditos: 12, tipo: "Obligatoria", requisito: "40291" },
      ]},
      { numero: 5, creditos: 11, materias: [
        { codigo: "40293", nombre: "Seminario de Investigación III", creditos: 3, tipo: "Obligatoria", requisito: "40289" },
        { codigo: "40294", nombre: "Tesis Doctoral IV", creditos: 8, tipo: "Obligatoria", requisito: "40292" },
      ]},
      { numero: 6, creditos: 11, materias: [
        { codigo: "40295", nombre: "Experiencia Investigación/Innovación", creditos: 11, tipo: "Obligatoria" },
      ]},
      { numero: 7, creditos: 12, materias: [
        { codigo: "40296", nombre: "Tesis Doctoral V", creditos: 12, tipo: "Obligatoria", requisito: "40294" },
      ]},
      { numero: 8, creditos: 12, materias: [
        { codigo: "40297", nombre: "Tesis Doctoral VI", creditos: 12, tipo: "Obligatoria", requisito: "40296" },
      ]},
    ],
    electivas_enfasis: [
      { codigo: "40301", nombre: "Análisis Avanzado de Sistemas de Potencia", creditos: 5 },
    ],
    electivas: [
      { codigo: "40298", nombre: "Tópicos Especiales I", creditos: 5 },
      { codigo: "40299", nombre: "Tópicos Especiales II", creditos: 5 },
      { codigo: "40300", nombre: "Modelado y Simulación II", creditos: 5 },
      { codigo: "40302", nombre: "Estabilidad de Sistemas de Potencia", creditos: 5 },
      { codigo: "40303", nombre: "Mercados de Energía Eléctrica", creditos: 5 },
      { codigo: "40304", nombre: "Transitorios Electromagnéticos", creditos: 5 },
      { codigo: "40305", nombre: "Fundamentos de la Coordinación de Aislamiento", creditos: 5 },
      { codigo: "40306", nombre: "Análisis de Confiabilidad de Sistemas de Potencia", creditos: 5 },
      { codigo: "40307", nombre: "Calidad de la Energía Eléctrica", creditos: 5 },
      { codigo: "40308", nombre: "Operación de Sistemas de Potencia", creditos: 5 },
      { codigo: "40309", nombre: "Electrónica de Potencia Avanzada", creditos: 5 },
    ],
  },
  "doctorado-electronica": {
    nombre: "Doctorado en Ingeniería — Área Ingeniería Electrónica",
    nivel: "Doctorado", codigo: "309", plan: "Plan 3",
    duracion: "8 semestres", creditos_totales: 96,
    descripcion: "Forma doctores en electrónica, control, procesamiento de señales y áreas afines.",
    icono: "🔬", badge: "bg-blue-100 text-blue-800",
    url_drive: "https://drive.google.com/drive/folders/1MiYU0v6ygwoVOZY2bQWIo8blRQY69d7r",
    semestres: [
      { numero: 1, creditos: 13, materias: [
        { codigo: "40287", nombre: "Modelado y Simulación I", creditos: 5, tipo: "Obligatoria" },
        { codigo: "40288", nombre: "Seminario de Investigación I", creditos: 3, tipo: "Obligatoria" },
        { codigo: "—", nombre: "Electiva: Énfasis de Área", creditos: 5, tipo: "Electiva Énfasis" },
      ]},
      { numero: 2, creditos: 13, materias: [
        { codigo: "40289", nombre: "Seminario de Investigación II", creditos: 3, tipo: "Obligatoria", requisito: "40288" },
        { codigo: "40290", nombre: "Tesis Doctoral I", creditos: 5, tipo: "Obligatoria" },
        { codigo: "—", nombre: "Electiva", creditos: 5, tipo: "Electiva" },
      ]},
      { numero: 3, creditos: 12, materias: [{ codigo: "40291", nombre: "Tesis Doctoral II", creditos: 12, tipo: "Obligatoria", requisito: "40290" }]},
      { numero: 4, creditos: 12, materias: [{ codigo: "40292", nombre: "Tesis Doctoral III", creditos: 12, tipo: "Obligatoria", requisito: "40291" }]},
      { numero: 5, creditos: 11, materias: [
        { codigo: "40293", nombre: "Seminario de Investigación III", creditos: 3, tipo: "Obligatoria", requisito: "40289" },
        { codigo: "40294", nombre: "Tesis Doctoral IV", creditos: 8, tipo: "Obligatoria", requisito: "40292" },
      ]},
      { numero: 6, creditos: 11, materias: [{ codigo: "40295", nombre: "Experiencia Investigación/Innovación", creditos: 11, tipo: "Obligatoria" }]},
      { numero: 7, creditos: 12, materias: [{ codigo: "40296", nombre: "Tesis Doctoral V", creditos: 12, tipo: "Obligatoria", requisito: "40294" }]},
      { numero: 8, creditos: 12, materias: [{ codigo: "40297", nombre: "Tesis Doctoral VI", creditos: 12, tipo: "Obligatoria", requisito: "40294" }]},
    ],
    electivas_enfasis: [],
    electivas: [
      { codigo: "40298", nombre: "Tópicos Especiales I", creditos: 5 },
      { codigo: "40299", nombre: "Tópicos Especiales II", creditos: 5 },
      { codigo: "40300", nombre: "Modelado y Simulación II", creditos: 5 },
      { codigo: "40309", nombre: "Electrónica de Potencia Avanzada", creditos: 5 },
      { codigo: "40310", nombre: "Procesamiento Digital de Señales", creditos: 5 },
      { codigo: "40311", nombre: "Procesamiento Estadístico de Señales", creditos: 5 },
      { codigo: "40312", nombre: "Teoría de la Información y Codificación", creditos: 5 },
      { codigo: "40313", nombre: "Técnicas de Modulación Digital", creditos: 5 },
      { codigo: "40314", nombre: "Técnicas Avanzadas de Control", creditos: 5 },
      { codigo: "40315", nombre: "Bioingeniería", creditos: 5 },
      { codigo: "40316", nombre: "Robótica", creditos: 5 },
      { codigo: "40317", nombre: "Reconocimiento de Patrones y Aprendizaje de Máquina", creditos: 5 },
      { codigo: "40318", nombre: "Radiopropagación y Antenas", creditos: 5 },
      { codigo: "40320", nombre: "Comunicaciones Móviles", creditos: 5 },
      { codigo: "40321", nombre: "Gestión del Espectro", creditos: 5 },
      { codigo: "40322", nombre: "Arquitectura y Servicios TIC", creditos: 5 },
      { codigo: "40323", nombre: "Arquitectura de Computadores", creditos: 5 },
      { codigo: "40324", nombre: "Electromagnetismo Computacional", creditos: 5 },
    ],
  },
  "doctorado-gestion": {
    nombre: "Doctorado en Ingeniería — Área Gestión y Desarrollo Tecnológico",
    nivel: "Doctorado", codigo: "310", plan: "Plan 3",
    duracion: "8 semestres", creditos_totales: 96,
    descripcion: "Gestión de la innovación, prospectiva tecnológica, transferencia de tecnología y empresas de base tecnológica.",
    icono: "🚀", badge: "bg-orange-100 text-orange-800",
    url_drive: "https://drive.google.com/drive/folders/1xgU4Qn2sI_iGciu4nZZhSRfS789UVTWY",
    semestres: [
      { numero: 1, creditos: 13, materias: [
        { codigo: "40287", nombre: "Modelado y Simulación I", creditos: 5, tipo: "Obligatoria" },
        { codigo: "40288", nombre: "Seminario de Investigación I", creditos: 3, tipo: "Obligatoria" },
        { codigo: "—", nombre: "Electiva: Énfasis de Área", creditos: 5, tipo: "Electiva Énfasis" },
      ]},
      { numero: 2, creditos: 13, materias: [
        { codigo: "40289", nombre: "Seminario de Investigación II", creditos: 3, tipo: "Obligatoria", requisito: "40288" },
        { codigo: "40290", nombre: "Tesis Doctoral I", creditos: 5, tipo: "Obligatoria" },
        { codigo: "—", nombre: "Electiva", creditos: 5, tipo: "Electiva" },
      ]},
      { numero: 3, creditos: 12, materias: [{ codigo: "40291", nombre: "Tesis Doctoral II", creditos: 12, tipo: "Obligatoria", requisito: "40290" }]},
      { numero: 4, creditos: 12, materias: [{ codigo: "40292", nombre: "Tesis Doctoral III", creditos: 12, tipo: "Obligatoria", requisito: "40291" }]},
      { numero: 5, creditos: 11, materias: [
        { codigo: "40293", nombre: "Seminario de Investigación III", creditos: 3, tipo: "Obligatoria", requisito: "40288" },
        { codigo: "40294", nombre: "Tesis Doctoral IV", creditos: 8, tipo: "Obligatoria", requisito: "40292" },
      ]},
      { numero: 6, creditos: 11, materias: [{ codigo: "40295", nombre: "Experiencia Investigación/Innovación", creditos: 11, tipo: "Obligatoria" }]},
      { numero: 7, creditos: 12, materias: [{ codigo: "40296", nombre: "Tesis Doctoral V", creditos: 12, tipo: "Obligatoria", requisito: "40294" }]},
      { numero: 8, creditos: 12, materias: [{ codigo: "40297", nombre: "Tesis Doctoral VI", creditos: 12, tipo: "Obligatoria", requisito: "40296" }]},
    ],
    electivas_enfasis: [],
    electivas: [
      { codigo: "40298", nombre: "Tópicos Especiales I", creditos: 5 },
      { codigo: "40299", nombre: "Tópicos Especiales II", creditos: 5 },
      { codigo: "40300", nombre: "Modelado y Simulación II", creditos: 5 },
      { codigo: "40325", nombre: "Gestión de la Innovación y Sistemas de Innovación", creditos: 5 },
      { codigo: "40326", nombre: "Prospectiva Tecnológica", creditos: 5 },
      { codigo: "40327", nombre: "Creación y Gerencia de Empresas de Base Tecnológica", creditos: 5 },
      { codigo: "40328", nombre: "Valoración y Transferencia de Tecnología", creditos: 5 },
    ],
  },
};

const tipoColor: Record<string, string> = {
  Obligatoria: "bg-blue-100 text-blue-700 border-blue-200",
  Electiva: "bg-purple-100 text-purple-700 border-purple-200",
  "Electiva Énfasis": "bg-orange-100 text-orange-700 border-orange-200",
};
const tipoIcono: Record<string, string> = {
  Obligatoria: "📘",
  Electiva: "📙",
  "Electiva Énfasis": "🎯",
};

export default function DetallePlanPage({ params }: { params: { id: string } }) {
  const prog = programas[params.id];

  if (!prog) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">😕</p>
        <p className="text-gray-500">Programa no encontrado.</p>
        <Link href="/dashboard/planes-estudio" className="text-green-700 font-semibold hover:underline mt-4 inline-block">← Volver</Link>
      </div>
    );
  }

  const todasMaterias = prog.semestres.flatMap((s) => s.materias);
  const totalOblig = todasMaterias.filter((m) => m.tipo === "Obligatoria").reduce((a, m) => a + m.creditos, 0);
  const totalElect = todasMaterias.filter((m) => m.tipo !== "Obligatoria").reduce((a, m) => a + m.creditos, 0);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/dashboard/planes-estudio" className="hover:text-green-700">Planes de Estudio</Link>
        <span>›</span>
        <span className="text-gray-700 font-medium">{prog.nombre}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{prog.icono}</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${prog.badge}`}>{prog.nivel}</span>
                <span className="text-xs text-gray-400">{prog.plan} · Código SNIES: {prog.codigo}</span>
              </div>
              <h1 className="text-xl font-bold text-gray-800 mt-2">{prog.nombre}</h1>
              <p className="text-gray-500 text-sm mt-1">{prog.descripcion}</p>
            </div>
          </div>
          <a href={prog.url_drive} target="_blank" rel="noopener noreferrer"
            className="text-sm border border-green-700 text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 font-semibold flex-shrink-0">
            📂 Ver en Drive
          </a>
        </div>

        {/* Resumen créditos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          {[
            { label: "Total Créditos", valor: prog.creditos_totales, color: "text-gray-800" },
            { label: "Duración", valor: prog.duracion, color: "text-gray-800" },
            { label: "Obligatorios", valor: totalOblig, color: "text-blue-700" },
            { label: "Electivos", valor: totalElect, color: "text-purple-700" },
          ].map((item) => (
            <div key={item.label} className="text-center bg-gray-50 rounded-lg p-3">
              <p className={`text-2xl font-bold ${item.color}`}>{item.valor}</p>
              <p className="text-xs text-gray-400 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-3 mt-4">
          {Object.entries(tipoColor).map(([tipo, color]) => (
            <span key={tipo} className={`text-xs font-medium px-3 py-1 rounded-full border ${color}`}>
              {tipoIcono[tipo]} {tipo}
            </span>
          ))}
        </div>
      </div>

      {/* Malla */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800">📋 Malla Curricular</h2>
        {prog.semestres.map((sem) => (
          <div key={sem.numero} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-green-700 px-6 py-3 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm">Semestre {sem.numero}</h3>
              <span className="text-green-200 text-xs">{sem.creditos} créditos</span>
            </div>
            <div className="divide-y divide-gray-50">
              {sem.materias.map((mat, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <span className="text-lg">{tipoIcono[mat.tipo]}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{mat.nombre}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {mat.codigo !== "—" && <p className="text-xs text-gray-400">Código: {mat.codigo}</p>}
                        {mat.requisito && <p className="text-xs text-orange-500">Req: {mat.requisito}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${tipoColor[mat.tipo]}`}>{mat.tipo}</span>
                    <span className="text-sm font-bold text-gray-700 w-14 text-right">{mat.creditos} cr.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Asignaturas Electivas */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800">📙 Asignaturas Electivas Disponibles</h2>

        {prog.electivas_enfasis.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-orange-500 px-6 py-3">
              <h3 className="text-white font-bold text-sm">🎯 Electivas de Énfasis de Área</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {prog.electivas_enfasis.map((e) => (
                <div key={e.codigo} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{e.nombre}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Código: {e.codigo}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-700">{e.creditos} cr.</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-purple-600 px-6 py-3">
            <h3 className="text-white font-bold text-sm">📙 Electivas Generales ({prog.electivas.length} disponibles)</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {prog.electivas.map((e) => (
              <div key={e.codigo} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{e.nombre}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs text-gray-400">Código: {e.codigo}</p>
                    {e.requisito && <p className="text-xs text-orange-500">Req: {e.requisito}</p>}
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-700">{e.creditos} cr.</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Requisitos adicionales */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h2 className="text-base font-bold text-green-800 mb-3">📌 Requisitos Adicionales</h2>
        <ul className="space-y-2 text-sm text-green-700">
          <li className="flex items-center gap-2"><span>🌐</span> Certificación de idioma (inglés B2 o superior)</li>
          <li className="flex items-center gap-2"><span>📄</span> Trabajo de grado aprobado por jurados</li>
          <li className="flex items-center gap-2"><span>✅</span> Paz y salvo con todas las dependencias de la UIS</li>
          {prog.nivel === "Doctorado" && (
            <li className="flex items-center gap-2"><span>🔬</span> Publicación en revista indexada (mínimo Q2)</li>
          )}
        </ul>
      </div>

      <Link href="/dashboard/planes-estudio" className="inline-flex items-center gap-2 text-sm text-green-700 font-semibold hover:underline">
        ← Volver a todos los programas
      </Link>
    </div>
  );
}
