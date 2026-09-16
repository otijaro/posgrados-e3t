"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const rolLabel: Record<string, string> = {
  director: "Director",
  coordinador: "Coordinador",
  comite: "Comité",
};

const estadoPasoColor: Record<string, string> = {
  aprobado: "bg-green-100 text-green-700 border-green-300",
  rechazado: "bg-red-100 text-red-700 border-red-300",
  cancelado: "bg-gray-100 text-gray-500 border-gray-300",
  pendiente: "bg-amber-100 text-amber-700 border-amber-300",
};

const estadoPasoIcono: Record<string, string> = {
  aprobado: "✅",
  rechazado: "❌",
  cancelado: "🚫",
  pendiente: "⏳",
};

const tipoSolicitudLabel: Record<string, string> = {
  credito_condonable: "Crédito Condonable",
  prorroga: "Prórroga",
  cambio_director: "Cambio de Director",
  cambio_titulo: "Cambio de Título",
  nombramiento_jurado: "Solicitud de Evaluación",
  solicitud_grado: "Solicitud de Grado",
  otra: "Otra",
};

const estadoGeneralColor: Record<string, string> = {
  enviada: "bg-orange-100 text-orange-800",
  en_revision: "bg-yellow-100 text-yellow-800",
  en_comite: "bg-purple-100 text-purple-800",
  aprobada: "bg-green-100 text-green-800",
  rechazada: "bg-red-100 text-red-800",
  cancelada: "bg-gray-100 text-gray-500",
};

interface FlujoPaso {
  orden: number;
  rol: string;
  estado: string;
  fecha_recepcion: string | null;
  fecha_respuesta: string | null;
  comentarios: string | null;
}

interface SolicitudDetalle {
  id: number;
  numero_radicado: string;
  tipo_solicitud: string;
  asunto: string;
  descripcion: string;
  estado: string;
  fecha_creacion: string | null;
  fecha_envio: string | null;
  documento: string | null;
  respuesta: string | null;
  observaciones: string | null;
  solicitante_nombre: string;
  flujo: FlujoPaso[];
}

export default function DetalleSolicitudDirector() {
  const params = useParams();
  const id = params?.id as string;

  const [sol, setSol] = useState<SolicitudDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/api/solicitudes/${id}`, { headers: authHeaders() })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setSol)
      .catch(() => setError("No se pudo cargar la solicitud."))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !sol) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">⚠️ {error ?? "No encontrada"}</div>
        <Link href="/dashboard/director" className="text-green-700 text-sm font-semibold hover:underline">← Volver</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard/director" className="text-sm text-gray-400 hover:text-green-700">← Volver al inicio</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          📋 {tipoSolicitudLabel[sol.tipo_solicitud] ?? sol.tipo_solicitud}
        </h1>
        <p className="text-gray-500 mt-1">{sol.asunto}</p>
      </div>

      {sol.estado === "enviada" && (
        <Link href={`/dashboard/director/solicitudes?id=${sol.id}`}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-semibold text-sm">
          ✍️ Ir a firmar / decidir esta solicitud
        </Link>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">

        {/* Datos generales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Radicado</p>
            <p className="text-sm font-mono text-gray-700">{sol.numero_radicado}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Estudiante</p>
            <p className="text-sm text-gray-700">{sol.solicitante_nombre}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Estado actual</p>
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${estadoGeneralColor[sol.estado] ?? "bg-gray-100 text-gray-600"}`}>
              {sol.estado}
            </span>
          </div>
        </div>

        {/* Flujo dinámico — basado en los pasos reales guardados en la BD */}
        <div className="border-t border-gray-100 pt-5">
          <p className="text-sm font-bold text-gray-700 mb-3">Flujo de aprobación</p>
          {sol.flujo.length === 0 ? (
            <p className="text-sm text-gray-400">Sin pasos de flujo registrados.</p>
          ) : (
            <div className="space-y-2">
              {sol.flujo.map((paso) => (
                <div key={paso.orden} className={`border rounded-lg p-3 flex items-start justify-between gap-3 ${estadoPasoColor[paso.estado] ?? "bg-gray-50 border-gray-200"}`}>
                  <div>
                    <p className="text-sm font-semibold">
                      {estadoPasoIcono[paso.estado] ?? "•"} {rolLabel[paso.rol] ?? paso.rol}
                    </p>
                    {paso.comentarios && <p className="text-xs mt-1 opacity-80">{paso.comentarios}</p>}
                  </div>
                  <div className="text-right text-xs opacity-70 flex-shrink-0">
                    {paso.fecha_respuesta ? <p>Resuelto: {paso.fecha_respuesta}</p> : paso.fecha_recepcion ? <p>Recibido: {paso.fecha_recepcion}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Motivo de rechazo, si aplica */}
        {sol.estado === "rechazada" && sol.respuesta && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-red-700 mb-1">Motivo de rechazo:</p>
            <p className="text-sm text-red-600">{sol.respuesta}</p>
          </div>
        )}

        {/* Observaciones internas (director/coordinador → siguiente responsable) */}
        {sol.observaciones && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-700 mb-1">📝 Observaciones internas:</p>
            <pre className="text-sm text-blue-700 whitespace-pre-wrap font-sans">{sol.observaciones}</pre>
          </div>
        )}

        {/* Descripción completa */}
        <div className="border-t border-gray-100 pt-5">
          <p className="text-sm font-bold text-gray-700 mb-2">Detalle de la solicitud</p>
          <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans bg-gray-50 rounded-lg p-4">{sol.descripcion}</pre>
        </div>

        {/* Documento */}
        {sol.documento && (
          <div className="border-t border-gray-100 pt-5">
            <a href={`${API_URL}${sol.documento}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-green-700 hover:underline font-semibold">
              📄 Ver documento adjunto
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
