"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const FirmadorPDF = dynamic(() => import("@/components/FirmadorPDF"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Solicitud {
  id_solicitud: number;
  numero_radicado: string;
  asunto: string;
  fecha_creacion: string;
  nombre_estudiante: string;
  codigo_estudiante: string;
  grupo_investigacion?: string;
}

export default function FirmasGrupoDirector() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const [seleccionada, setSeleccionada] = useState<Solicitud | null>(null);
  const [pdfB64, setPdfB64]             = useState<string | null>(null);
  const [cargandoPdf, setCargandoPdf]   = useState(false);
  const [visorUrl, setVisorUrl]         = useState<string | null>(null);
  const [haPrevisuado, setHaPrevisuado] = useState(false);
  const [mostrarFirmador, setMostrarFirmador] = useState(false);
  const [pdfFirmado, setPdfFirmado]     = useState<string | null>(null);
  const visorRef                        = useRef<HTMLDivElement>(null);
  const prevVisorUrl                    = useRef<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) { router.push("/login"); return; }
    fetch(`${API_URL}/api/firmas/pendientes/dir_grupo`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => setSolicitudes(Array.isArray(data) ? data : []))
      .catch(() => setError("No se pudieron cargar las solicitudes"))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => () => { if (prevVisorUrl.current) URL.revokeObjectURL(prevVisorUrl.current); }, []);

  const cargarPDF = async (sol: Solicitud) => {
    setSeleccionada(sol); setPdfB64(null); setVisorUrl(null);
    setHaPrevisuado(false); setPdfFirmado(null); setCargandoPdf(true);
    try {
      const res = await fetch(`${API_URL}/api/firmas/pdf-solicitud/${sol.id_solicitud}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      setPdfB64((await res.json()).pdf_base64);
    } catch { setError("Error cargando el PDF"); }
    finally { setCargandoPdf(false); }
  };

  const mostrarEnVisor = (b64: string) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const blob  = new Blob([bytes], { type: "application/pdf" });
    if (prevVisorUrl.current) URL.revokeObjectURL(prevVisorUrl.current);
    const url = URL.createObjectURL(blob);
    prevVisorUrl.current = url;
    setVisorUrl(url); setHaPrevisuado(true);
    setTimeout(() => visorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  };

  const handleFirmado = async (b64: string) => {
    setPdfFirmado(b64); setMostrarFirmador(false); mostrarEnVisor(b64);
    if (!seleccionada) return;
    try {
      await fetch(`${API_URL}/api/firmas/guardar-firmado`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ id_solicitud: seleccionada.id_solicitud, pdf_base64: b64, rol_firmante: "dir_grupo" }),
      });
      setSolicitudes(prev => prev.filter(s => s.id_solicitud !== seleccionada.id_solicitud));
      setSeleccionada(null); setPdfB64(null); setVisorUrl(null); setPdfFirmado(null);
    } catch { setError("Error guardando la firma"); }
  };

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      {mostrarFirmador && pdfB64 && (
        <FirmadorPDF pdfBase64={pdfFirmado ?? pdfB64} soloVer={false}
          onFirmado={handleFirmado} onCerrar={() => setMostrarFirmador(false)} />
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">✍️ Aval como Director de Grupo</h1>
          <p className="text-gray-500 text-sm mt-1">
            Solicitudes de registro de tema que requieren su aval como Director del Grupo de Investigación
          </p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">⚠️ {error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {solicitudes.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-gray-600 font-medium">Sin solicitudes pendientes</p>
              </div>
            ) : solicitudes.map(sol => (
              <button key={sol.id_solicitud} onClick={() => cargarPDF(sol)}
                className={`w-full text-left bg-white rounded-xl border p-4 hover:shadow-md transition-all ${
                  seleccionada?.id_solicitud === sol.id_solicitud
                    ? "border-green-500 ring-2 ring-green-200" : "border-gray-200 hover:border-green-300"
                }`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📋</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800 truncate">{sol.asunto || "Registro de Tema"}</p>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">⏳ Aval pendiente</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">👤 {sol.nombre_estudiante} · {sol.codigo_estudiante}</p>
                    {sol.grupo_investigacion && <p className="text-xs text-blue-600 mt-0.5">🔬 {sol.grupo_investigacion}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">📅 {sol.fecha_creacion?.slice(0, 10)}</p>
                    <p className="text-xs font-mono text-gray-400">{sol.numero_radicado}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {!seleccionada ? (
              <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
                <p className="text-4xl mb-3">👈</p>
                <p className="text-gray-500 text-sm">Selecciona una solicitud para revisarla</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">📋 {seleccionada.asunto || "Registro de Tema"}</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>👤 <strong>{seleccionada.nombre_estudiante}</strong> · {seleccionada.codigo_estudiante}</p>
                    {seleccionada.grupo_investigacion && <p>🔬 Grupo: <strong>{seleccionada.grupo_investigacion}</strong></p>}
                    <p>📅 {seleccionada.fecha_creacion?.slice(0, 10)}</p>
                    <p>🔖 {seleccionada.numero_radicado}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => pdfB64 && mostrarEnVisor(pdfFirmado ?? pdfB64)}
                    disabled={cargandoPdf || !pdfB64}
                    className={`flex-1 flex items-center justify-center gap-2 bg-white border border-blue-300 text-blue-700 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-50 ${cargandoPdf ? "opacity-60 cursor-not-allowed" : ""}`}>
                    {cargandoPdf ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Cargando...</> : <><span>👁️</span> Previsualizar</>}
                  </button>
                  {haPrevisuado && (
                    <button onClick={() => setMostrarFirmador(true)} disabled={!pdfB64}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-800">
                      <span>✍️</span> {pdfFirmado ? "Editar firma" : "Avalar y firmar"}
                    </button>
                  )}
                </div>

                {pdfFirmado && (
                  <p className="text-xs text-green-700 text-center bg-green-50 rounded-lg py-2">
                    ✅ Avalado — enviado al Coordinador de Posgrados
                  </p>
                )}

                {visorUrl && (
                  <div ref={visorRef} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <span className="text-xs font-semibold text-gray-600">
                        {pdfFirmado ? "✍️ Documento avalado" : "📄 Vista previa"}
                      </span>
                      <button onClick={() => setVisorUrl(null)} className="text-xs text-gray-400 hover:text-red-500 font-bold">✕</button>
                    </div>
                    <iframe src={visorUrl} className="w-full" style={{ height: "600px" }} title="PDF solicitud" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
