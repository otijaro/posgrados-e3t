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
  id: number;
  numero_radicado: string;
  asunto: string;
  fecha_envio: string;
  solicitante: string;
  tipo_solicitud: string;
  estado: string;
  // campos del endpoint de firmas
  id_solicitud?: number;
  nombre_estudiante?: string;
  codigo_estudiante?: string;
}

// Modal de rechazo
function ModalRechazo({ onConfirmar, onCancelar }: { onConfirmar: (motivo: string) => void; onCancelar: () => void }) {
  const [motivo, setMotivo] = useState("");
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">❌ Rechazar solicitud</h2>
        <p className="text-sm text-gray-500">Indique el motivo del rechazo. Esta información será enviada al estudiante.</p>
        <textarea
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          rows={4}
          placeholder="Explique por qué se rechaza la solicitud..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          autoFocus
        />
        <div className="flex gap-3 pt-2">
          <button onClick={onCancelar}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={() => { if (motivo.trim()) onConfirmar(motivo.trim()); }}
            disabled={!motivo.trim()}
            className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
            Confirmar rechazo
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SolicitudesPendientesDirector() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [exito, setExito]             = useState<string | null>(null);

  const [seleccionada, setSeleccionada]       = useState<Solicitud | null>(null);
  const [pdfB64, setPdfB64]                   = useState<string | null>(null);
  const [cargandoPdf, setCargandoPdf]         = useState(false);
  const [visorUrl, setVisorUrl]               = useState<string | null>(null);
  const [mostrarFirmador, setMostrarFirmador] = useState(false);
  const [pdfFirmado, setPdfFirmado]           = useState<string | null>(null);
  const [procesando, setProcesando]           = useState(false);
  const [mostrarModalRechazo, setMostrarModalRechazo] = useState(false);
  const visorRef     = useRef<HTMLDivElement>(null);
  const prevVisorUrl = useRef<string | null>(null);

  const cargarSolicitudes = () => {
    setCargando(true);
    fetch(`${API_URL}/api/solicitudes/pendientes/director`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(data => setSolicitudes(Array.isArray(data) ? data : []))
      .catch(() => setError("No se pudieron cargar las solicitudes"))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    cargarSolicitudes();
    return () => { if (prevVisorUrl.current) URL.revokeObjectURL(prevVisorUrl.current); };
  }, []);

  const cargarPDF = async (sol: Solicitud) => {
    setSeleccionada(sol);
    setPdfB64(null); setVisorUrl(null); setPdfFirmado(null);
    setCargandoPdf(true);
    try {
      const id = sol.id_solicitud ?? sol.id;
      const res = await fetch(`${API_URL}/api/firmas/pdf-solicitud/${id}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPdfB64(data.pdf_base64);
        mostrarEnVisor(data.pdf_base64);
      }
    } catch { setError("Error cargando el PDF"); }
    finally { setCargandoPdf(false); }
  };

  const mostrarEnVisor = (b64: string) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const blob  = new Blob([bytes], { type: "application/pdf" });
    if (prevVisorUrl.current) URL.revokeObjectURL(prevVisorUrl.current);
    const url = URL.createObjectURL(blob);
    prevVisorUrl.current = url;
    setVisorUrl(url);
    setTimeout(() => visorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  };

  const handleFirmado = (b64: string) => {
    setPdfFirmado(b64);
    setMostrarFirmador(false);
    mostrarEnVisor(b64);
  };

  const handleAprobar = async () => {
    if (!seleccionada) return;
    setProcesando(true); setError(null);
    try {
      const id = seleccionada.id_solicitud ?? seleccionada.id;

      // Si hay PDF firmado, guardarlo primero
      if (pdfFirmado) {
        await fetch(`${API_URL}/api/firmas/guardar-firmado`, {
          method: "POST",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ id_solicitud: id, pdf_base64: pdfFirmado, rol_firmante: "director" }),
        });
      }

      // Aprobar en el flujo
      const res = await fetch(`${API_URL}/api/solicitudes/${id}/director/accion`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "aprobar", motivo: "Aprobado por director de tesis" }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Error al aprobar");

      setExito("✅ Solicitud aprobada y enviada al coordinador");
      setSolicitudes(prev => prev.filter(s => (s.id_solicitud ?? s.id) !== id));
      setSeleccionada(null); setPdfB64(null); setVisorUrl(null); setPdfFirmado(null);
    } catch (e: any) {
      setError(e.message || "Error al aprobar");
    } finally { setProcesando(false); }
  };

  const handleRechazar = async (motivo: string) => {
    if (!seleccionada) return;
    setMostrarModalRechazo(false);
    setProcesando(true); setError(null);
    try {
      const id = seleccionada.id_solicitud ?? seleccionada.id;
      const res = await fetch(`${API_URL}/api/solicitudes/${id}/director/accion`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "rechazar", motivo }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Error al rechazar");

      setExito("Solicitud rechazada. El estudiante será notificado.");
      setSolicitudes(prev => prev.filter(s => (s.id_solicitud ?? s.id) !== id));
      setSeleccionada(null); setPdfB64(null); setVisorUrl(null); setPdfFirmado(null);
    } catch (e: any) {
      setError(e.message || "Error al rechazar");
    } finally { setProcesando(false); }
  };

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      {mostrarFirmador && pdfB64 && (
        <FirmadorPDF pdfBase64={pdfB64} soloVer={false}
          onFirmado={handleFirmado} onCerrar={() => setMostrarFirmador(false)} />
      )}
      {mostrarModalRechazo && (
        <ModalRechazo
          onConfirmar={handleRechazar}
          onCancelar={() => setMostrarModalRechazo(false)} />
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">✍️ Solicitudes por revisar</h1>
          <p className="text-gray-500 text-sm mt-1">Solicitudes de sus estudiantes que esperan su revisión y firma</p>
        </div>

        {error  && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">⚠️ {error}</div>}
        {exito  && <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">{exito}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Lista */}
          <div className="space-y-3">
            {solicitudes.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-gray-600 font-medium">Sin solicitudes pendientes</p>
              </div>
            ) : (
              solicitudes.map(sol => {
                const id = sol.id_solicitud ?? sol.id;
                return (
                  <button key={id} onClick={() => cargarPDF(sol)}
                    className={`w-full text-left bg-white rounded-xl border p-4 hover:shadow-md transition-all ${
                      (seleccionada?.id_solicitud ?? seleccionada?.id) === id
                        ? "border-green-500 ring-2 ring-green-200"
                        : "border-gray-200 hover:border-green-300"
                    }`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📋</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-800 truncate">{sol.asunto || "Solicitud"}</p>
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">⏳ Pendiente</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">👤 {sol.nombre_estudiante ?? sol.solicitante}</p>
                        <p className="text-xs text-gray-400 mt-0.5">📅 {(sol.fecha_envio ?? "")?.slice(0, 10)}</p>
                        <p className="text-xs font-mono text-gray-400">{sol.numero_radicado}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Panel derecho */}
          <div className="space-y-4">
            {!seleccionada ? (
              <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
                <p className="text-4xl mb-3">👈</p>
                <p className="text-gray-500 text-sm">Selecciona una solicitud para revisarla</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-1">
                  <p className="text-sm font-bold text-gray-700">{seleccionada.asunto}</p>
                  <p className="text-xs text-gray-500">👤 {seleccionada.nombre_estudiante ?? seleccionada.solicitante}</p>
                  <p className="text-xs font-mono text-gray-400">{seleccionada.numero_radicado}</p>
                </div>

                {/* Botones de firma */}
                <div className="flex gap-2">
                  <button onClick={() => pdfB64 && mostrarEnVisor(pdfFirmado ?? pdfB64)}
                    disabled={cargandoPdf || !pdfB64}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-blue-300 text-blue-700 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-50 disabled:opacity-60">
                    {cargandoPdf ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Cargando...</> : <>👁️ Ver documento</>}
                  </button>
                  <button onClick={() => setMostrarFirmador(true)} disabled={!pdfB64}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                    ✍️ {pdfFirmado ? "Editar firma" : "Firmar"}
                  </button>
                </div>

                {pdfFirmado && (
                  <p className="text-xs text-green-700 text-center bg-green-50 rounded-lg py-2 border border-green-200">
                    ✅ Documento firmado
                  </p>
                )}

                {/* Botones de decisión */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <p className="text-xs text-gray-500 font-medium text-center">Decisión sobre la solicitud</p>
                  <div className="flex gap-2">
                    <button onClick={() => setMostrarModalRechazo(true)} disabled={procesando}
                      className="flex-1 flex items-center justify-center gap-2 border border-red-300 text-red-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 disabled:opacity-60">
                      ❌ Rechazar
                    </button>
                    <button onClick={handleAprobar} disabled={procesando}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-800 disabled:opacity-60">
                      {procesando
                        ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Procesando...</>
                        : <>✅ Aprobar{pdfFirmado ? " y enviar" : ""}</>}
                    </button>
                  </div>
                  {!pdfFirmado && (
                    <p className="text-xs text-gray-400 text-center">
                      💡 Puede aprobar sin firmar o firmar antes de aprobar
                    </p>
                  )}
                </div>

                {visorUrl && (
                  <div ref={visorRef} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
                      <span className="text-xs font-semibold text-gray-600">
                        {pdfFirmado ? "✍️ Documento firmado" : "📄 Vista previa"}
                      </span>
                      <button onClick={() => setVisorUrl(null)} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                    </div>
                    <iframe src={visorUrl} className="w-full" style={{ height: "550px" }} title="PDF solicitud" />
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
