"use client";

import { useEffect, useState, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const NOTEBOOKLM_URL = "https://notebooklm.google.com/notebook/52adb20c-7579-4086-88ef-ab38f2626018";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ReglamentoPage() {
  const [pdfUrl, setPdfUrl]           = useState<string | null>(null);
  const [cargandoPdf, setCargandoPdf] = useState(true);
  const prevPdfUrl                    = useRef<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/reglamento/pdf`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const bytes = Uint8Array.from(atob(data.pdf_base64), c => c.charCodeAt(0));
        const blob  = new Blob([bytes], { type: "application/pdf" });
        const url   = URL.createObjectURL(blob);
        prevPdfUrl.current = url;
        setPdfUrl(url);
      })
      .catch(() => {})
      .finally(() => setCargandoPdf(false));

    return () => { if (prevPdfUrl.current) URL.revokeObjectURL(prevPdfUrl.current); };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📜 Reglamento General de Posgrados</h1>
        <p className="text-gray-500 text-sm mt-1">Acuerdo 075 — Universidad Industrial de Santander</p>
      </div>

      {/* Banner NotebookLM */}
      <a
        href={NOTEBOOKLM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl p-6 shadow-md transition-all hover:shadow-lg group"
      >
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
        <div className="flex-shrink-0 text-blue-200 text-3xl group-hover:translate-x-1 transition-transform">
          ›
        </div>
      </a>

      {/* Visor PDF */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            📄 Acuerdo 075 — Reglamento General de Posgrados UIS
          </span>
          {pdfUrl && (
            <a href={pdfUrl} download="Acuerdo075_Reglamento_Posgrados_UIS.pdf"
              className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 font-semibold">
              ⬇️ Descargar
            </a>
          )}
        </div>

        {cargandoPdf ? (
          <div className="h-[70vh] flex items-center justify-center text-gray-400">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm">Cargando reglamento...</p>
            </div>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full border-0"
            style={{ height: "70vh" }}
            title="Reglamento General de Posgrados"
          />
        ) : (
          <div className="h-[70vh] flex items-center justify-center text-gray-400 text-sm">
            No se pudo cargar el PDF
          </div>
        )}
      </div>
    </div>
  );
}
