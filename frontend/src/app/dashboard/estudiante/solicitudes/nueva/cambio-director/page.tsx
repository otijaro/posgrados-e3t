"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getMiPerfil, EstudianteInfo } from "@/lib/api";
import { getMe, UserInfo } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type Persona = { nombre: string; correo: string };
const personaVacia = (): Persona => ({ nombre: "", correo: "" });

type TipoCambio = "director" | "codirector" | "ambos";

type FormData = {
  tipo_cambio: TipoCambio | "";
  nuevo_director: Persona;
  nuevo_codirector: Persona;
  justificacion: string;
  documento: File | null;
};

type FormErrors = {
  tipo_cambio?: string;
  nuevo_director_nombre?: string;
  nuevo_director_correo?: string;
  nuevo_codirector_nombre?: string;
  nuevo_codirector_correo?: string;
  justificacion?: string;
  documento?: string;
};

export default function CambioDirectorPage() {
  const [user, setUser]     = useState<UserInfo | null>(null);
  const [perfil, setPerfil] = useState<EstudianteInfo | null>(null);
  const [cargando, setCargando]     = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    tipo_cambio:      "",
    nuevo_director:   personaVacia(),
    nuevo_codirector: personaVacia(),
    justificacion:    "",
    documento:        null,
  });

  const [errors, setErrors]         = useState<FormErrors>({});
  const [enviando, setEnviando]     = useState(false);
  const [enviado, setEnviado]       = useState(false);
  const [radicado, setRadicado]     = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMe(), getMiPerfil()])
      .then(([u, p]) => { setUser(u); setPerfil(p); })
      .catch((e) => setErrorCarga(e.message))
      .finally(() => setCargando(false));
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const esCorreoValido = (c: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);

  const cambiaDirector   = form.tipo_cambio === "director"   || form.tipo_cambio === "ambos";
  const cambiaCodirector = form.tipo_cambio === "codirector" || form.tipo_cambio === "ambos";

  // ── Archivo ───────────────────────────────────────────────────────────────

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErrors(p => ({ ...p, documento: "Solo se permiten archivos PDF." })); return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrors(p => ({ ...p, documento: "El archivo no puede superar 20 MB." })); return;
    }
    setForm(p => ({ ...p, documento: file }));
    setNombreArchivo(file.name);
    setErrors(p => ({ ...p, documento: undefined }));
  };

  // ── Validación ────────────────────────────────────────────────────────────

  const validar = (): boolean => {
    const e: FormErrors = {};

    if (!form.tipo_cambio)
      e.tipo_cambio = "Selecciona qué deseas cambiar.";

    if (cambiaDirector) {
      if (!form.nuevo_director.nombre.trim())
        e.nuevo_director_nombre = "El nombre del nuevo director es obligatorio.";
      if (!form.nuevo_director.correo.trim())
        e.nuevo_director_correo = "El correo del nuevo director es obligatorio.";
      else if (!esCorreoValido(form.nuevo_director.correo))
        e.nuevo_director_correo = "Correo inválido.";
    }

    if (cambiaCodirector) {
      if (!form.nuevo_codirector.nombre.trim())
        e.nuevo_codirector_nombre = "El nombre del nuevo codirector es obligatorio.";
      if (!form.nuevo_codirector.correo.trim())
        e.nuevo_codirector_correo = "El correo del nuevo codirector es obligatorio.";
      else if (!esCorreoValido(form.nuevo_codirector.correo))
        e.nuevo_codirector_correo = "Correo inválido.";
    }

    if (!form.justificacion.trim())
      e.justificacion = "La justificación es obligatoria.";
    else if (form.justificacion.trim().length < 30)
      e.justificacion = "La justificación debe tener al menos 30 caracteres.";

    if (!form.documento)
      e.documento = "Debes adjuntar el documento de soporte en PDF.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Envío ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validar()) return;
    setEnviando(true);
    setErrorServidor(null);

    try {
      const formData = new FormData();
      formData.append("tipo_cambio",   form.tipo_cambio);
      formData.append("justificacion", form.justificacion);
      if (cambiaDirector) {
        formData.append("nuevo_director",        form.nuevo_director.nombre);
        formData.append("nuevo_director_correo", form.nuevo_director.correo);
      }
      if (cambiaCodirector) {
        formData.append("nuevo_codirector",        form.nuevo_codirector.nombre);
        formData.append("nuevo_codirector_correo", form.nuevo_codirector.correo);
      }
      if (form.documento) formData.append("documento", form.documento);

      const res = await fetch(`${API_URL}/api/solicitudes/cambio-director`, {
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

  // ── Pantalla de éxito ─────────────────────────────────────────────────────

  if (enviado) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-10 text-center space-y-4">
          <div className="text-6xl">✅</div>
          <h2 className="text-2xl font-bold text-gray-800">¡Solicitud radicada!</h2>
          <p className="text-gray-500">Tu solicitud de cambio ha sido enviada exitosamente.</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left space-y-1 text-sm text-green-700">
            <p><span className="font-semibold">Radicado:</span> <span className="font-mono font-bold">{radicado}</span></p>
            <p><span className="font-semibold">Estudiante:</span> {user?.nombre_completo}</p>
            <p><span className="font-semibold">Tipo de cambio:</span> {
              form.tipo_cambio === "director" ? "Cambio de director" :
              form.tipo_cambio === "codirector" ? "Cambio de codirector" :
              "Cambio de director y codirector"
            }</p>
            {cambiaDirector && (
              <p><span className="font-semibold">Nuevo director:</span> {form.nuevo_director.nombre} · {form.nuevo_director.correo}</p>
            )}
            {cambiaCodirector && (
              <p><span className="font-semibold">Nuevo codirector:</span> {form.nuevo_codirector.nombre} · {form.nuevo_codirector.correo}</p>
            )}
            <p><span className="font-semibold">Documento:</span> {nombreArchivo}</p>
          </div>
          <Link
            href="/dashboard/estudiante/solicitudes"
            className="inline-block bg-green-700 text-white px-6 py-2.5 rounded-lg hover:bg-green-800 font-semibold text-sm"
          >
            Ver mis solicitudes
          </Link>
        </div>
      </div>
    );
  }

  if (cargando) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando información...</div>;
  if (errorCarga) return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">⚠️ {errorCarga}</div>;

  // ── Subcomponente persona ─────────────────────────────────────────────────

  const CampoReadonly = ({ label, valor }: { label: string; valor?: string | null }) => (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <div className={`w-full border rounded-lg px-4 py-2.5 text-sm border-gray-100 bg-gray-50 ${valor ? "text-gray-700" : "text-gray-400 italic"}`}>
        {valor ?? "No registrado"}
      </div>
    </div>
  );

  const CampoPersona = ({
    label, value, onChange, errorNombre, errorCorreo,
  }: {
    label: string;
    value: Persona;
    onChange: (campo: keyof Persona, val: string) => void;
    errorNombre?: string;
    errorCorreo?: string;
  }) => (
    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-3">
      <p className="text-sm font-semibold text-gray-600">{label}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={value.nombre}
            onChange={(e) => onChange("nombre", e.target.value)}
            placeholder="Nombre completo"
            className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white ${errorNombre ? "border-red-400" : "border-gray-200"}`}
          />
          {errorNombre && <p className="text-red-500 text-xs mt-0.5">{errorNombre}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Correo institucional <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={value.correo}
            onChange={(e) => onChange("correo", e.target.value)}
            placeholder="correo@uis.edu.co"
            className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white ${errorCorreo ? "border-red-400" : "border-gray-200"}`}
          />
          {errorCorreo && <p className="text-red-500 text-xs mt-0.5">{errorCorreo}</p>}
        </div>
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
          <span className="text-gray-700 font-medium">Cambio de Director / Codirector</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">👤 Cambio de Director / Codirector</h1>
        <p className="text-gray-500 mt-1">Solicita el cambio de director, codirector o ambos para tu trabajo de grado.</p>
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

        {/* ── 2. Dirección actual ── */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <h2 className="text-base font-bold text-gray-700">Dirección Actual</h2>
            <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Solo lectura</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CampoReadonly label="Director actual"   valor={perfil?.proyecto?.director} />
            <CampoReadonly label="Codirector actual" valor={perfil?.proyecto?.codirector} />
          </div>
        </div>

        {/* ── 3. Tipo de cambio ── */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <h2 className="text-base font-bold text-gray-700">¿Qué deseas cambiar?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {([
              { id: "director",   label: "Solo el Director",   icono: "👤" },
              { id: "codirector", label: "Solo el Codirector", icono: "👥" },
              { id: "ambos",      label: "Director y Codirector", icono: "🔄" },
            ] as { id: TipoCambio; label: string; icono: string }[]).map((op) => (
              <button
                key={op.id}
                onClick={() => { setForm(p => ({ ...p, tipo_cambio: op.id })); setErrors(p => ({ ...p, tipo_cambio: undefined })); }}
                className={`border-2 rounded-xl p-4 text-center transition-all ${
                  form.tipo_cambio === op.id
                    ? "border-green-600 bg-green-50 ring-2 ring-green-500 ring-offset-1"
                    : "border-gray-200 hover:border-green-300 hover:bg-green-50"
                }`}
              >
                <p className="text-2xl mb-1">{op.icono}</p>
                <p className="text-sm font-semibold text-gray-700">{op.label}</p>
              </button>
            ))}
          </div>
          {errors.tipo_cambio && <p className="text-red-500 text-xs">⚠️ {errors.tipo_cambio}</p>}
        </div>

        {/* ── 4. Nuevos datos (condicional) ── */}
        {form.tipo_cambio && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <h2 className="text-base font-bold text-gray-700">Nuevos Datos</h2>
            </div>

            {cambiaDirector && (
              <CampoPersona
                label="Nuevo Director"
                value={form.nuevo_director}
                onChange={(campo, val) => {
                  setForm(p => ({ ...p, nuevo_director: { ...p.nuevo_director, [campo]: val } }));
                  setErrors(p => ({ ...p, [`nuevo_director_${campo}`]: undefined }));
                }}
                errorNombre={errors.nuevo_director_nombre}
                errorCorreo={errors.nuevo_director_correo}
              />
            )}

            {cambiaCodirector && (
              <CampoPersona
                label="Nuevo Codirector"
                value={form.nuevo_codirector}
                onChange={(campo, val) => {
                  setForm(p => ({ ...p, nuevo_codirector: { ...p.nuevo_codirector, [campo]: val } }));
                  setErrors(p => ({ ...p, [`nuevo_codirector_${campo}`]: undefined }));
                }}
                errorNombre={errors.nuevo_codirector_nombre}
                errorCorreo={errors.nuevo_codirector_correo}
              />
            )}
          </div>
        )}

        {/* ── 5. Justificación ── */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {form.tipo_cambio ? "5" : "4"}
            </span>
            <h2 className="text-base font-bold text-gray-700">Justificación</h2>
          </div>
          <textarea
            value={form.justificacion}
            onChange={(e) => { setForm(p => ({ ...p, justificacion: e.target.value })); setErrors(p => ({ ...p, justificacion: undefined })); }}
            rows={4}
            placeholder="Explica los motivos por los cuales solicitas este cambio (mínimo 30 caracteres)."
            className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${errors.justificacion ? "border-red-400 bg-red-50" : "border-gray-200"}`}
          />
          <div className="flex justify-between">
            {errors.justificacion
              ? <p className="text-red-500 text-xs">{errors.justificacion}</p>
              : <span />}
            <p className="text-xs text-gray-400 ml-auto">{form.justificacion.length} caracteres</p>
          </div>
        </div>

        {/* ── 6. Documento ── */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {form.tipo_cambio ? "6" : "5"}
            </span>
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
                <button
                  onClick={() => { setNombreArchivo(null); setForm(p => ({ ...p, documento: null })); }}
                  className="text-xs text-red-500 hover:underline"
                >
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
