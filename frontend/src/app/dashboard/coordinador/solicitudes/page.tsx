"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Solicitud {
  id: number;
  numero_radicado: string | null;
  tipo_solicitud: string;
  asunto: string;
  descripcion: string;
  estado: string;
  nivel_aprobacion: string;
  fecha_creacion: string;
  fecha_envio: string | null;
  solicitante_nombre: string;
  solicitante_email: string;
  codigo_estudiante: string | null;
  documento: string | null;
  programa: string;
}

const ESTADO_BADGE: Record<string, string> = {
  enviada:     "bg-amber-100 text-amber-700",
  en_revision: "bg-yellow-100 text-yellow-700",
  en_comite:   "bg-purple-100 text-purple-700",
  aprobada:    "bg-green-100 text-green-700",
  rechazada:   "bg-red-100 text-red-700",
  devuelta:    "bg-orange-100 text-orange-700",
  borrador:    "bg-gray-100 text-gray-500",
};

const ESTADO_LABEL: Record<string, string> = {
  enviada: "Enviada", en_revision: "En revisión", en_comite: "En comité",
  aprobada: "Aprobada", rechazada: "Rechazada", devuelta: "Devuelta", borrador: "Borrador",
};

const TIPO_LABEL: Record<string, string> = {
  nombramiento_jurado: "Solicitud de Evaluación",
  cambio_titulo:       "Cambio de Título / Registro Tema",
  cambio_director:     "Cambio de Director/Codirector",
  prorroga:            "Prórroga",
  credito_condonable:  "Crédito Condonable",
  solicitud_grado:     "Solicitud de Grado",
  otra:                "Otra",
};

