"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { getMisEstudiantes, darAvalReporte, ResumenDirector, EstudianteACargo } from "@/lib/api";
import { getMe } from "@/lib/auth";
import { useRouter } from "next/navigation";

// ─── Helpers ──────────────────────────────────────────────────

function estadoBadge(estado: string) {
  const map: Record<string, string> = {
    propuesta: "bg-yellow-100 text-yellow-800",
    en_desarrollo: "bg-blue-100 text-blue-800",
    en_evaluacion: "bg-purple-100 text-purple-800",
    aprobado: "bg-green-100 text-green-800",
    sustentado: "bg-emerald-100 text-emerald-800",
    graduado: "bg-gray-100 text-gray-700",
    enviada: "bg-orange-100 text-orange-800",
    en_revision: "bg-yellow-100 text-yellow-800",
    aprobada: "bg-green-100 text-green-800",
    rechazada: "bg-red-100 text-red-800",
  };
  return map[estado] || "bg-gray-100 text-gray-600";
}

function estadoLabel(estado: string) {
  const map: Record<string, string> = {
    propuesta: "Propuesta",
    en_desarrollo: "En desarrollo",
    en_evaluacion: "En evaluación",
    aprobado: "Aprobado",
    sustentado: "Sustentado",
    graduado: "Graduado",
    enviada: "Enviada",
    en_revision: "En revisión",
    aprobada: "Aprobada",
    rechazada: "Rechazada",
    borrador: "Borrador",
    cancelada: "Cancelada",
  };
  return map[estado] || estado;
}

function tipoSolicitudLabel(tipo: string) {
  const map: Record<string, string> = {
    credito_condonable: "Crédito Condonable",
    prorroga: "Prórroga",
    cambio_director: "Cambio de Director",
    cambio_titulo: "Cambio de Título",
    nombramiento_jurado: "Nombramiento Jurado",
    solicitud_grado: "Solicitud de Grado",
    otra: "Otra",
  };
  return map[tipo] || tipo;
}

// ─── Componente tarjeta de estudiante ─────────────────────────

