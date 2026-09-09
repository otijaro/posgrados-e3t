"use client";

import { useEffect, useState } from "react";
import { getMisEstudiantes, ResumenDirector } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Notificacion {
  tipo: "reporte" | "solicitud";
  prioridad: "alta" | "media";
  estudiante: string;
  codigo: string;
  descripcion: string;
  detalle: string;
  href: string;
}

export default function NotificacionesDirector() {
  const router = useRouter();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "reporte" | "solicitud">("todas");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    getMisEstudiantes()
      .then((data: ResumenDirector) => {
        const lista: Notificacion[] = [];

        data.estudiantes.forEach((est) => {
          // Reportes pendientes de aval
          est.reportes.forEach((r) => {
            if (r.aval_director === 0) {
              lista.push({
                tipo: "reporte",
                prioridad: "alta",
                estudiante: est.nombre_estudiante,
                codigo: est.codigo_estudiante,
                descripcion: `Reporte semestral pendiente de aval — Periodo ${r.periodo}`,
                detalle: `Entregado el ${r.fecha_carga || "fecha desconocida"}`,
                href: "/dashboard/director",
              });
            }
          });

          // Solicitudes pendientes
          est.solicitudes.forEach((s) => {
            if (s.estado === "enviada" || s.estado === "en_revision") {
              const tipoLabel: Record<string, string> = {
                credito_condonable: "Crédito Condonable",
                prorroga: "Prórroga",
                cambio_director: "Cambio de Director",
                cambio_titulo: "Cambio de Título",
                nombramiento_jurado: "Nombramiento Jurado",
                solicitud_grado: "Solicitud de Grado",
                otra: "Solicitud",
              };
              lista.push({
                tipo: "solicitud",
                prioridad: "media",
                estudiante: est.nombre_estudiante,
                codigo: est.codigo_estudiante,
                descripcion: `${tipoLabel[s.tipo_solicitud] || "Solicitud"} pendiente de revisión`,
                detalle: s.asunto,
                href: "/dashboard/director/solicitudes",
              });
            }
          });
        });

        setNotificaciones(lista);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtradas = notificaciones.filter(
    (n) => filtro === "todas" || n.tipo === filtro
  );

  const totalReportes = notificaciones.filter((n) => n.tipo === "reporte").length;
  const totalSolicitudes = notificaciones.filter((n) => n.tipo === "solicitud").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
        <p className="text-gray-500 text-sm mt-1">
          Tareas pendientes que requieren su atención
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-gray-800">{notificaciones.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total pendientes</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{totalReportes}</p>
          <p className="text-xs text-gray-500 mt-1">Reportes por avalar</p>
        </div>
        <div className="bg-white rounded-xl border border-orange-200 p-4 text-center">
          <p className="text-3xl font-bold text-orange-600">{totalSolicitudes}</p>
          <p className="text-xs text-gray-500 mt-1">Solicitudes por revisar</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5">
        {(["todas", "reporte", "solicitud"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtro === f
                ? "bg-green-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "todas" && `Todas (${notificaciones.length})`}
            {f === "reporte" && `Reportes (${totalReportes})`}
            {f === "solicitud" && `Solicitudes (${totalSolicitudes})`}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-gray-600 font-medium text-lg">Todo al día</p>
          <p className="text-gray-400 text-sm mt-1">No tiene tareas pendientes en este momento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((n, i) => (
            <Link key={i} href={n.href}>
              <div className={`bg-white rounded-xl border p-4 hover:shadow-md transition-shadow cursor-pointer ${
                n.prioridad === "alta"
                  ? "border-l-4 border-l-amber-400 border-gray-200"
                  : "border-l-4 border-l-orange-400 border-gray-200"
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`text-2xl mt-0.5`}>
                    {n.tipo === "reporte" ? "📄" : "📋"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800">{n.descripcion}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                        n.prioridad === "alta"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                        {n.prioridad === "alta" ? "⏳ Aval pendiente" : "📬 Por revisar"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{n.detalle}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      👤 {n.estudiante} · Cód. {n.codigo}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
