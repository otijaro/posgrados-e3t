"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMe, UserInfo } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function InicioComite() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [pendientes, setPendientes] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getMe().then(setUser);
    fetch(`${API_URL}/api/solicitudes/pendientes/comite`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(data => setPendientes(Array.isArray(data) ? data.length : 0))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.nombre_completo ?? "..."}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Comité Asesor de Posgrados</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/dashboard/comite/solicitudes"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-purple-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Solicitudes por decidir</p>
              <p className="text-3xl font-bold text-purple-700">
                {cargando ? "…" : pendientes}
              </p>
            </div>
            <span className="text-4xl">🏛️</span>
          </div>
          <p className="text-sm text-purple-700 font-semibold mt-3">Ir a decidir →</p>
        </Link>

        <Link href="/dashboard/comite/historial"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Historial completo</p>
              <p className="text-sm text-gray-600 mt-1">Todas las solicitudes que han pasado por el comité</p>
            </div>
            <span className="text-4xl">📚</span>
          </div>
          <p className="text-sm text-green-700 font-semibold mt-3">Ver historial →</p>
        </Link>
      </div>

      {!cargando && pendientes !== null && pendientes > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          ⏳ Tienes <strong>{pendientes}</strong> solicitud{pendientes > 1 ? "es" : ""} esperando la decisión del comité.
        </div>
      )}
    </div>
  );
}
