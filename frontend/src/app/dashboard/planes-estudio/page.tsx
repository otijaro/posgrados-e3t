"use client";

import { useEffect, useState } from "react";
import { getMiPerfil } from "@/lib/api";

// ── Datos de programas con malla curricular ───────────────────────────────────

const programas = [
  {
    keywords: ["maestría", "electrónica"],
    nombre: "Maestría en Ingeniería Electrónica",
    codigo: "254", plan: "Plan 3", nivel: "Maestría", duracion: "4 semestres", creditos_totales: 56,
    icono: "⚡", color: "border-blue-500", badge: "bg-blue-100 text-blue-800", bg: "bg-blue-50",
    url_drive: "https://drive.google.com/drive/folders/17bFtb-Wq5503QRDlXAyXI57ndbrh494A",
    semestres: [
      { numero: 1, materias: [
        { nombre: "Matemáticas Avanzadas para Ingeniería", creditos: 3, tipo: "Obligatoria" },
        { nombre: "Metodología de Investigación", creditos: 2, tipo: "Obligatoria" },
        { nombre: "Electiva de Profundización I", creditos: 3, tipo: "Electiva" },
        { nombre: "Investigación I", creditos: 6, tipo: "Investigación" },
      ]},
      { numero: 2, materias: [
        { nombre: "Seminario de Investigación I", creditos: 2, tipo: "Obligatoria" },
        { nombre: "Electiva de Profundización II", creditos: 3, tipo: "Electiva" },
        { nombre: "Electiva de Profundización III", creditos: 3, tipo: "Electiva" },
        { nombre: "Investigación II", creditos: 6, tipo: "Investigación" },
      ]},
      { numero: 3, materias: [
        { nombre: "Seminario de Investigación II", creditos: 2, tipo: "Obligatoria" },
        { nombre: "Electiva de Profundización IV", creditos: 3, tipo: "Electiva" },
        { nombre: "Investigación III", creditos: 10, tipo: "Investigación" },
      ]},
      { numero: 4, materias: [
        { nombre: "Trabajo Final de Investigación", creditos: 13, tipo: "Investigación" },
      ]},
    ],
  },
  {
    keywords: ["maestría", "eléctrica"],
    nombre: "Maestría en Ingeniería Eléctrica",
    codigo: "270", plan: "Plan 4", nivel: "Maestría", duracion: "4 semestres", creditos_totales: 52,
    icono: "🔌", color: "border-yellow-500", badge: "bg-yellow-100 text-yellow-800", bg: "bg-yellow-50",
    url_drive: "https://drive.google.com/drive/folders/1e2wKH6wTNy5UOI1AtEZ09XlqyqCOh1Kz",
    semestres: [
      { numero: 1, materias: [
        { nombre: "Matemáticas Avanzadas para Ingeniería", creditos: 3, tipo: "Obligatoria" },
        { nombre: "Metodología de Investigación", creditos: 2, tipo: "Obligatoria" },
        { nombre: "Electiva de Profundización I", creditos: 3, tipo: "Electiva" },
        { nombre: "Investigación I", creditos: 6, tipo: "Investigación" },
      ]},
      { numero: 2, materias: [
        { nombre: "Seminario de Investigación I", creditos: 2, tipo: "Obligatoria" },
        { nombre: "Electiva de Profundización II", creditos: 3, tipo: "Electiva" },
        { nombre: "Electiva de Profundización III", creditos: 3, tipo: "Electiva" },
        { nombre: "Investigación II", creditos: 6, tipo: "Investigación" },
      ]},
      { numero: 3, materias: [
        { nombre: "Seminario de Investigación II", creditos: 2, tipo: "Obligatoria" },
        { nombre: "Electiva de Profundización IV", creditos: 3, tipo: "Electiva" },
        { nombre: "Investigación III", creditos: 9, tipo: "Investigación" },
      ]},
      { numero: 4, materias: [
        { nombre: "Trabajo Final de Investigación", creditos: 13, tipo: "Investigación" },
      ]},
    ],
  },
  {
    keywords: ["telecomunicaciones"],
    nombre: "Maestría en Ingeniería de Telecomunicaciones",
    codigo: "305", plan: "Plan 3", nivel: "Maestría", duracion: "4 semestres", creditos_totales: 52,
    icono: "📡", color: "border-purple-500", badge: "bg-purple-100 text-purple-800", bg: "bg-purple-50",
    url_drive: "https://drive.google.com/drive/folders/1KvPXb1M1GmoLfpP0_N4SjtmVt26gZVpP",
    semestres: [
      { numero: 1, materias: [
        { nombre: "Matemáticas Avanzadas para Ingeniería", creditos: 3, tipo: "Obligatoria" },
        { nombre: "Metodología de Investigación", creditos: 2, tipo: "Obligatoria" },
        { nombre: "Electiva de Profundización I", creditos: 3, tipo: "Electiva" },
        { nombre: "Investigación I", creditos: 6, tipo: "Investigación" },
      ]},
      { numero: 2, materias: [
        { nombre: "Seminario de Investigación I", creditos: 2, tipo: "Obligatoria" },
        { nombre: "Electiva de Profundización II", creditos: 3, tipo: "Electiva" },
        { nombre: "Electiva de Profundización III", creditos: 3, tipo: "Electiva" },
        { nombre: "Investigación II", creditos: 6, tipo: "Investigación" },
      ]},
      { numero: 3, materias: [
        { nombre: "Seminario de Investigación II", creditos: 2, tipo: "Obligatoria" },
        { nombre: "Electiva de Profundización IV", creditos: 3, tipo: "Electiva" },
        { nombre: "Investigación III", creditos: 9, tipo: "Investigación" },
      ]},
      { numero: 4, materias: [
        { nombre: "Trabajo Final de Investigación", creditos: 13, tipo: "Investigación" },
      ]},
    ],
  },
  {
    keywords: ["doctorado", "eléctrica"],
    nombre: "Doctorado en Ingeniería — Área Ingeniería Eléctrica",
    codigo: "308", plan: "Plan 3", nivel: "Doctorado", duracion: "8 semestres", creditos_totales: 96,
    icono: "🔬", color: "border-green-600", badge: "bg-green-100 text-green-800", bg: "bg-green-50",
    url_drive: "https://drive.google.com/drive/folders/18AomHosLXVZnEwtus-HjbrFjzVo1BOaS",
    semestres: [
      { numero: 1, materias: [
        { nombre: "Seminario Doctoral I", creditos: 2, tipo: "Obligatoria" },
        { nombre: "Electiva Doctoral I", creditos: 3, tipo: "Electiva" },
        { nombre: "Electiva Doctoral II", creditos: 3, tipo: "Electiva" },
        { nombre: "Investigación Doctoral I", creditos: 4, tipo: "Investigación" },
      ]},
      { numero: 2, materias: [
        { nombre: "Seminario Doctoral II", creditos: 2, tipo: "Obligatoria" },
        { nombre: "Electiva Doctoral III", creditos: 3, tipo: "Electiva" },
        { nombre: "Investigación Doctoral II", creditos: 7, tipo: "Investigación" },
      ]},
      { numero: 3, materias: [
        { nombre: "Examen de Candidatura", creditos: 4, tipo: "Obligatoria" },
        { nombre: "Investigación Doctoral III", creditos: 8, tipo: "Investigación" },
      ]},
      { numero: 4, materias: [
        { nombre: "Seminario Doctoral III", creditos: 2, tipo: "Obligatoria" },
        { nombre: "Investigación Doctoral IV", creditos: 10, tipo: "Investigación" },
      ]},
      { numero: 5, materias: [
        { nombre: "Investigación Doctoral V", creditos: 12, tipo: "Investigación" },
      ]},
      { numero: 6, materias: [
        { nombre: "Investigación Doctoral VI", creditos: 12, tipo: "Investigación" },
      ]},
      { numero: 7, materias: [
        { nombre: "Investigación Doctoral VII", creditos: 12, tipo: "Investigación" },
      ]},
      { numero: 8, materias: [
        { nombre: "Tesis Doctoral", creditos: 15, tipo: "Investigación" },
      ]},
    ],
  },
  {
    keywords: ["doctorado", "electrónica"],
    nombre: "Doctorado en Ingeniería — Área Ingeniería Electrónica",
    codigo: "309", plan: "Plan 3", nivel: "Doctorado", duracion: "8 semestres", creditos_totales: 96,
    icono: "🔬", color: "border-blue-600", badge: "bg-blue-100 text-blue-800", bg: "bg-blue-50",
    url_drive: "https://drive.google.com/drive/folders/1MiYU0v6ygwoVOZY2bQWIo8blRQY69d7r",
    semestres: [
      { numero: 1, materias: [
        { nombre: "Seminario Doctoral I", creditos: 2, tipo: "Obligatoria" },
        { nombre: "Electiva Doctoral I", creditos: 3, tipo: "Electiva" },
        { nombre: "Electiva Doctoral II", creditos: 3, tipo: "Electiva" },
        { nombre: "Investigación Doctoral I", creditos: 4, tipo: "Investigación" },
      ]},
      { numero: 2, materias: [
        { nombre: "Seminario Doctoral II", creditos: 2, tipo: "Obligatoria" },
        { nombre: "Electiva Doctoral III", creditos: 3, tipo: "Electiva" },
        { nombre: "Investigación Doctoral II", creditos: 7, tipo: "Investigación" },
      ]},
      { numero: 3, materias: [
        { nombre: "Examen de Candidatura", creditos: 4, tipo: "Obligatoria" },
        { nombre: "Investigación Doctoral III", creditos: 8, tipo: "Investigación" },
      ]},
      { numero: 4, materias: [
        { nombre: "Seminario Doctoral III", creditos: 2, tipo: "Obligatoria" },
        { nombre: "Investigación Doctoral IV", creditos: 10, tipo: "Investigación" },
      ]},
      { numero: 5, materias: [
        { nombre: "Investigación Doctoral V", creditos: 12, tipo: "Investigación" },
      ]},
      { numero: 6, materias: [
        { nombre: "Investigación Doctoral VI", creditos: 12, tipo: "Investigación" },
      ]},
      { numero: 7, materias: [
        { nombre: "Investigación Doctoral VII", creditos: 12, tipo: "Investigación" },
      ]},
      { numero: 8, materias: [
        { nombre: "Tesis Doctoral", creditos: 15, tipo: "Investigación" },
      ]},
    ],
  },
  {
    keywords: ["gestión", "desarrollo tecnológico"],
    nombre: "Doctorado en Ingeniería — Área Gestión y Desarrollo Tecnológico",
    codigo: "310", plan: "Plan 3", nivel: "Doctorado", duracion: "8 semestres", creditos_totales: 96,
    icono: "🚀", color: "border-orange-600", badge: "bg-orange-100 text-orange-800", bg: "bg-orange-50",
    url_drive: "https://drive.google.com/drive/folders/1xgU4Qn2sI_iGciu4nZZhSRfS789UVTWY",
    semestres: [
      { numero: 1, materias: [
        { nombre: "Seminario Doctoral I", creditos: 2, tipo: "Obligatoria" },
        { nombre: "Electiva Doctoral I", creditos: 3, tipo: "Electiva" },
        { nombre: "Electiva Doctoral II", creditos: 3, tipo: "Electiva" },
        { nombre: "Investigación Doctoral I", creditos: 4, tipo: "Investigación" },
      ]},
      { numero: 2, materias: [
        { nombre: "Seminario Doctoral II", creditos: 2, tipo: "Obligatoria" },
        { nombre: "Electiva Doctoral III", creditos: 3, tipo: "Electiva" },
        { nombre: "Investigación Doctoral II", creditos: 7, tipo: "Investigación" },
      ]},
      { numero: 3, materias: [
        { nombre: "Examen de Candidatura", creditos: 4, tipo: "Obligatoria" },
        { nombre: "Investigación Doctoral III", creditos: 8, tipo: "Investigación" },
      ]},
      { numero: 4, materias: [
        { nombre: "Seminario Doctoral III", creditos: 2, tipo: "Obligatoria" },
        { nombre: "Investigación Doctoral IV", creditos: 10, tipo: "Investigación" },
      ]},
      { numero: 5, materias: [{ nombre: "Investigación Doctoral V",   creditos: 12, tipo: "Investigación" }]},
      { numero: 6, materias: [{ nombre: "Investigación Doctoral VI",  creditos: 12, tipo: "Investigación" }]},
      { numero: 7, materias: [{ nombre: "Investigación Doctoral VII", creditos: 12, tipo: "Investigación" }]},
      { numero: 8, materias: [{ nombre: "Tesis Doctoral",             creditos: 15, tipo: "Investigación" }]},
    ],
  },
];

