"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface EstudianteDocente {
  nombre: string;
  codigo: string;
  programa: string;
  titulo_proyecto: string;
  estado_proyecto: string;
  rol_docente: string;
  semestre: number;
}

interface Docente {
  id: number;
  nombre: string;
  email: string;
  roles: string[];
  como_director: number;
  como_codirector: number;
  total_estudiantes: number;
  grupo_investigacion: string | null;
  estudiantes: EstudianteDocente[];
}

const ESTADO_BADGE: Record<string, string> = {
  en_desarrollo:  "bg-blue-100 text-blue-700",
  propuesta:      "bg-yellow-100 text-yellow-700",
  en_evaluacion:  "bg-purple-100 text-purple-700",
  aprobado:       "bg-green-100 text-green-700",
  sustentado:     "bg-emerald-100 text-emerald-700",
  graduado:       "bg-gray-100 text-gray-600",
};

const ESTADO_LABEL: Record<string, string> = {
  en_desarrollo:  "En desarrollo",
  propuesta:      "Propuesta",
  en_evaluacion:  "En evaluación",
  aprobado:       "Aprobado",
  sustentado:     "Sustentado",
  graduado:       "Graduado",
};

function authH(): Record<string, string> {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function DocentesCoordinador() {
  const router = useRouter();
  const [docentes, setDocentes]   = useState<Docente[]>([]);
  const [loading, setLoading]     = useState(true);
  const [busqueda, setBusqueda]   = useState("");
  const [expandido, setExpandido] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetch(`${API_URL}/api/coordinador/docentes`, { headers: authH() })
      .then((r) => r.json())
      .then(setDocentes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtrados = docentes.filter((d) =>
    busqueda === "" ||
    d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.email.toLowerCase().includes(busqueda.toLowerCase()) ||
    (d.grupo_investigacion ?? "").toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">👨‍🏫 Docentes</h1>
        <p className="text-gray-500 text-sm mt-1">
          {docentes.length} docentes registrados como directores o codirectores
        </p>
      </div>

      <div className="mb-5">
        <input
          type="text"
          placeholder="Buscar por nombre, correo o grupo de investigación..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👨‍🏫</p>
          <p className="font-medium">No se encontraron docentes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtrados.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">

              {/* ── Cabecera clicable ── */}
              <div
                className="flex items-start gap-4 p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandido(expandido === doc.id ? null : doc.id)}
              >
                <div className="w-11 h-11 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {doc.nombre.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{doc.nombre}</p>
                  <p className="text-xs text-gray-500">{doc.email}</p>
                  {doc.grupo_investigacion && (
                    <p className="text-xs text-blue-600 mt-0.5">🔬 {doc.grupo_investigacion}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {doc.roles.map((r, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{r}</span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 flex-shrink-0 text-center">
                  <div className="bg-gray-50 rounded-lg px-3 py-2 min-w-[52px]">
                    <p className="text-lg font-bold text-gray-800">{doc.total_estudiantes}</p>
                    <p className="text-xs text-gray-400">Total</p>
                  </div>
                  <div className="bg-green-50 rounded-lg px-3 py-2 min-w-[52px]">
                    <p className="text-lg font-bold text-green-700">{doc.como_director}</p>
                    <p className="text-xs text-gray-400">Director</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg px-3 py-2 min-w-[52px]">
                    <p className="text-lg font-bold text-blue-700">{doc.como_codirector}</p>
                    <p className="text-xs text-gray-400">Codirector</p>
                  </div>
                  <div className="flex items-center pl-2">
                    <span className="text-gray-400 text-sm">{expandido === doc.id ? "▲" : "▼"}</span>
                  </div>
                </div>
              </div>

              {/* ── Lista expandida ── */}
              {expandido === doc.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-5">
                  {doc.estudiantes.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Sin estudiantes registrados</p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Estudiantes a cargo
                      </p>
                      {doc.estudiantes.map((est, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {est.nombre.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 text-sm">{est.nombre}</p>
                                <p className="text-xs text-gray-400">Cód. {est.codigo} · Semestre {est.semestre}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{est.programa}</p>
                                <p className="text-xs text-gray-600 mt-1 leading-relaxed italic">
                                  "{est.titulo_proyecto}"
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_BADGE[est.estado_proyecto] ?? "bg-gray-100 text-gray-600"}`}>
                                {ESTADO_LABEL[est.estado_proyecto] ?? est.estado_proyecto}
                              </span>
                              <span className="text-xs text-gray-400">
                                {est.rol_docente === "director" ? "🎓 Director" : "👤 Codirector"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
