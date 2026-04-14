"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSolicitudes, SolicitudResumen } from "@/lib/api";

const estadoColor: Record<string, string> = {
  enviada: "bg-yellow-100 text-yellow-800",
  aprobada: "bg-green-100 text-green-800",
  rechazada: "bg-red-100 text-red-800",
  en_revision: "bg-blue-100 text-blue-800",
  borrador: "bg-gray-100 text-gray-600",
  en_comite: "bg-purple-100 text-purple-800",
  devuelta: "bg-orange-100 text-orange-800",
  cancelada: "bg-gray-100 text-gray-400",
};

const estadoLabel: Record<string, string> = {
  enviada: "Enviada",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  en_revision: "En Revisión",
  borrador: "Borrador",
  en_comite: "En Comité",
  devuelta: "Devuelta",
  cancelada: "Cancelada",
};

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSolicitudes()
      .then(setSolicitudes)
      .catch(() => setError("No se pudieron cargar las solicitudes."))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Solicitudes</h1>
          <p className="text-gray-500 mt-1">Gestiona tus solicitudes académicas y administrativas</p>
        </div>
        <Link
          href="/dashboard/estudiante/solicitudes/nueva"
          className="bg-green-700 text-white px-5 py-2.5 rounded-lg hover:bg-green-800 transition-colors text-sm font-semibold"
        >
          + Nueva Solicitud
        </Link>
      </div>

      {/* Tabla de solicitudes */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">📋 Historial de Solicitudes</h2>

        {cargando ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 text-green-700 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-gray-400 text-sm mt-3">Cargando solicitudes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p>No tienes solicitudes aún.</p>
            <p className="text-sm mt-1">Haz clic en "Nueva Solicitud" para comenzar.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Radicado</th>
                <th className="pb-3 font-medium">Tipo</th>
                <th className="pb-3 font-medium">Asunto</th>
                <th className="pb-3 font-medium">Fecha</th>
                <th className="pb-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {solicitudes.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="py-3 font-mono text-xs text-gray-600">{s.numero_radicado ?? "—"}</td>
                  <td className="py-3 text-gray-500 text-xs">{s.tipo_solicitud}</td>
                  <td className="py-3 text-gray-800 font-medium max-w-xs truncate">{s.asunto}</td>
                  <td className="py-3 text-gray-500">{new Date(s.fecha_creacion).toLocaleDateString("es-CO")}</td>
                  <td className="py-3">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${estadoColor[s.estado] ?? "bg-gray-100 text-gray-600"}`}>
                      {estadoLabel[s.estado] ?? s.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