// Matching por keywords — requiere que TODAS las keywords estén en el nombre del programa (en minúsculas)
function matchPrograma(nombreBD: string) {
  const lower = nombreBD.toLowerCase();
  return programas.find((p) =>
    p.keywords.every((kw) => lower.includes(kw))
  ) ?? null;
}

const tipoBadge: Record<string, string> = {
  Obligatoria:  "bg-green-100 text-green-700",
  Electiva:     "bg-blue-100 text-blue-700",
  Investigación:"bg-purple-100 text-purple-700",
};

export default function PlanesEstudioDashboard() {
  const [programaBD, setProgramaBD] = useState<string | null>(null);
  const [cargando, setCargando]     = useState(true);

  useEffect(() => {
    getMiPerfil()
      .then((p) => setProgramaBD(p.programa))
      .catch(() => setProgramaBD(null))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Cargando plan de estudios...</div>;
  }

  const prog = programaBD ? matchPrograma(programaBD) : null;

  if (!prog) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">📚 Mi Plan de Estudios</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-700 text-sm">
          ⚠️ No se encontró plan de estudios para: <span className="font-semibold">{programaBD}</span>. Contacta a la coordinación.
        </div>
      </div>
    );
  }

  const creditosTotalesReal = prog.semestres.reduce(
    (sum, s) => sum + s.materias.reduce((ss, m) => ss + m.creditos, 0), 0
  );

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📚 Mi Plan de Estudios</h1>
        <p className="text-gray-500 mt-1">Malla curricular de tu programa de posgrado.</p>
      </div>

      {/* Info del programa */}
      <div className={`rounded-xl border-l-4 ${prog.color} ${prog.bg} p-6`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{prog.icono}</span>
            <div>
              <h2 className="text-lg font-bold text-gray-800 leading-snug">{prog.nombre}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{prog.plan} · Código SNIES: {prog.codigo}</p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full h-fit ${prog.badge}`}>{prog.nivel}</span>
        </div>
        <div className="flex gap-6 mt-4 text-sm text-gray-600">
          <span>⏱ {prog.duracion}</span>
          <span>📖 {creditosTotalesReal} créditos totales</span>
        </div>
        <div className="mt-4">
          <a
            href={prog.url_drive}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm border border-green-700 text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors font-semibold"
          >
            📂 Ver documentos en Drive
          </a>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(tipoBadge).map(([tipo, clase]) => (
          <span key={tipo} className={`px-3 py-1 rounded-full font-medium ${clase}`}>{tipo}</span>
        ))}
      </div>

      {/* Semestres */}
      <div className="space-y-4">
        {prog.semestres.map((sem) => {
          const creditosSem = sem.materias.reduce((s, m) => s + m.creditos, 0);
          return (
            <div key={sem.numero} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-green-700 text-white">
                <h3 className="font-semibold text-sm">Semestre {sem.numero}</h3>
                <span className="text-xs text-green-200">{creditosSem} créditos</span>
              </div>
              <div className="divide-y divide-gray-50">
                {sem.materias.map((mat, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tipoBadge[mat.tipo]}`}>
                        {mat.tipo}
                      </span>
                      <span className="text-sm text-gray-800">{mat.nombre}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-500 ml-4 shrink-0">
                      {mat.creditos} cr.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-gray-400 text-center">
        ¿Quieres ver los planes de otros programas?{" "}
        <a href="/planes-estudio" target="_blank" className="text-green-700 font-semibold hover:underline">
          Ver todos los programas →
        </a>
      </p>
    </div>
  );
}
