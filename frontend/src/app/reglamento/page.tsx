"use client";

import PublicNav from "@/components/layout/PublicNav";
import Link from "next/link";

const NOTEBOOKLM_URL = "https://notebooklm.google.com/notebook/52adb20c-7579-4086-88ef-ab38f2626018";
const PDF_URL = "/reglamento/Acuerdo075ReglamentoGeneralPosgrado.pdf";

export default function ReglamentoPublicPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <Link href="/" className="hover:text-green-700">Inicio</Link>
            <span>›</span>
            <span className="text-gray-700 font-medium">Reglamento</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">📜 Reglamento General de Posgrados</h1>
          <p className="text-gray-500 text-sm mt-1">Acuerdo 075 — Universidad Industrial de Santander</p>
        </div>

        {/* Banner NotebookLM */}
        <a href={NOTEBOOKLM_URL} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl p-6 shadow-md transition-all hover:shadow-lg group">
          <div className="text-5xl flex-shrink-0">🤖</div>
          <div className="flex-1">
            <p className="text-lg font-bold">Pregúntale al Asistente IA</p>
            <p className="text-blue-100 text-sm mt-1">
              Haz preguntas sobre el reglamento en lenguaje natural. El asistente responde basándose en el Acuerdo 075.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Powered by NotebookLM
              </span>
              <span className="text-blue-200 text-xs group-hover:translate-x-1 transition-transform">
                Abrir chat →
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 text-blue-200 text-3xl group-hover:translate-x-1 transition-transform">›</div>
        </a>

        {/* Visor PDF */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              📄 Acuerdo 075 — Reglamento General de Posgrados UIS
            </span>
            <a href={PDF_URL} download="Acuerdo075_Reglamento_Posgrados_UIS.pdf"
              className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 font-semibold">
              ⬇️ Descargar
            </a>
          </div>
          <iframe
            src={PDF_URL}
            className="w-full border-0"
            style={{ height: "75vh" }}
            title="Reglamento General de Posgrados"
          />
        </div>
      </div>
    </div>
  );
}
