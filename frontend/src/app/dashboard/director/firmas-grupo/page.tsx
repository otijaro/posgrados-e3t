"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const FirmadorPDF = dynamic(() => import("@/components/FirmadorPDF"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

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
}

function ModalRechazo({ onConfirmar, onCancelar }: { onConfirmar: (motivo: string) => void; onCancelar: () => void }) {
  const [motivo, setMotivo] = useState("");
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">❌ Rechazar solicitud</h2>
        <p className="text-sm text-gray-500">Indique el motivo del rechazo. El estudiante será notificado.</p>
        <textarea
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          rows={4}
          placeholder="Explique por qué se rechaza la solicitud..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          autoFocus
        />
        <div className="flex gap-3 pt-2">
          <button onClick={onCancelar} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
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

function FirmasGrupoDirectorInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idFocalizada = searchParams.get("id");
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
    fetch(`${API_URL}/api/solicitudes/pendientes/dir-grupo`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const lista = Array.isArray(data) ? data : [];
        setSolicitudes(lista);
        if (idFocalizada) {
          const encontrada = lista.find((s: Solicitud) => String(s.id) === idFocalizada);
          if (encontrada) cargarPDF(encontrada);
        }
      })
      .catch(() => setError("No se pudieron cargar las solicitudes"))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) { router.push("/login"); return; }
    cargarSolicitudes();
    return () => { if (prevVisorUrl.current) URL.revokeObjectURL(prevVisorUrl.current); };
  }, []);

  const cargarPDF = async (sol: Solicitud) => {
    setSeleccionada(sol);
    setPdfB64(null); setVisorUrl(null); setPdfFirmado(null);
    setCargandoPdf(true);
    try {
      const res = await fetch(`${API_URL}/api/firmas/pdf-solicitud/${sol.id}`, { headers: authHeaders() });
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

  const descargarPDF = () => {
    if (!visorUrl || !seleccionada) return;
    const a = document.createElement("a");
    a.href = visorUrl;
    a.download = `${seleccionada.numero_radicado || "documento"}.pdf`;
    a.click();
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
      if (pdfFirmado) {
        await fetch(`${API_URL}/api/firmas/guardar-firmado`, {
          method: "POST",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ id_solicitud: seleccionada.id, pdf_base64: pdfFirmado, rol_firmante: "dir_grupo" }),
        });
      }
      const res = await fetch(`${API_URL}/api/solicitudes/${seleccionada.id}/dir-grupo/accion`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "aprobar" }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Error al avalar");
      setExito("✅ Solicitud avalada y enviada al coordinador");
      setSolicitudes(prev => prev.filter(s => s.id !== seleccionada.id));
      setSeleccionada(null); setPdfB64(null); setVisorUrl(null); setPdfFirmado(null);
    } catch (e: any) {
      setError(e.message || "Error al avalar");
    } finally { setProcesando(false); }
  };

  const handleRechazar = async (motivo: string) => {
    if (!seleccionada) return;
    setMostrarModalRechazo(false);
    setProcesando(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/solicitudes/${seleccionada.id}/dir-grupo/accion`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "rechazar", motivo }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Error al rechazar");
      setExito("Solicitud rechazada. El estudiante será notificado.");
      setSolicitudes(prev => prev.filter(s => s.id !== seleccionada.id));
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
        <FirmadorPDF pdfBase64={pdfB64} soloVer={false} rolFirmante="director"
          onFirmado={handleFirmado} onCerrar={() => setMostrarFirmador(false)} />
      )}
      {mostrarModalRechazo && (
        <ModalRechazo onConfirmar={handleRechazar} onCancelar={() => setMostrarModalRechazo(false)} />
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">✍️ Aval como Director de Grupo</h1>
          <p className="text-gray-500 text-sm mt-1">Solicitudes de registro de tema que requieren su aval como Director del Grupo de Investigación</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">⚠️ {error}</div>}
        {exito && <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">{exito}</div>}

        {!seleccionada ? (
          solicitudes.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-gray-600 font-medium">Sin solicitudes pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {solicitudes.map(sol => (
                <button key={sol.id} onClick={() => cargarPDF(sol)}
                  className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-green-300 transition-all">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📋</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-800 truncate">{sol.asunto || "Registro de Tema"}</p>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">⏳ Aval pendiente</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">👤 {sol.solicitante}</p>
                      <p className="text-xs text-gray-400 mt-0.5">📅 {(sol.fecha_envio ?? "")?.slice(0, 10)}</p>
                      <p className="text-xs font-mono text-gray-400">{sol.numero_radicado}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-5">
            {solicitudes.length > 1 && (
              <button onClick={() => { setSeleccionada(null); setPdfB64(null); setVisorUrl(null); setPdfFirmado(null); }}
                className="text-sm text-gray-400 hover:text-green-700">
                ← Volver a la lista
              </button>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-base font-bold text-gray-800">{seleccionada.asunto}</p>
                  <p className="text-sm text-gray-500 mt-1">👤 {seleccionada.solicitante}</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium whitespace-nowrap">⏳ Aval pendiente</span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-gray-400">
                <span className="font-mono">{seleccionada.numero_radicado}</span>
                <span>📅 Enviada: {(seleccionada.fecha_envio ?? "")?.slice(0, 10)}</span>
              </div>
            </div>

            <div ref={visorRef} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-700">
                  {pdfFirmado ? "✍️ Documento avalado" : "📄 Documento"}
                </span>
                <div className="flex gap-2">
                  <button onClick={descargarPDF} disabled={cargandoPdf || !visorUrl}
                    className="flex items-center gap-2 bg-white border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-50 disabled:opacity-60">
                    ⬇️ Descargar
                  </button>
                  <button onClick={() => setMostrarFirmador(true)} disabled={!pdfB64}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-60">
                    ✍️ {pdfFirmado ? "Editar firma" : "Avalar y firmar"}
                  </button>
                </div>
              </div>
              {visorUrl ? (
                <iframe src={visorUrl} className="w-full" style={{ height: "720px" }} title="PDF solicitud" />
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                  {cargandoPdf ? "Cargando documento..." : "Sin documento cargado"}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <p className="text-xs text-gray-500 font-medium text-center">Decisión sobre la solicitud</p>
              <div className="flex gap-3">
                <button onClick={() => setMostrarModalRechazo(true)} disabled={procesando}
                  className="flex-1 flex items-center justify-center gap-2 border border-red-300 text-red-600 py-3 rounded-xl text-sm font-semibold hover:bg-red-50 disabled:opacity-60">
                  ❌ Rechazar
                </button>
                <button onClick={handleAprobar} disabled={procesando || (!!pdfB64 && !pdfFirmado)}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-700 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed">
                  {procesando ? "Procesando..." : "✅ Avalar y enviar al coordinador"}
                </button>
              </div>
              {!pdfFirmado && (
                <p className="text-xs text-amber-600 text-center">⚠️ Debe avalar/firmar el documento antes de poder aprobar</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function FirmasGrupoDirector() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin" /></div>}>
      <FirmasGrupoDirectorInner />
    </Suspense>
  );
}
