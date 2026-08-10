"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const estadoColor: Record<string, string> = {
  enviada:     "bg-yellow-100 text-yellow-800",
  aprobada:    "bg-green-100 text-green-800",
  rechazada:   "bg-red-100 text-red-800",
  en_revision: "bg-blue-100 text-blue-800",
  borrador:    "bg-gray-100 text-gray-600",
  en_comite:   "bg-purple-100 text-purple-800",
  devuelta:    "bg-orange-100 text-orange-800",
  cancelada:   "bg-gray-100 text-gray-400",
};

const estadoLabel: Record<string, string> = {
  enviada:     "Enviada",
  aprobada:    "Aprobada",
  rechazada:   "Rechazada",
  en_revision: "En Revisión Director",
  borrador:    "Borrador",
  en_comite:   "En Comité",
  devuelta:    "Devuelta",
  cancelada:   "Cancelada",
};

interface Solicitud {
  id: number;
  numero_radicado: string;
  tipo_solicitud: string;
  asunto: string;
  estado: string;
  fecha_creacion: string;
  respuesta?: string;
  editable: boolean;
  motivo_no_editable?: string;
  horas_restantes?: number;
}

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [expandida, setExpandida]     = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/solicitudes/mis-solicitudes`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setSolicitudes(Array.isArray(data) ? data : []))
      .catch(() => setError("No se pudieron cargar las solicitudes."))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Solicitudes</h1>
          <p className="text-gray-500 mt-1">Gestiona tus solicitudes académicas y administrativas</p>
        </div>
        <Link href="/dashboard/estudiante/solicitudes/nueva"
          className="bg-green-700 text-white px-5 py-2.5 rounded-lg hover:bg-green-800 transition-colors text-sm font-semibold">
          + Nueva Solicitud
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">📋 Historial de Solicitudes</h2>

        {cargando ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 text-green-700 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : error ? (
          <p className="text-red-500 text-sm text-center py-8">{error}</p>
        ) : solicitudes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p>No tienes solicitudes aún.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {solicitudes.map((s) => (
              <div key={s.id}
                className={`border rounded-xl overflow-hidden transition-all ${
                  expandida === s.id ? "border-green-300 shadow-sm" : "border-gray-200 hover:border-gray-300"
                }`}>

                {/* Fila principal */}
                <button
                  className="w-full text-left px-5 py-4 flex items-center gap-4"
                  onClick={() => setExpandida(expandida === s.id ? null : s.id)}>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs text-gray-400">{s.numero_radicado}</span>
                      <span className="text-xs text-gray-400">{s.tipo_solicitud}</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${estadoColor[s.estado] ?? "bg-gray-100 text-gray-600"}`}>
                        {estadoLabel[s.estado] ?? s.estado}
                      </span>
                      {/* Badge editable */}
                      {s.editable && s.horas_restantes !== undefined && (
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          s.horas_restantes < 6 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          ✏️ {s.horas_restantes < 1 ? "< 1h para editar" : `${s.horas_restantes}h para editar`}
                        </span>
                      )}
                      {!s.editable && s.estado === "enviada" && (
                        <span className="text-xs bg-gray-100 text-gray-400 px-2.5 py-0.5 rounded-full">
                          🔒 Plazo vencido
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-700 mt-1 truncate">{s.asunto}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.fecha_creacion}</p>
                  </div>

                  <span className={`text-gray-400 transition-transform ${expandida === s.id ? "rotate-180" : ""}`}>▼</span>
                </button>

                {/* Detalle expandido */}
                {expandida === s.id && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-3">

                    {/* Motivo rechazo */}
                    {s.estado === "rechazada" && s.respuesta && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-red-700 mb-1">❌ Motivo de rechazo:</p>
                        <p className="text-sm text-red-600">{s.respuesta}</p>
                      </div>
                    )}

                    {/* Estado del flujo */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium">Flujo:</span>
                      {["enviada", "en_revision", "en_comite", "aprobada"].map((paso, i) => {
                        const estados = ["enviada", "en_revision", "en_comite", "aprobada"];
                        const idx = estados.indexOf(s.estado);
                        const rechazada = s.estado === "rechazada";
                        return (
                          <span key={paso} className="flex items-center gap-1">
                            {i > 0 && <span className="text-gray-300">›</span>}
                            <span className={`px-2 py-0.5 rounded-full font-medium ${
                              rechazada && i === idx ? "bg-red-100 text-red-600" :
                              i <= idx ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                            }`}>
                              {["Enviada", "Director", "Coordinador", "Aprobada"][i]}
                            </span>
                          </span>
                        );
                      })}
                    </div>

                    {/* Botón editar */}
                    {s.editable ? (
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/dashboard/estudiante/solicitudes/editar/${s.id}`}
                          className="flex items-center gap-2 bg-amber-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-amber-600 font-semibold">
                          ✏️ Editar solicitud
                        </Link>
                        <p className="text-xs text-gray-400">
                          {s.horas_restantes !== undefined
                            ? `Tienes ${s.horas_restantes}h para editar antes de que el director la revise`
                            : "Editable mientras el director no la haya revisado"}
                        </p>
                      </div>
                    ) : s.motivo_no_editable ? (
                      <p className="text-xs text-gray-400 italic">🔒 {s.motivo_no_editable}</p>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
