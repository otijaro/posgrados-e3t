"use client";

import { useEffect, useState, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authHeaders() {
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

const CATEGORIAS = [
  "Registro de Tema",
  "Evaluación",
  "Cambio de Director",
  "Cambio de Título",
  "Prórroga",
  "General",
];

const iconoPorExt: Record<string, string> = {
  pdf: "📄", docx: "📝", doc: "📝", xlsx: "📊", xls: "📊",
};
function getIcono(nombre: string) { return iconoPorExt[nombre.split(".").pop()?.toLowerCase() ?? ""] ?? "📎"; }
function getExt(nombre: string)   { return (nombre.split(".").pop() ?? "").toUpperCase(); }

export default function GestionDocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [exito, setExito]           = useState<string | null>(null);

  // Formulario subida
  const [nombre, setNombre]         = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria]   = useState("General");
  const [categoriaCustom, setCategoriaCustom] = useState("");
  const [archivo, setArchivo]       = useState<File | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [subiendo, setSubiendo]     = useState(false);
  const fileRef                     = useRef<HTMLInputElement>(null);

  const cargarDocumentos = () => {
    setCargando(true);
    fetch(`${API_URL}/api/documentos/`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setDocumentos(Array.isArray(data) ? data : []))
      .catch(() => setError("Error cargando documentos"))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargarDocumentos(); }, []);

  const handleArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    setArchivo(f);
    setNombreArchivo(f.name);
    if (!nombre) setNombre(f.name.replace(/\.[^.]+$/, "").replace(/_/g, " "));
  };

  const handleSubir = async () => {
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }
    if (!archivo)       { setError("Selecciona un archivo"); return; }

    setSubiendo(true); setError(null); setExito(null);
    try {
      const form = new FormData();
      form.append("nombre",      nombre.trim());
      form.append("descripcion", descripcion.trim());
      form.append("categoria",   categoria === "Otra" ? categoriaCustom.trim() || "General" : categoria);
      form.append("archivo",     archivo);

      const res = await fetch(`${API_URL}/api/documentos/`, {
        method: "POST",
        headers: authHeaders(),
        body: form,
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Error al subir");

      setExito("Documento subido correctamente");
      setNombre(""); setDescripcion(""); setCategoria("General");
      setArchivo(null); setNombreArchivo(null);
      if (fileRef.current) fileRef.current.value = "";
      cargarDocumentos();
    } catch (e: any) {
      setError(e.message || "Error al subir el documento");
    } finally {
      setSubiendo(false);
    }
  };

  const handleEliminar = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/documentos/${id}`, {
        method: "DELETE", headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Error al eliminar");
      setExito("Documento eliminado");
      cargarDocumentos();
    } catch {
      setError("Error al eliminar el documento");
    }
  };

  const categoriasPorGrupo = [...new Set(documentos.map(d => d.categoria))].sort();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📁 Gestión de Documentos</h1>
        <p className="text-gray-500 mt-1">Administra los formatos y plantillas disponibles para los estudiantes</p>
      </div>

      {error  && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">⚠️ {error}</div>}
      {exito  && <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">✅ {exito}</div>}

      {/* Formulario de subida */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-700">➕ Subir nuevo documento</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Archivo <span className="text-red-500">*</span>
            </label>
            <div className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
              nombreArchivo ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-green-400 hover:bg-green-50"
            }`}>
              {nombreArchivo ? (
                <div className="space-y-1">
                  <p className="text-2xl">{getIcono(nombreArchivo)}</p>
                  <p className="text-sm font-semibold text-green-700">{nombreArchivo}</p>
                  <button onClick={() => { setArchivo(null); setNombreArchivo(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="text-xs text-red-400 hover:underline">Quitar</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">PDF, Word o Excel</p>
                  <label className="cursor-pointer inline-block bg-green-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-800 font-semibold">
                    Seleccionar archivo
                    <input type="file" ref={fileRef} accept=".pdf,.docx,.doc,.xlsx,.xls" onChange={handleArchivo} className="hidden" />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del documento <span className="text-red-500">*</span>
            </label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Formulario de Inscripción de Tema"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="Otra">Otra...</option>
            </select>
            {categoria === "Otra" && (
              <input type="text" value={categoriaCustom} onChange={e => setCategoriaCustom(e.target.value)}
                placeholder="Nombre de la categoría"
                className="mt-2 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)}
              placeholder="Breve descripción del documento (opcional)"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSubir} disabled={subiendo}
            className={`flex items-center gap-2 bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-green-800 transition-colors ${subiendo ? "opacity-60 cursor-not-allowed" : ""}`}>
            {subiendo
              ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Subiendo...</>
              : "⬆️ Subir documento"}
          </button>
        </div>
      </div>

      {/* Lista de documentos */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-700 mb-4">
          📋 Documentos publicados <span className="text-gray-400 font-normal text-sm">({documentos.length})</span>
        </h2>

        {cargando ? (
          <p className="text-gray-400 text-sm text-center py-8">Cargando...</p>
        ) : documentos.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">📂</p>
            <p className="text-gray-400 text-sm">No hay documentos publicados aún</p>
          </div>
        ) : (
          <div className="space-y-6">
            {categoriasPorGrupo.map(cat => (
              <div key={cat}>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{cat}</h3>
                <div className="space-y-2">
                  {documentos.filter(d => d.categoria === cat).map(doc => (
                    <div key={doc.id}
                      className="flex items-center gap-4 border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                      <span className="text-2xl flex-shrink-0">{getIcono(doc.nombre_archivo)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{doc.nombre}</p>
                        {doc.descripcion && <p className="text-xs text-gray-500 mt-0.5">{doc.descripcion}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">{getExt(doc.nombre_archivo)}</span>
                          {doc.tamanio_kb > 0 && <span className="text-xs text-gray-400">{doc.tamanio_kb} KB</span>}
                          <span className="text-xs text-gray-400">{doc.created_at}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a href={`${API_URL}${doc.archivo_url}`} download
                          className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-lg hover:bg-blue-100 font-semibold">
                          ⬇️ Ver
                        </a>
                        <button onClick={() => handleEliminar(doc.id, doc.nombre)}
                          className="bg-red-50 text-red-600 text-xs px-3 py-1.5 rounded-lg hover:bg-red-100 font-semibold">
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
