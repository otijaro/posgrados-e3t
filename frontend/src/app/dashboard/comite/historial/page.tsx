"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
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

const estadoColor: Record<string, string> = {
  en_comite: "bg-purple-100 text-purple-800",
  aprobada: "bg-green-100 text-green-800",
  rechazada: "bg-red-100 text-red-800",
  cancelada: "bg-gray-100 text-gray-500",
};

const estadoLabel: Record<string, string> = {
  en_comite: "En comité",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
};

interface Solicitud {
  id: number;
  numero_radicado: string;
  tipo_solicitud: string;
  asunto: string;
  estado: string;
  fecha_creacion: string | null;
  solicitante_nombre: string;
}

export default function HistorialComite() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/solicitudes/historial/comite`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(data => setSolicitudes(Array.isArray(data) ? data : []))
      .catch(() => setError("No se pudo cargar el historial."))
      .finally(() => setCargando(false));
  }, []);

  const filtradas = solicitudes.filter((s) => {
    const coincideEstado = filtroEstado === "todos" || s.estado === filtroEstado;
    const coincideBusqueda =
      busqueda === "" ||
      s.solicitante_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.asunto.toLowerCase().includes(busqueda.toLowerCase()) ||
      (s.numero_radicado ?? "").toLowerCase().includes(busqueda.toLowerCase());
    return coincideEstado && coincideBusqueda;
  });

  const estados = ["todos", "en_comite", "aprobada", "rechazada", "cancelada"];

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📚 Historial — Comité Asesor</h1>
        <p className="text-gray-500 mt-1">Todas las solicitudes que han pasado por el comité, en cualquier estado.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">⚠️ {error}</div>}

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por estudiante, radicado o asunto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          {estados.map((e) => (
            <option key={e} value={e}>{e === "todos" ? "Todos los estados" : estadoLabel[e] ?? e}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filtradas.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p>No hay solicitudes que coincidan.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtradas.map((s) => (
              <Link key={s.id} href={`/dashboard/director/solicitudes/${s.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">{tipoLabel[s.tipo_solicitud] ?? s.tipo_solicitud}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoColor[s.estado] ?? "bg-gray-100 text-gray-600"}`}>
                      {estadoLabel[s.estado] ?? s.estado}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{s.asunto}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    👤 {s.solicitante_nombre} · {s.fecha_creacion} · {s.numero_radicado || "sin radicado"}
                  </p>
                </div>
                <span className="text-gray-300 flex-shrink-0">›</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
