"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Mapa: valor de datos_formulario.tipo → ruta del formulario "nueva" correspondiente.
const RUTA_POR_TIPO: Record<string, string> = {
  registrar_tema:     "/dashboard/estudiante/solicitudes/nueva/registrar-tema",
  evaluacion:         "/dashboard/estudiante/solicitudes/nueva/evaluacion",
  cambio_titulo:      "/dashboard/estudiante/solicitudes/nueva/cambio-titulo",
  cambio_director:    "/dashboard/estudiante/solicitudes/nueva/cambio-director",
  credito_condonable: "/dashboard/estudiante/solicitudes/nueva/credito-condonable",
};

interface SolicitudDetalle {
  id: number;
  numero_radicado: string;
  tipo_solicitud: string;
  asunto: string;
  descripcion: string;
  estado: string;
  fecha_creacion: string | null;
  documento: string | null;
  datos_formulario: { tipo?: string } | null;
}

export default function EditarSolicitudRedirector() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [solicitud, setSolicitud] = useState<SolicitudDetalle | null>(null);
  const [cargando, setCargando]   = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Solo se usan si NO hay datos_formulario (solicitudes antiguas, sin formulario tipado guardado)
  const [asunto, setAsunto]           = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nuevoDocumento, setNuevoDocumento] = useState<File | null>(null);
  const [errorDocumento, setErrorDocumento] = useState<string | null>(null);
  const [guardando, setGuardando]   = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [guardado, setGuardado]     = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/api/solicitudes/${id}`)
      .then((r) => {
        if (r.status === 404) throw new Error("No se encontró la solicitud.");
        if (!r.ok) throw new Error("Error al cargar la solicitud.");
        return r.json();
      })
      .then((data: SolicitudDetalle) => {
        const tipo = data.datos_formulario?.tipo;
        if (tipo && RUTA_POR_TIPO[tipo]) {
          // Formulario tipado disponible → reabrir el mismo formulario de creación, precargado.
          router.replace(`${RUTA_POR_TIPO[tipo]}?editar=${id}`);
          return;
        }
        // Solicitud antigua sin datos_formulario → fallback genérico (edición de texto libre).
        setSolicitud(data);
        setAsunto(data.asunto ?? "");
        setDescripcion(data.descripcion ?? "");
        setCargando(false);
      })
      .catch((e: Error) => { setErrorCarga(e.message); setCargando(false); });
  }, [id, router]);

  function handleDocumento(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErrorDocumento("Solo se permiten archivos PDF.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrorDocumento("El archivo no puede superar 20 MB.");
      return;
    }
    setNuevoDocumento(file);
    setErrorDocumento(null);
  }

  async function handleGuardar() {
    if (!id) return;
    setGuardando(true);
    setErrorGuardar(null);
    try {
      const formData = new FormData();
      formData.append("asunto", asunto);
      formData.append("descripcion", descripcion);
      if (nuevoDocumento) formData.append("documento", nuevoDocumento);

      const res = await fetch(`${API_URL}/api/solicitudes/${id}/editar`, {
        method: "PUT",
        headers: authHeaders(),
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "No se pudo guardar la solicitud.");
      }
      setGuardado(true);
      setTimeout(() => router.push("/dashboard/estudiante/solicitudes"), 1500);
    } catch (err: unknown) {
      setErrorGuardar(err instanceof Error ? err.message : "Error al guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Cargando solicitud...</div>;
  }

  if (errorCarga || !solicitud) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">
          ⚠️ {errorCarga ?? "No se encontró la solicitud."}
        </div>
        <Link href="/dashboard/estudiante/solicitudes" className="text-green-700 text-sm font-semibold hover:underline">
          ← Volver a mis solicitudes
        </Link>
      </div>
    );
  }

  if (guardado) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-10 text-center space-y-4">
          <div className="text-6xl">✅</div>
          <h2 className="text-2xl font-bold text-gray-800">¡Cambios guardados!</h2>
          <p className="text-gray-500">Te llevamos de vuelta a tus solicitudes...</p>
        </div>
      </div>
    );
  }

  // Fallback para solicitudes antiguas sin datos_formulario estructurado.
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <Link href="/dashboard/estudiante/solicitudes" className="hover:text-green-700">Solicitudes</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">Editar</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">✏️ Editar Solicitud</h1>
        <p className="text-gray-500 mt-1">
          Esta solicitud es anterior a la actualización del sistema, así que no tiene un formulario
          específico guardado — puedes editar el texto completo directamente.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Radicado</p>
            <p className="text-sm font-mono text-gray-700">{solicitud.numero_radicado}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Tipo</p>
            <p className="text-sm text-gray-700">{solicitud.tipo_solicitud}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Fecha de creación</p>
            <p className="text-sm text-gray-700">{solicitud.fecha_creacion ?? "—"}</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Asunto</label>
            <input
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800
                         focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contenido de la solicitud</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={12}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 font-mono
                         focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1.5">Documento adjunto</p>
            {solicitud.documento && !nuevoDocumento && (
              <a
                href={`${API_URL}${solicitud.documento}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-green-700 hover:underline mb-3"
              >
                📄 Ver documento actual
              </a>
            )}
            <div className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
              errorDocumento ? "border-red-300 bg-red-50"
              : nuevoDocumento ? "border-green-400 bg-green-50"
              : "border-gray-200 hover:border-green-400 hover:bg-green-50"
            }`}>
              {nuevoDocumento ? (
                <div className="space-y-1.5">
                  <span className="text-2xl">📄</span>
                  <p className="text-xs font-semibold text-green-700">{nuevoDocumento.name}</p>
                  <button onClick={() => setNuevoDocumento(null)} className="text-xs text-red-500 hover:underline">
                    Cancelar reemplazo
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <span className="text-2xl">📂</span>
                  <label className="cursor-pointer inline-block bg-green-700 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-green-800 font-semibold">
                    Reemplazar documento (PDF)
                    <input type="file" accept=".pdf" onChange={handleDocumento} className="hidden" />
                  </label>
                </div>
              )}
            </div>
            {errorDocumento && <p className="text-red-500 text-xs mt-1">{errorDocumento}</p>}
          </div>
        </div>

        {errorGuardar && (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">⚠️ {errorGuardar}</div>
          </div>
        )}

        <div className="p-6 flex items-center justify-between bg-gray-50 rounded-b-xl">
          <Link href="/dashboard/estudiante/solicitudes" className="text-sm text-gray-500 hover:text-gray-700 font-medium">
            ← Cancelar
          </Link>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className={`bg-green-700 text-white px-8 py-3 rounded-lg font-semibold text-sm transition-colors ${
              guardando ? "opacity-70 cursor-not-allowed" : "hover:bg-green-800"
            }`}
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
