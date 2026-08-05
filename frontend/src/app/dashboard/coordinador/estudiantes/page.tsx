"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Estudiante {
  id: number;
  nombre: string;
  email: string;
  codigo: string;
  programa: string;
  semestre: number;
  estado: string;
  cohorte: string;
  fecha_max_graduacion: string | null;
  director: string | null;
  codirector: string | null;
  titulo_proyecto: string | null;
  estado_proyecto: string | null;
}

const ESTADO_BADGE: Record<string, string> = {
  activo:      "bg-green-100 text-green-700",
  condicional: "bg-yellow-100 text-yellow-700",
  graduado:    "bg-blue-100 text-blue-700",
  retirado:    "bg-red-100 text-red-700",
  reserva:     "bg-orange-100 text-orange-700",
};

function authH(): Record<string, string> {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function EstudiantesCoordinador() {
  const router = useRouter();
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading]         = useState(true);
  const [busqueda, setBusqueda]       = useState("");
  const [filtroProg, setFiltroProg]   = useState("Todos");
  const [expandido, setExpandido]     = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetch(`${API_URL}/api/coordinador/estudiantes`, { headers: authH() })
      .then((r) => r.json())
      .then(setEstudiantes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const programas = ["Todos", ...Array.from(new Set(estudiantes.map((e) => e.programa)))];

  const filtrados = estudiantes.filter((e) => {
    const coincideProg = filtroProg === "Todos" || e.programa === filtroProg;
    const coincideBusq = busqueda === "" ||
      e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.email.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.codigo.includes(busqueda);
    return coincideProg && coincideBusq;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🎓 Estudiantes</h1>
        <p className="text-gray-500 text-sm mt-1">
          {estudiantes.length} estudiantes registrados
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Buscar por nombre, correo o código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        />
        <select
          value={filtroProg}
          onChange={(e) => setFiltroProg(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
        >
          {programas.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🎓</p>
          <p className="font-medium">No se encontraron estudiantes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((est) => (
            <div key={est.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Fila principal */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandido(expandido === est.id ? null : est.id)}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {est.nombre.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                </div>

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 text-sm">{est.nombre}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ESTADO_BADGE[est.estado] ?? "bg-gray-100 text-gray-600"}`}>
                      {est.estado}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{est.email} · Cód. {est.codigo}</p>
                </div>

                {/* Info derecha */}
                <div className="text-right hidden sm:block flex-shrink-0">
                  <p className="text-xs font-medium text-gray-700">{est.programa}</p>
                  <p className="text-xs text-gray-400">Semestre {est.semestre} · {est.cohorte}</p>
                </div>

                <span className="text-gray-400 text-sm">{expandido === est.id ? "▲" : "▼"}</span>
              </div>

              {/* Detalle expandido */}
              {expandido === est.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Programa</p>
                      <p className="font-medium text-gray-700">{est.programa}</p>
                      <p className="text-xs text-gray-400 mt-2">Cohorte</p>
                      <p className="font-medium text-gray-700">{est.cohorte}</p>
                      <p className="text-xs text-gray-400 mt-2">Semestre actual</p>
                      <p className="font-medium text-gray-700">{est.semestre}</p>
                      {est.fecha_max_graduacion && (
                        <>
                          <p className="text-xs text-gray-400 mt-2">Fecha máx. graduación</p>
                          <p className="font-medium text-gray-700">{est.fecha_max_graduacion}</p>
                        </>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Director</p>
                      <p className="font-medium text-gray-700">{est.director ?? "Sin asignar"}</p>
                      <p className="text-xs text-gray-400 mt-2">Codirector</p>
                      <p className="font-medium text-gray-700">{est.codirector ?? "No aplica"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Título del proyecto</p>
                      <p className="font-medium text-gray-700 text-xs leading-relaxed">{est.titulo_proyecto ?? "Sin registrar"}</p>
                      {est.estado_proyecto && (
                        <>
                          <p className="text-xs text-gray-400 mt-2">Estado del proyecto</p>
                          <p className="font-medium text-gray-700 capitalize">{est.estado_proyecto.replace("_", " ")}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