function authH(): Record<string, string> {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

// ── Parsear descripción en bloques legibles ───────────────────────────────────
function parseDescripcion(desc: string): { label: string; valor: string }[] {
  if (!desc) return [];
  const bloques: { label: string; valor: string }[] = [];
  const lineas = desc.split("\n");
  let labelActual = "";
  let valorActual: string[] = [];

  const flush = () => {
    if (labelActual) {
      const valor = valorActual.join("\n").trim();
      // Filtrar líneas que parecen rutas de Windows o basura
      const filtrado = valor.split("\n")
        .filter((l) => !l.match(/^[A-Za-z]:\\/) && l.trim() !== "")
        .join("\n").trim();
      if (filtrado) bloques.push({ label: labelActual, valor: filtrado });
    }
  };

  for (const linea of lineas) {
    const matchClave = linea.match(/^([^:]+):\s*(.*)$/);
    if (matchClave && matchClave[1].length < 40 && !linea.startsWith(" ")) {
      flush();
      labelActual = matchClave[1].trim();
      valorActual = matchClave[2] ? [matchClave[2]] : [];
    } else if (linea.trim()) {
      // Filtrar rutas de Windows
      if (!linea.match(/^[A-Za-z]:\\/)) {
        valorActual.push(linea);
      }
    }
  }
  flush();
  return bloques;
}

// ── Modal de detalle ──────────────────────────────────────────────────────────
function ModalDetalle({
  s,
  onClose,
  onAccion,
  accionando,
}: {
  s: Solicitud;
  onClose: () => void;
  onAccion: (accion: string, obs: string) => void;
  accionando: boolean;
}) {
  const [observaciones, setObservaciones] = useState("");
  const bloques = parseDescripcion(s.descripcion);
  const puedeActuar = s.estado === "enviada" || s.estado === "en_revision";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">

        {/* Cabecera */}
        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {TIPO_LABEL[s.tipo_solicitud] ?? s.tipo_solicitud}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">{s.numero_radicado ?? "Sin radicado"}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">✕</button>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Info del solicitante */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Solicitante</p>
              <p className="font-semibold text-gray-800 text-sm">{s.solicitante_nombre}</p>
              <p className="text-xs text-gray-500">{s.solicitante_email}</p>
              {s.codigo_estudiante && (
                <p className="text-xs text-gray-400 mt-0.5">Cód. {s.codigo_estudiante}</p>
              )}
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Programa</p>
              <p className="font-semibold text-gray-800 text-sm">{s.programa}</p>
              <p className="text-xs text-gray-400 mt-1">Recibida: {s.fecha_creacion}</p>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_BADGE[s.estado] ?? "bg-gray-100 text-gray-600"}`}>
                {ESTADO_LABEL[s.estado] ?? s.estado}
              </span>
            </div>
          </div>

          {/* Contenido de la solicitud parseado */}
          <div className="space-y-3">
            {bloques.map((b, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{b.label}</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{b.valor}</p>
              </div>
            ))}
          </div>

          {/* Documento adjunto */}
          {s.documento && (
            <a
              href={`${API_URL}${s.documento}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium"
            >
              📄 Ver documento adjunto
            </a>
          )}

          {/* Acciones */}
          {puedeActuar ? (
            <div className="border-t border-gray-100 pt-5 space-y-3">
              <p className="text-sm font-bold text-gray-700">Tomar acción</p>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                placeholder="Observaciones para el estudiante (opcional para aprobar, recomendado para rechazar o devolver)..."
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAccion("aprobar", observaciones)}
                  disabled={accionando}
                  className="bg-green-700 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-800 disabled:opacity-60 transition-colors"
                >
                  ✅ Aprobar
                </button>
                <button
                  onClick={() => onAccion("pasar_comite", observaciones)}
                  disabled={accionando}
                  className="bg-purple-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-60 transition-colors"
                >
                  🏛️ Pasar al Comité
                </button>
                <button
                  onClick={() => onAccion("devolver", observaciones)}
                  disabled={accionando}
                  className="bg-orange-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-60 transition-colors"
                >
                  🔄 Devolver
                </button>
                <button
                  onClick={() => onAccion("rechazar", observaciones)}
                  disabled={accionando}
                  className="bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors"
                >
                  ❌ Rechazar
                </button>
              </div>
            </div>
          ) : (
            <div className={`rounded-xl p-3 text-sm text-center font-medium ${ESTADO_BADGE[s.estado] ?? "bg-gray-100 text-gray-600"}`}>
              Esta solicitud ya fue procesada: {ESTADO_LABEL[s.estado] ?? s.estado}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
function SolicitudesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const estadoInicial = searchParams.get("estado") ?? "todas";

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filtroEstado, setFiltroEstado] = useState(estadoInicial);
  const [busqueda, setBusqueda]       = useState("");
  const [seleccionada, setSeleccionada] = useState<Solicitud | null>(null);
  const [accionando, setAccionando]   = useState(false);

  const cargar = () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    const params = filtroEstado !== "todas" ? `?estado=${filtroEstado}` : "";
    fetch(`${API_URL}/api/coordinador/solicitudes${params}`, { headers: authH() })
      .then((r) => r.json())
      .then(setSolicitudes)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [filtroEstado]);

  const ejecutarAccion = async (accion: string, observaciones: string) => {
    if (!seleccionada) return;
    setAccionando(true);
    try {
      const res = await fetch(`${API_URL}/api/coordinador/solicitudes/${seleccionada.id}/accion`, {
        method: "POST",
        headers: authH(),
        body: JSON.stringify({ accion, observaciones }),
      });
      if (!res.ok) throw new Error("Error al procesar la acción");
      setSeleccionada(null);
      cargar();
    } catch {
      alert("Error al procesar la acción");
    } finally {
      setAccionando(false);
    }
  };

  const filtradas = solicitudes.filter((s) =>
    busqueda === "" ||
    s.solicitante_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.asunto.toLowerCase().includes(busqueda.toLowerCase()) ||
    (s.numero_radicado ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
    (s.codigo_estudiante ?? "").includes(busqueda)
  );

  const estados = ["todas", "enviada", "en_revision", "aprobada", "rechazada", "devuelta", "en_comite"];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📋 Solicitudes</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona y responde las solicitudes de los estudiantes</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Buscar por nombre, radicado, código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        />
        <div className="flex flex-wrap gap-2">
          {estados.map((e) => (
            <button key={e} onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtroEstado === e ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {e === "todas" ? "Todas" : ESTADO_LABEL[e] ?? e}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium">No hay solicitudes{filtroEstado !== "todas" ? ` con estado "${ESTADO_LABEL[filtroEstado] ?? filtroEstado}"` : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((s) => (
            <div
              key={s.id}
              className={`bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow ${
                s.estado === "enviada" ? "border-l-4 border-l-amber-400 border-gray-200" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_BADGE[s.estado] ?? "bg-gray-100 text-gray-600"}`}>
                      {ESTADO_LABEL[s.estado] ?? s.estado}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{s.numero_radicado ?? "Sin radicado"}</span>
                    <span className="text-xs text-gray-400">{s.fecha_creacion}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{TIPO_LABEL[s.tipo_solicitud] ?? s.tipo_solicitud}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{s.asunto}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    👤 {s.solicitante_nombre}
                    {s.codigo_estudiante && <> · Cód. {s.codigo_estudiante}</>}
                    {" · "}{s.programa}
                  </p>
                </div>
                <button
                  onClick={() => setSeleccionada(s)}
                  className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 font-medium flex-shrink-0"
                >
                  Ver detalle →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {seleccionada && (
        <ModalDetalle
          s={seleccionada}
          onClose={() => setSeleccionada(null)}
          onAccion={ejecutarAccion}
          accionando={accionando}
        />
      )}
    </div>
  );
}

export default function SolicitudesCoordinador() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SolicitudesContent />
    </Suspense>
  );
}
