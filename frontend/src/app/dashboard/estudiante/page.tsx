"use client";

import { useEffect, useState } from "react";
import { getMe, UserInfo } from "@/lib/auth";
import { getMiPerfil, EstudianteInfo } from "@/lib/api";
import { StatCard } from "@/components/ui/StatCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Solicitud {
  radicado: string;
  tipo: string;
  estado: string;
  fecha: string;
}

const estadoColor: Record<string, string> = {
  enviada:       "bg-yellow-100 text-yellow-800",
  Enviada:       "bg-yellow-100 text-yellow-800",
  aprobada:      "bg-green-100 text-green-800",
  Aprobada:      "bg-green-100 text-green-800",
  rechazada:     "bg-red-100 text-red-800",
  Rechazada:     "bg-red-100 text-red-800",
  en_revision:   "bg-blue-100 text-blue-800",
  "En Revisión": "bg-blue-100 text-blue-800",
};

const proyectoEstadoColor: Record<string, string> = {
  en_desarrollo: "bg-blue-100 text-blue-800",
  en_evaluacion: "bg-purple-100 text-purple-800",
  aprobado:      "bg-green-100 text-green-800",
  propuesta:     "bg-yellow-100 text-yellow-800",
  sustentado:    "bg-teal-100 text-teal-800",
};

const proyectoEstadoLabel: Record<string, string> = {
  en_desarrollo: "En Desarrollo",
  en_evaluacion: "En Evaluación",
  aprobado:      "Aprobado",
  propuesta:     "Propuesta",
  sustentado:    "Sustentado",
  graduado:      "Graduado",
};

const estadoEstudianteLabel: Record<string, string> = {
  activo:      "Activo",
  condicional: "Condicional",
  reserva:     "Reserva",
  graduado:    "Graduado",
  retirado:    "Retirado",
  cancelado:   "Cancelado",
};

export default function EstudianteDashboard() {
  const [user, setUser]               = useState<UserInfo | null>(null);
  const [perfil, setPerfil]           = useState<EstudianteInfo | null>(null);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getMe(),
      getMiPerfil(),
      fetch(`${API_URL}/api/solicitudes/mis-solicitudes`, { headers: authHeaders() })
        .then(r => r.ok ? r.json() : [])
        .then((data: any[]) => Array.isArray(data)
          ? data.slice(0, 5).map(s => ({
              radicado: s.numero_radicado,
              tipo:     s.tipo_solicitud,
              estado:   s.estado,
              fecha:    s.fecha_creacion?.slice(0, 10) ?? "—",
            }))
          : []
        )
        .catch(() => []),
    ])
      .then(([u, p, sols]) => { setUser(u); setPerfil(p); setSolicitudes(sols); })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Cargando información...</div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">⚠️ {error}</div>
  );

  const fechaLimite = perfil?.fecha_max_graduacion
    ? new Date(perfil.fecha_max_graduacion).toLocaleDateString("es-CO", { month: "short", year: "numeric" })
    : "—";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Bienvenido, {user?.nombre_completo ?? "..."} 👋</h1>
        <p className="text-gray-500 mt-1">
          {perfil?.programa} · Cohorte {perfil?.cohorte} · Semestre {perfil?.semestre_actual}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard titulo="Promedio Acumulado" valor={perfil?.promedio_acumulado ?? "—"}
          descripcion="Sobre 5.0" icono="📊" color="border-green-500" />
        <StatCard titulo="Semestre Actual" valor={perfil?.semestre_actual ?? "—"}
          descripcion={`de ${perfil?.programa?.includes("Doctorado") ? "8" : "4"} semestres`}
          icono="🎓" color="border-blue-500" />
        <StatCard titulo="Estado" valor={estadoEstudianteLabel[perfil?.estado ?? ""] ?? perfil?.estado ?? "—"}
          descripcion="Sin observaciones" icono="✅" color="border-teal-500" />
        <StatCard titulo="Fecha Límite Grado" valor={fechaLimite}
          descripcion={perfil?.fecha_max_graduacion ?? ""} icono="📅" color="border-orange-500" />
      </div>

      {/* Proyecto */}
      {perfil?.proyecto ? (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📄 Mi Proyecto de Grado</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Título</p>
              <p className="text-gray-800 font-medium mt-0.5">{perfil.proyecto.titulo}</p>
            </div>
            <div className="flex flex-wrap gap-6 mt-4">
              <div>
                <p className="text-sm text-gray-500">Director</p>
                <p className="text-gray-800 font-medium">{perfil.proyecto.director}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Codirector</p>
                <p className="text-gray-800 font-medium">
                  {perfil.proyecto.codirector ?? <span className="text-gray-400 italic">No registrado</span>}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Último reporte</p>
                <p className="text-gray-800 font-medium">
                  {perfil.proyecto.ultimo_reporte ?? <span className="text-gray-400 italic">Sin reportes</span>}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${proyectoEstadoColor[perfil.proyecto.estado] ?? "bg-gray-100 text-gray-600"}`}>
                  {proyectoEstadoLabel[perfil.proyecto.estado] ?? perfil.proyecto.estado}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <a href="/dashboard/estudiante/proyecto" className="text-sm text-green-700 font-semibold hover:underline">
              Ver detalle del proyecto →
            </a>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-700 text-sm">
          ⚠️ No tienes un proyecto de grado registrado aún.
        </div>
      )}

      {/* Solicitudes recientes */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">📋 Solicitudes Recientes</h2>
          <a href="/dashboard/estudiante/solicitudes" className="text-sm text-green-700 font-semibold hover:underline">
            Ver todas →
          </a>
        </div>
        {solicitudes.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No tienes solicitudes registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-medium">Radicado</th>
                  <th className="pb-3 font-medium">Tipo</th>
                  <th className="pb-3 font-medium">Fecha</th>
                  <th className="pb-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {solicitudes.map((s) => (
                  <tr key={s.radicado} className="hover:bg-gray-50">
                    <td className="py-3 font-mono text-xs text-gray-600">{s.radicado}</td>
                    <td className="py-3 text-gray-800">{s.tipo}</td>
                    <td className="py-3 text-gray-500">{s.fecha}</td>
                    <td className="py-3">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${estadoColor[s.estado] ?? "bg-gray-100 text-gray-600"}`}>
                        {s.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
