"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Documento {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  archivo_url: string;
  nombre_archivo: string;
  tamanio_kb: number;
  created_at: string;
  subido_por: string;
}

const iconoPorExt: Record<string, string> = {
  pdf: "📄", docx: "📝", doc: "📝", xlsx: "📊", xls: "📊",
};

function getIcono(nombre: string) { return iconoPorExt[nombre.split(".").pop()?.toLowerCase() ?? ""] ?? "📎"; }
function getExt(nombre: string)   { return (nombre.split(".").pop() ?? "").toUpperCase(); }

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [busqueda, setBusqueda]     = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/documentos/`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setDocumentos(Array.isArray(data) ? data : []))
      .catch(() => setError("No se pudieron cargar los documentos"))
      .finally(() => setCargando(false));
  }, []);

  const filtrados  = documentos.filter(d =>
    `${d.nombre} ${d.categoria} ${d.descripcion}`.toLowerCase().includes(busqueda.toLowerCase())
  );
  const categorias = [...new Set(filtrados.map(d => d.categoria))].sort();

  if (cargando) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📁 Documentos y Formatos</h1>
        <p className="text-gray-500 mt-1">Descarga los formatos y plantillas oficiales para tus solicitudes</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">⚠️ {error}</div>}

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input type="text" placeholder="Buscar por nombre o categoría..." value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      {documentos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-5xl mb-4">📂</p>
          <p className="text-gray-600 font-medium">No hay documentos disponibles aún</p>
          <p className="text-gray-400 text-sm mt-1">El coordinador publicará los formatos próximamente</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
          No se encontraron resultados para "{busqueda}"
        </div>
      ) : (
        <div className="space-y-6">
          {categorias.map(cat => (
            <div key={cat}>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">{cat}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtrados.filter(d => d.categoria === cat).map(doc => (
                  <div key={doc.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-green-300 transition-all flex items-start gap-4">
                    <div className="text-3xl flex-shrink-0">{getIcono(doc.nombre_archivo)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{doc.nombre}</p>
                      {doc.descripcion && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{doc.descripcion}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">{getExt(doc.nombre_archivo)}</span>
                        {doc.tamanio_kb > 0 && <span className="text-xs text-gray-400">{doc.tamanio_kb} KB</span>}
                        <span className="text-xs text-gray-400">{doc.created_at}</span>
                      </div>
                    </div>
                    <a href={`${API_URL}${doc.archivo_url}`} download
                      className="flex-shrink-0 bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-800 font-semibold whitespace-nowrap">
                      ⬇️ Descargar
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
