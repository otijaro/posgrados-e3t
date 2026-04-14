"use client";

import { useState } from "react";
import Link from "next/link";

const programas = [
  {
    id: "maestria-electronica",
    nombre: "Maestría en Ingeniería Electrónica",
    codigo: "254",
    plan: "Plan 3",
    nivel: "Maestría",
    duracion: "4 semestres",
    creditos_totales: 56,
    descripcion: "Forma investigadores en modelado, simulación y áreas avanzadas de la ingeniería electrónica con énfasis en investigación.",
    icono: "⚡",
    color: "border-blue-500",
    badge: "bg-blue-100 text-blue-800",
    bg: "bg-blue-50",
    url_drive: "https://drive.google.com/drive/folders/17bFtb-Wq5503QRDlXAyXI57ndbrh494A",
  },
  {
    id: "maestria-electrica",
    nombre: "Maestría en Ingeniería Eléctrica",
    codigo: "270",
    plan: "Plan 4",
    nivel: "Maestría",
    duracion: "4 semestres",
    creditos_totales: 52,
    descripcion: "Profundiza en sistemas de potencia, energías renovables, mercados de energía y calidad de la energía eléctrica.",
    icono: "🔌",
    color: "border-yellow-500",
    badge: "bg-yellow-100 text-yellow-800",
    bg: "bg-yellow-50",
    url_drive: "https://drive.google.com/drive/folders/1e2wKH6wTNy5UOI1AtEZ09XlqyqCOh1Kz",
  },
  {
    id: "maestria-telecomunicaciones",
    nombre: "Maestría en Ingeniería de Telecomunicaciones",
    codigo: "305",
    plan: "Plan 3",
    nivel: "Maestría",
    duracion: "4 semestres",
    creditos_totales: 52,
    descripcion: "Aborda comunicaciones móviles, procesamiento de señales, gestión del espectro y redes de telecomunicaciones.",
    icono: "📡",
    color: "border-purple-500",
    badge: "bg-purple-100 text-purple-800",
    bg: "bg-purple-50",
    url_drive: "https://drive.google.com/drive/folders/1KvPXb1M1GmoLfpP0_N4SjtmVt26gZVpP",
  },
  {
    id: "doctorado-electrica",
    nombre: "Doctorado en Ingeniería — Área Ingeniería Eléctrica",
    codigo: "308",
    plan: "Plan 3",
    nivel: "Doctorado",
    duracion: "8 semestres",
    creditos_totales: 96,
    descripcion: "Forma doctores con capacidad para generar conocimiento original en sistemas de potencia, energía eléctrica y áreas afines.",
    icono: "🔬",
    color: "border-green-600",
    badge: "bg-green-100 text-green-800",
    bg: "bg-green-50",
    url_drive: "https://drive.google.com/drive/folders/18AomHosLXVZnEwtus-HjbrFjzVo1BOaS",
  },
  {
    id: "doctorado-electronica",
    nombre: "Doctorado en Ingeniería — Área Ingeniería Electrónica",
    codigo: "309",
    plan: "Plan 3",
    nivel: "Doctorado",
    duracion: "8 semestres",
    creditos_totales: 96,
    descripcion: "Forma doctores con capacidad para generar conocimiento original en electrónica, control, procesamiento de señales y áreas afines.",
    icono: "🔬",
    color: "border-blue-600",
    badge: "bg-blue-100 text-blue-800",
    bg: "bg-blue-50",
    url_drive: "https://drive.google.com/drive/folders/1MiYU0v6ygwoVOZY2bQWIo8blRQY69d7r",
  },
  {
    id: "doctorado-gestion",
    nombre: "Doctorado en Ingeniería — Área Gestión y Desarrollo Tecnológico",
    codigo: "310",
    plan: "Plan 3",
    nivel: "Doctorado",
    duracion: "8 semestres",
    creditos_totales: 96,
    descripcion: "Forma doctores en gestión de la innovación, prospectiva tecnológica, transferencia de tecnología y creación de empresas de base tecnológica.",
    icono: "🚀",
    color: "border-orange-600",
    badge: "bg-orange-100 text-orange-800",
    bg: "bg-orange-50",
    url_drive: "https://drive.google.com/drive/folders/1xgU4Qn2sI_iGciu4nZZhSRfS789UVTWY",
  },
];

const niveles = ["Todos", "Maestría", "Doctorado"];

export default function PlanesEstudioPage() {
  const [nivelActivo, setNivelActivo] = useState("Todos");

  const filtrados =
    nivelActivo === "Todos"
      ? programas
      : programas.filter((p) => p.nivel === nivelActivo);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📚 Planes de Estudio</h1>
        <p className="text-gray-500 mt-1">
          Consulta la malla curricular y la información académica de cada programa de posgrado.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {niveles.map((nivel) => (
          <button
            key={nivel}
            onClick={() => setNivelActivo(nivel)}
            className={`text-sm px-4 py-1.5 rounded-full border font-medium transition-colors ${
              nivelActivo === nivel
                ? "bg-green-700 text-white border-green-700"
                : "bg-white text-gray-600 border-gray-200 hover:bg-green-700 hover:text-white hover:border-green-700"
            }`}
          >
            {nivel}
            {nivel !== "Todos" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({programas.filter((p) => p.nivel === nivel).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtrados.map((prog) => (
          <div key={prog.id} className={`bg-white rounded-xl shadow-sm border-l-4 overflow-hidden hover:shadow-md transition-shadow flex flex-col ${prog.color}`}>
            <div className={`p-5 ${prog.bg}`}>
              <div className="flex items-start justify-between gap-3">
                <span className="text-4xl">{prog.icono}</span>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${prog.badge}`}>{prog.nivel}</span>
                  <span className="text-xs text-gray-400">{prog.plan} · Cód. {prog.codigo}</span>
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-800 mt-3 leading-snug">{prog.nombre}</h3>
            </div>

            <div className="px-5 py-4 flex-1">
              <p className="text-sm text-gray-600 leading-relaxed">{prog.descripcion}</p>
            </div>

            <div className="px-5 pb-4 grid grid-cols-2 gap-2">
              {[
                { label: "Total créditos", valor: prog.creditos_totales },
                { label: "Duración", valor: prog.duracion },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-gray-800">{item.valor}</p>
                  <p className="text-xs text-gray-400">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="px-5 pb-5 flex gap-2">
              <Link
                href={`/dashboard/planes-estudio/${prog.id}`}
                className="flex-1 text-center text-sm bg-green-700 text-white py-2.5 rounded-lg hover:bg-green-800 transition-colors font-semibold"
              >
                Ver malla →
              </Link>
              <a
                href={prog.url_drive}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-sm border border-green-700 text-green-700 py-2.5 rounded-lg hover:bg-green-50 transition-colors font-semibold"
              >
                📂 Drive
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
