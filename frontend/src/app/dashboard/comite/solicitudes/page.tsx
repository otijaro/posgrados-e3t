"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  votos_aprobar: number;
  votos_rechazar: number;
  quorum: number;
}

const tipoLabel: Record<string, string> = {
  registrar_tema: "Registrar Tema",
  credito_condonable: "Crédito Condonable",
  prorroga: "Prórroga",
  cambio_director: "Cambio de Director",
  cambio_titulo: "Cambio de Título",
  nombramiento_jurado: "Solicitud de Evaluación",
  solicitud_grado: "Solicitud de Grado",
  otra: "Otra",
};

// Modal de decisión: aprobar o rechazar, ambos con observaciones (obligatorias al rechazar)
function ModalDecision({
  tipo, onConfirmar, onCancelar,
}: {
  tipo: "aprobar" | "rechazar";
  onConfirmar: (texto: string) => void;
  onCancelar: () => void;
}) {
  const [texto, setTexto] = useState("");
  const esRechazo = tipo === "rechazar";
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">
          {esRechazo ? "❌ Rechazar solicitud" : "✅ Aprobar solicitud"}
        </h2>
        <p className="text-sm text-gray-500">
          {esRechazo
            ? "Indica el motivo del rechazo. El estudiante será notificado."
            : "Si quieres, deja una observación (opcional). Esta es la última instancia — la solicitud quedará aprobada."}
        </p>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          rows={4}
          placeholder={esRechazo ? "Explica por qué se rechaza..." : "Observaciones (opcional)..."}
          className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 resize-none ${esRechazo ? "focus:ring-red-400" : "focus:ring-green-400"}`}
          autoFocus
        />
        <div className="flex gap-3 pt-2">
          <button onClick={onCancelar}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={() => { if (!esRechazo || texto.trim()) onConfirmar(texto.trim()); }}
            disabled={esRechazo && !texto.trim()}
            className={`flex-1 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${esRechazo ? "bg-red-600 hover:bg-red-700" : "bg-green-700 hover:bg-green-800"}`}>
            {esRechazo ? "Confirmar rechazo" : "Confirmar aprobación"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SolicitudesComite() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [exito, setExito]             = useState<string | null>(null);
  const [seleccionada, setSeleccionada] = useState<Solicitud | null>(null);
  const [detalle, setDetalle]         = useState<any>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [procesando, setProcesando]   = useState(false);
  const [modal, setModal]             = useState<"aprobar" | "rechazar" | null>(null);

  const cargarSolicitudes = () => {
    setCargando(true);
    fetch(`${API_URL}/api/solicitudes/pendientes/comite`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(data => setSolicitudes(Array.isArray(data) ? data : []))
      .catch(() => setError("No se pudieron cargar las solicitudes"))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) { router.push("/login"); return; }
    cargarSolicitudes();
  }, []);

  const seleccionar = (sol: Solicitud) => {
    setSeleccionada(sol);
    setDetalle(null);
    setCargandoDetalle(true);
    fetch(`${API_URL}/api/solicitudes/${sol.id}`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(setDetalle)
      .finally(() => setCargandoDetalle(false));
  };

  const handleDecision = async (accion: "aprobar" | "rechazar", texto: string) => {
    if (!seleccionada) return;
    setModal(null);
    setProcesando(true); setError(null);
    try {
      const body = accion === "aprobar"
        ? { accion, observaciones: texto || undefined }
        : { accion, motivo: texto };
      const res = await fetch(`${API_URL}/api/solicitudes/${seleccionada.id}/comite/accion`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `Error al votar`);

      if (data.resultado_comite === "aprobado") {
        setExito(`✅ ¡Se alcanzó el quórum! (${data.votos_aprobar}/${data.quorum} votos a favor) — pasa al coordinador para la firma final.`);
      } else if (data.resultado_comite === "rechazado") {
        setExito(`Solicitud rechazada por el comité (${data.votos_rechazar}/${data.quorum} votos en contra).`);
      } else {
        setExito(`Tu voto quedó registrado (${data.votos_aprobar} a favor, ${data.votos_rechazar} en contra — se necesitan ${data.quorum} para decidir).`);
      }
      setSolicitudes(prev => prev.filter(s => s.id !== seleccionada.id));
      setSeleccionada(null); setDetalle(null);
    } catch (e: any) {
      setError(e.message || `Error al votar`);
    } finally { setProcesando(false); }
  };

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      {modal && (
        <ModalDecision
          tipo={modal}
          onConfirmar={(texto) => handleDecision(modal, texto)}
          onCancelar={() => setModal(null)}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🏛️ Comité Asesor — Solicitudes por decidir</h1>
          <p className="text-gray-500 text-sm mt-1">Solicitudes aprobadas por Director y Coordinador que esperan la decisión final del comité</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">⚠️ {error}</div>}
        {exito && <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">{exito}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista */}
          <div className="space-y-3">
            {solicitudes.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-gray-600 font-medium">Sin solicitudes pendientes</p>
              </div>
            ) : (
              solicitudes.map(sol => (
                <button key={sol.id} onClick={() => seleccionar(sol)}
                  className={`w-full text-left bg-white rounded-xl border p-4 hover:shadow-md transition-all ${
                    seleccionada?.id === sol.id ? "border-green-500 ring-2 ring-green-200" : "border-gray-200 hover:border-green-300"
                  }`}>
                  <div className="flex items-start gap-3">
                  <span className="text-2xl">📋</span>
                  <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800 truncate">{tipoLabel[sol.tipo_solicitud] ?? sol.tipo_solicitud}</p>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full whitespace-nowrap">⏳ En comité</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{sol.asunto}</p>
                  <p className="text-xs text-gray-500 mt-1">👤 {sol.solicitante}</p>
                  <p className="text-xs text-gray-400 mt-0.5">📅 {(sol.fecha_envio ?? "")?.slice(0, 10)}</p>
                  <p className="text-xs font-mono text-gray-400">{sol.numero_radicado}</p>
                    <p className="text-xs font-semibold text-blue-600 mt-1">
                        🗳️ {sol.votos_aprobar} a favor · {sol.votos_rechazar} en contra (se necesitan {sol.quorum} para decidir)
                        </p>
                      </div>
                    </div>
                </button>
              ))
            )}
          </div>

          {/* Panel derecho: detalle + decisión */}
          <div className="space-y-4">
            {!seleccionada ? (
              <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
                <p className="text-4xl mb-3">👈</p>
                <p className="text-gray-500 text-sm">Selecciona una solicitud para revisarla</p>
              </div>
            ) : cargandoDetalle ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : detalle ? (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                  <p className="text-sm font-bold text-gray-700">{detalle.asunto}</p>
                  <p className="text-xs text-gray-500">👤 {detalle.solicitante_nombre}</p>
                  <p className="text-xs font-mono text-gray-400">{detalle.numero_radicado}</p>
                </div>

                {detalle.observaciones && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-blue-700 mb-1">📝 Observaciones de Director/Coordinador:</p>
                    <pre className="text-sm text-blue-700 whitespace-pre-wrap font-sans">{detalle.observaciones}</pre>
                  </div>
                )}

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Detalle</p>
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">{detalle.descripcion}</pre>
                </div>

                {detalle.documento && (
                  <a href={`${API_URL}${detalle.documento}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-green-700 hover:underline font-semibold">
                    📄 Ver documento adjunto
                  </a>
                )}

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <p className="text-xs text-gray-500 font-medium text-center">Tu voto (se necesitan {seleccionada.quorum} de 7 para decidir)</p>
                  <div className="flex gap-2">
                    <button onClick={() => setModal("rechazar")} disabled={procesando}
                      className="flex-1 flex items-center justify-center gap-2 border border-red-300 text-red-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 disabled:opacity-60">
                      ❌ Votar Rechazar
                    </button>
                    <button onClick={() => setModal("aprobar")} disabled={procesando}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-800 disabled:opacity-60">
                      {procesando
                        ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Procesando...</>
                        : <>✅ Votar Aprobar</>}
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