function TarjetaEstudiante({
  est,
  onAval,
}: {
  est: EstudianteACargo;
  onAval: (reporteId: number) => void;
}) {
  const solicitudesRef = useRef<HTMLDivElement>(null);
  const scrollASolicitudes = () => solicitudesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Cabecera */}
      <div className="flex items-start justify-between p-5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm">
              {est.nombre_estudiante.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{est.nombre_estudiante}</p>
              <p className="text-xs text-gray-500">{est.email_estudiante} · Cód. {est.codigo_estudiante}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600 font-medium">{est.titulo_proyecto}</p>
          <p className="text-xs text-gray-400 mt-0.5">{est.programa} · Semestre {est.semestre_actual}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${estadoBadge(est.estado_proyecto)}`}>
            {estadoLabel(est.estado_proyecto)}
          </span>
          <span className="text-xs text-gray-400 capitalize">
            {est.rol_docente === "director" ? "🎓 Director" : "👤 Codirector"}
          </span>
        </div>
      </div>

      {/* Alertas rápidas — clicables, llevan a la sección correspondiente más abajo */}
      {(est.reportes_pendientes > 0 || est.solicitudes_pendientes > 0) && (
        <div className="flex gap-2 px-5 py-2 bg-amber-50 border-b border-amber-100">
          {est.reportes_pendientes > 0 && (
            <button className="text-xs text-amber-700 font-medium hover:underline">
              ⏳ {est.reportes_pendientes} reporte{est.reportes_pendientes > 1 ? "s" : ""} pendiente{est.reportes_pendientes > 1 ? "s" : ""} de aval
            </button>
          )}
          {est.solicitudes_pendientes > 0 && (
            <button onClick={scrollASolicitudes} className="text-xs text-orange-700 font-medium hover:underline">
              📋 {est.solicitudes_pendientes} solicitud{est.solicitudes_pendientes > 1 ? "es" : ""} pendiente{est.solicitudes_pendientes > 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {/* Todo el contenido, sin pestañas — visible de una sola vez */}
      <div className="p-5 space-y-6">

        {/* Resumen rápido */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-0.5">Reportes entregados</p>
            <p className="font-bold text-gray-800">{est.reportes.length}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-0.5">Reportes con aval</p>
            <p className="font-bold text-green-700">{est.reportes.filter(r => r.aval_director === 1).length}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-0.5">Solicitudes activas</p>
            <p className="font-bold text-gray-800">{est.solicitudes.length}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-0.5">Evaluaciones</p>
            <p className="font-bold text-gray-800">{est.evaluaciones.length}</p>
          </div>
        </div>

        {/* Reportes */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Reportes ({est.reportes.length})</p>
          <div className="space-y-3">
            {est.reportes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin reportes registrados</p>
            ) : (
              est.reportes.map((r, i) => (
                <div key={i} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Periodo {r.periodo}</p>
                    <p className="text-xs text-gray-400">Entregado: {r.fecha_carga || "—"}</p>
                    {r.observaciones_director && (
                      <p className="text-xs text-gray-500 mt-1">Obs: {r.observaciones_director}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {r.aval_director === 1 ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        ✓ Avalado
                      </span>
                    ) : (
                      <button
                        onClick={() => onAval(i)}
                        className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1 rounded-full font-medium transition-colors"
                      >
                        Dar aval
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Solicitudes */}
        <div ref={solicitudesRef}>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Solicitudes ({est.solicitudes.length})</p>
          <div className="space-y-3">
            {est.solicitudes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin solicitudes registradas</p>
            ) : (
              est.solicitudes.map((s) => (
                <Link key={s.id} href={`/dashboard/director/solicitudes/${s.id}`}
                  className="flex items-center justify-between border border-gray-100 rounded-lg p-3 hover:border-green-300 hover:bg-green-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{tipoSolicitudLabel(s.tipo_solicitud)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.asunto}</p>
                    <p className="text-xs text-gray-400">{s.numero_radicado || "Sin radicado"} · {s.fecha_creacion}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${estadoBadge(s.estado)}`}>
                    {estadoLabel(s.estado)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Evaluaciones */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Evaluaciones ({est.evaluaciones.length})</p>
          <div className="space-y-3">
            {est.evaluaciones.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin evaluaciones registradas</p>
            ) : (
              est.evaluaciones.map((e, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{e.nombre_evaluador}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {e.tipo_evaluacion?.replace("_", " ") || "—"} · Asignado: {e.fecha_asignacion || "—"}
                      </p>
                    </div>
                    {e.concepto && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${estadoBadge(e.concepto)}`}>
                        {e.concepto}
                      </span>
                    )}
                  </div>
                  {e.calificacion && (
                    <p className="text-sm font-bold text-green-700 mt-1">Calificación: {e.calificacion}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────

export default function DashboardDirector() {
  const router = useRouter();
  const [data, setData] = useState<ResumenDirector | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "director" | "codirector">("todos");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    // Obtener nombre completo desde la BD vía /auth/me
    getMe().then((u) => {
      if (u) setNombre(u.nombre_completo);
    });

    getMisEstudiantes()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAval = async (proyectoIdx: number, reporteIdx: number) => {
    alert("Funcionalidad de aval disponible cuando los reportes tengan ID en la BD");
  };

  const estudiantesFiltrados = (data?.estudiantes.filter((e) => {
    const coincideFiltro =
      filtro === "todos" ||
      (filtro === "director" && e.rol_docente === "director") ||
      (filtro === "codirector" && e.rol_docente === "codirector");
    const coincideBusqueda =
      busqueda === "" ||
      e.nombre_estudiante.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.titulo_proyecto.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.codigo_estudiante.includes(busqueda);
    return coincideFiltro && coincideBusqueda;
  }) ?? []).sort((a, b) => {
    // Estudiantes con solicitudes o reportes pendientes primero
    const pendientesA = (a.solicitudes_pendientes > 0 ? 1 : 0) + (a.reportes_pendientes > 0 ? 1 : 0);
    const pendientesB = (b.solicitudes_pendientes > 0 ? 1 : 0) + (b.reportes_pendientes > 0 ? 1 : 0);
    return pendientesB - pendientesA;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando estudiantes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">Error al cargar datos</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-red-700 underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Encabezado */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenido, {nombre || "..."}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Panel de gestión — estudiantes a cargo
          </p>
        </div>
        <Link href="/dashboard/director/historial"
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 font-semibold text-sm">
          📚 Historial de Solicitudes
        </Link>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-green-700">{data?.total_estudiantes ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Estudiantes totales</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{data?.como_director ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Como director</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-indigo-600">{data?.como_codirector ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Como codirector</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{data?.reportes_pendientes_aval ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Reportes por avalar</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre, código o título..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        />
        <div className="flex gap-2">
          {(["todos", "director", "codirector"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                filtro === f
                  ? "bg-green-700 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "todos" ? "Todos" : f === "director" ? "Director" : "Codirector"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de estudiantes */}
      {estudiantesFiltrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👨‍🎓</p>
          <p className="font-medium">
            {data?.total_estudiantes === 0
              ? "No tiene estudiantes registrados a cargo"
              : "No hay estudiantes que coincidan con el filtro"}
          </p>
          <p className="text-sm mt-1 text-gray-300">
            {data?.total_estudiantes === 0
              ? "Los estudiantes aparecerán aquí cuando sean asignados en la BD"
              : "Prueba con otro filtro o búsqueda"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {estudiantesFiltrados.map((est, idx) => (
            <TarjetaEstudiante
              key={est.id_proyecto}
              est={est}
              onAval={(reporteIdx) => handleAval(idx, reporteIdx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
