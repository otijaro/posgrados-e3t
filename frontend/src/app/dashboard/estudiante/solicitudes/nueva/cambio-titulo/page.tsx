"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getMiPerfil, EstudianteInfo } from "@/lib/api";
import { getMe, UserInfo } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type FormErrors = {
  nuevo_titulo?: string;
  justificacion?: string;
  documento?: string;
};

export default function CambioTituloPage() {
  const [user, setUser]     = useState<UserInfo | null>(null);
  const [perfil, setPerfil] = useState<EstudianteInfo | null>(null);
  const [cargando, setCargando]     = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [nuevoTitulo, setNuevoTitulo]       = useState("");
  const [justificacion, setJustificacion]   = useState("");
  const [documento, setDocumento]           = useState<File | null>(null);
  const [nombreArchivo, setNombreArchivo]   = useState<string | null>(null);
  const [errors, setErrors]                 = useState<FormErrors>({});
  const [enviando, setEnviando]             = useState(false);
  const [enviado, setEnviado]               = useState(false);
  const [radicado, setRadicado]             = useState<string | null>(null);
  const [errorServidor, setErrorServidor]   = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMe(), getMiPerfil()])
      .then(([u, p]) => { setUser(u); setPerfil(p); })
      .catch((e) => setErrorCarga(e.message))
      .finally(() => setCargando(false));
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErrors(p => ({ ...p, documento: "Solo se permiten archivos PDF." })); return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrors(p => ({ ...p, documento: "El archivo no puede superar 20 MB." })); return;
    }
    setDocumento(file);
    setNombreArchivo(file.name);
    setErrors(p => ({ ...p, documento: undefined }));
  };

  const validar = (): boolean => {
    const e: FormErrors = {};
    if (!nuevoTitulo.trim())       e.nuevo_titulo = "El nuevo título es obligatorio.";
    if (!justificacion.trim())     e.justificacion = "La justificación es obligatoria.";
    else if (justificacion.trim().length < 30)
                                   e.justificacion = "La justificación debe tener al menos 30 caracteres.";
    if (!documento)                e.documento = "Debes adjuntar el documento de soporte en PDF.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validar()) return;
    setEnviando(true);
    setErrorServidor(null);
    try {
      const formData = new FormData();
      formData.append("nuevo_titulo",  nuevoTitulo);
      formData.append("justificacion", justificacion);
      if (documento) formData.append("documento", documento);

      const res = await fetch(`${API_URL}/api/solicitudes/cambio-titulo`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Error al enviar la solicitud.");
      }
      const resultado = await res.json();
      setRadicado(resultado.numero_radicado);
      setEnviado(true);
    } catch (err: unknown) {
      setErrorServidor(err instanceof Error ? err.message : "Error al enviar la solicitud.");
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-10 text-center space-y-4">
          <div className="text-6xl">✅</div>
          <h2 className="text-2xl font-bold text-gray-800">¡Solicitud radicada!</h2>
          <p className="text-gray-500">Tu solicitud de cambio de título ha sido enviada exitosamente.</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left space-y-1 text-sm text-green-700">
            <p><span className="font-semibold">Radicado:</span> <span className="font-mono font-bold">{radicado}</span></p>
            <p><span className="font-semibold">Estudiante:</span> {user?.nombre_completo}</p>
            <p><span className="font-semibold">Título anterior:</span> {perfil?.proyecto?.titulo ?? "—"}</p>
            <p><span className="font-semibold">Nuevo título:</span> {nuevoTitulo}</p>
            <p><span className="font-semibold">Documento:</span> {nombreArchivo}</p>
          </div>
          <Link href="/dashboard/estudiante/solicitudes" className="inline-block bg-green-700 text-white px-6 py-2.5 rounded-lg hover:bg-green-800 font-semibold text-sm">
            Ver mis solicitudes
          </Link>
        </div>
      </div>
    );
  }

  if (cargando) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando información...</div>;
  if (errorCarga) return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">⚠️ {errorCarga}</div>;

  const CampoReadonly = ({ label, valor }: { label: string; valor?: string | null }) => (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <div className={`w-full border rounded-lg px-4 py-2.5 text-sm border-gray-100 bg-gray-50 ${valor ? "text-gray-700" : "text-gray-400 italic"}`}>
        {valor ?? "No registrado"}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <Link href="/dashboard/estudiante/solicitudes" className="hover:text-green-700">Solicitudes</Link>
          <span>›</span>
          <Link href="/dashboard/estudiante/solicitudes/nueva" className="hover:text-green-700">Nueva Solicitud</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">Cambio de Título</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">✏️ Cambio de Título</h1>
        <p className="text-gray-500 mt-1">Solicita la modificación del título de tu trabajo de grado o tesis.</p>
      </div>

      {errorServidor && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">⚠️ {errorServidor}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">

        {/* ── 1. Datos del estudiante ── */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <h2 className="text-base font-bold text-gray-700">Datos del Estudiante</h2>
            <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Solo lectura</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <CampoReadonly label="Nombre Completo" valor={user?.nombre_completo} />
            </div>
            <CampoReadonly label="Correo Institucional" valor={user?.email_institucional} />
            <CampoReadonly label="Código Estudiantil"   valor={perfil?.codigo_estudiante} />
            <div className="md:col-span-2">
              <CampoReadonly label="Programa" valor={perfil?.programa} />
            </div>
          </div>
        </div>

        {/* ── 2. Título actual ── */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <h2 className="text-base font-bold text-gray-700">Título Actual</h2>
            <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Solo lectura</span>
          </div>
          <CampoReadonly label="Título registrado en la BD" valor={perfil?.proyecto?.titulo} />
        </div>

        {/* ── 3. Nuevo título ── */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <h2 className="text-base font-bold text-gray-700">Nuevo Título</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nuevo título propuesto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nuevoTitulo}
              onChange={(e) => { setNuevoTitulo(e.target.value); setErrors(p => ({ ...p, nuevo_titulo: undefined })); }}
              placeholder="Escribe el nuevo título completo del trabajo de grado"
              className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.nuevo_titulo ? "border-red-400 bg-red-50" : "border-gray-200"}`}
            />
            {errors.nuevo_titulo && <p className="text-red-500 text-xs mt-1">{errors.nuevo_titulo}</p>}
          </div>
        </div>

        {/* ── 4. Justificación ── */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <h2 className="text-base font-bold text-gray-700">Justificación</h2>
          </div>
          <textarea
            value={justificacion}
            onChange={(e) => { setJustificacion(e.target.value); setErrors(p => ({ ...p, justificacion: undefined })); }}
            rows={4}
            placeholder="Explica los motivos por los cuales solicitas el cambio de título (mínimo 30 caracteres)."
            className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${errors.justificacion ? "border-red-400 bg-red-50" : "border-gray-200"}`}
          />
          <div className="flex justify-between">
            {errors.justificacion
              ? <p className="text-red-500 text-xs">{errors.justificacion}</p>
              : <span />}
            <p className="text-xs text-gray-400 ml-auto">{justificacion.length} caracteres</p>
          </div>
        </div>

        {/* ── 5. Documento ── */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
            <h2 className="text-base font-bold text-gray-700">Documento de Soporte</h2>
          </div>
          <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            errors.documento ? "border-red-300 bg-red-50"
            : nombreArchivo  ? "border-green-400 bg-green-50"
            : "border-gray-200 hover:border-green-400 hover:bg-green-50"
          }`}>
            {nombreArchivo ? (
              <div className="space-y-2">
                <span className="text-4xl">📄</span>
                <p className="text-sm font-semibold text-green-700">{nombreArchivo}</p>
                <p className="text-xs text-green-600">Archivo cargado correctamente</p>
                <button onClick={() => { setNombreArchivo(null); setDocumento(null); }} className="text-xs text-red-500 hover:underline">
                  Eliminar y cargar otro
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-4xl">📂</span>
                <div>
                  <p className="text-sm font-medium text-gray-700">Arrastra tu archivo aquí o</p>
                  <label className="cursor-pointer mt-2 inline-block bg-green-700 text-white text-sm px-5 py-2 rounded-lg hover:bg-green-800 transition-colors font-semibold">
                    Seleccionar PDF
                    <input type="file" accept=".pdf" onChange={handleFile} className="hidden" />
                  </label>
                </div>
                <p className="text-xs text-gray-400">Solo archivos PDF · Máximo 20 MB</p>
              </div>
            )}
          </div>
          {errors.documento && <p className="text-red-500 text-xs">{errors.documento}</p>}
        </div>

        {/* ── Botones ── */}
        <div className="p-6 flex items-center justify-between bg-gray-50 rounded-b-xl">
          <Link href="/dashboard/estudiante/solicitudes/nueva" className="text-sm text-gray-500 hover:text-gray-700 font-medium">
            ← Volver
          </Link>
          <button
            onClick={handleSubmit}
            disabled={enviando}
            className={`flex items-center gap-2 bg-green-700 text-white px-8 py-3 rounded-lg font-semibold text-sm transition-colors ${enviando ? "opacity-70 cursor-not-allowed" : "hover:bg-green-800"}`}
          >
            {enviando ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Enviando...
              </>
            ) : "Enviar Solicitud →"}
          </button>
        </div>
      </div>
    </div>
  );
}
