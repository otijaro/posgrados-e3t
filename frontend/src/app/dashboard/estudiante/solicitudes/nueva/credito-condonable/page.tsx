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

const MODALIDADES = [
  "Docencia Directa",
  "Asistente de Investigación",
  "Asistente de Docencia",
  "Otra modalidad (Acuerdo 350)",
];

function periodoActualSugerido(): string {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const periodo = hoy.getMonth() < 6 ? 1 : 2; // ene-jun = periodo 1, jul-dic = periodo 2
  return `${anio}-${periodo}`;
}

type FormErrors = {
  periodo?: string;
  modalidad?: string;
  materia_asignada?: string;
  horas_semanales?: string;
  justificacion?: string;
  carta_director?: string;
  certificado_notas?: string;
  paz_salvo?: string;
};

type CampoArchivo = "carta_director" | "certificado_notas" | "paz_salvo";

export default function CreditoCondonablePage() {
  const [user, setUser]     = useState<UserInfo | null>(null);
  const [perfil, setPerfil] = useState<EstudianteInfo | null>(null);
  const [cargando, setCargando]     = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [periodo, setPeriodo]               = useState(periodoActualSugerido());
  const [modalidad, setModalidad]           = useState("");
  const [materiaAsignada, setMateriaAsignada] = useState("");
  const [horasSemanales, setHorasSemanales]   = useState("");
  const [justificacion, setJustificacion]     = useState("");

  const [archivos, setArchivos] = useState<Record<CampoArchivo, File | null>>({
    carta_director: null, certificado_notas: null, paz_salvo: null,
  });

  const [errors, setErrors]               = useState<FormErrors>({});
  const [enviando, setEnviando]           = useState(false);
  const [enviado, setEnviado]             = useState(false);
  const [radicado, setRadicado]           = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMe(), getMiPerfil()])
      .then(([u, p]) => { setUser(u); setPerfil(p); })
      .catch((e) => setErrorCarga(e.message))
      .finally(() => setCargando(false));
  }, []);

  const esDocencia = modalidad === "Docencia Directa";

  function handleFile(campo: CampoArchivo, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErrors(p => ({ ...p, [campo]: "Solo se permiten archivos PDF." })); return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrors(p => ({ ...p, [campo]: "El archivo no puede superar 20 MB." })); return;
    }
    setArchivos(p => ({ ...p, [campo]: file }));
    setErrors(p => ({ ...p, [campo]: undefined }));
  }

  const ORDEN_CAMPOS = [
    "periodo", "modalidad", "materia_asignada", "horas_semanales",
    "justificacion", "carta_director",
  ];

  const validar = (): FormErrors => {
    const e: FormErrors = {};
    if (!/^\d{4}-[12]$/.test(periodo)) e.periodo = "Formato esperado: AAAA-1 o AAAA-2 (ej. 2026-2).";
    if (!modalidad)                    e.modalidad = "Selecciona la modalidad.";
    if (esDocencia && !materiaAsignada.trim())
                                        e.materia_asignada = "Indica la materia asignada.";
    if (esDocencia && (!horasSemanales || Number(horasSemanales) <= 0))
                                        e.horas_semanales = "Indica las horas semanales.";
    if (!justificacion.trim())         e.justificacion = "La justificación es obligatoria.";
    else if (justificacion.trim().length < 30)
                                        e.justificacion = "La justificación debe tener al menos 30 caracteres.";
    if (!archivos.carta_director)      e.carta_director = "Debes adjuntar la carta de aval del director.";
    return e;
  };

  const irAlPrimerError = (e: FormErrors) => {
    const primerCampo = ORDEN_CAMPOS.find((campo) => e[campo as keyof FormErrors]);
    if (!primerCampo) return;
    const el = document.querySelector<HTMLElement>(`[data-field="${primerCampo}"]`);
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.focus({ preventScroll: true }); }
  };

  const handleSubmit = async () => {
    const e = validar();
    setErrors(e);
    if (Object.keys(e).length > 0) { irAlPrimerError(e); return; }
    setEnviando(true);
    setErrorServidor(null);
    try {
      const formData = new FormData();
      formData.append("periodo_completo", periodo);
      formData.append("modalidad", modalidad);
      if (materiaAsignada) formData.append("materia_asignada", materiaAsignada);
      if (horasSemanales)  formData.append("horas_semanales", horasSemanales);
      formData.append("justificacion", justificacion);
      if (archivos.carta_director)    formData.append("carta_director", archivos.carta_director);
      if (archivos.certificado_notas) formData.append("certificado_notas", archivos.certificado_notas);
      if (archivos.paz_salvo)         formData.append("paz_salvo", archivos.paz_salvo);

      const res = await fetch(`${API_URL}/api/solicitudes/credito-condonable`, {
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
          <p className="text-gray-500">Tu solicitud de crédito condonable ha sido enviada exitosamente.</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left space-y-1 text-sm text-green-700">
            <p><span className="font-semibold">Radicado:</span> <span className="font-mono font-bold">{radicado}</span></p>
            <p><span className="font-semibold">Estudiante:</span> {user?.nombre_completo}</p>
            <p><span className="font-semibold">Periodo:</span> {periodo}</p>
            <p><span className="font-semibold">Modalidad:</span> {modalidad}</p>
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

  const CampoArchivoUI = ({ campo, label, requerido }: { campo: CampoArchivo; label: string; requerido?: boolean }) => (
    <div data-field={campo} tabIndex={-1}>
      <p className="text-sm font-medium text-gray-700 mb-1.5">
        {label} {requerido && <span className="text-red-500">*</span>}
      </p>
      <div className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
        errors[campo] ? "border-red-300 bg-red-50"
        : archivos[campo] ? "border-green-400 bg-green-50"
        : "border-gray-200 hover:border-green-400 hover:bg-green-50"
      }`}>
        {archivos[campo] ? (
          <div className="space-y-1.5">
            <span className="text-2xl">📄</span>
            <p className="text-xs font-semibold text-green-700">{archivos[campo]?.name}</p>
            <button onClick={() => setArchivos(p => ({ ...p, [campo]: null }))} className="text-xs text-red-500 hover:underline">
              Eliminar
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <span className="text-2xl">📂</span>
            <label className="cursor-pointer inline-block bg-green-700 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-green-800 font-semibold">
              Seleccionar PDF
              <input type="file" accept=".pdf" onChange={(e) => handleFile(campo, e)} className="hidden" />
            </label>
          </div>
        )}
      </div>
      {errors[campo] && <p className="text-red-500 text-xs mt-1">{errors[campo]}</p>}
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
          <span className="text-gray-700 font-medium">Crédito Condonable</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">💰 Crédito Condonable</h1>
        <p className="text-gray-500 mt-1">Solicita crédito condonable por docencia directa u otras modalidades, según el Acuerdo 350.</p>
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

        {/* ── 2. Periodo y modalidad ── */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <h2 className="text-base font-bold text-gray-700">Periodo y Modalidad</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Periodo académico <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={periodo}
                data-field="periodo"
                onChange={(e) => { setPeriodo(e.target.value); setErrors(p => ({ ...p, periodo: undefined })); }}
                placeholder="2026-2"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.periodo ? "border-red-400 bg-red-50" : "border-gray-200"}`}
              />
              {errors.periodo && <p className="text-red-500 text-xs mt-1">{errors.periodo}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Modalidad <span className="text-red-500">*</span>
              </label>
              <select
                value={modalidad}
                data-field="modalidad"
                onChange={(e) => { setModalidad(e.target.value); setErrors(p => ({ ...p, modalidad: undefined })); }}
                className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.modalidad ? "border-red-400 bg-red-50" : "border-gray-200"}`}
              >
                <option value="">Selecciona...</option>
                {MODALIDADES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              {errors.modalidad && <p className="text-red-500 text-xs mt-1">{errors.modalidad}</p>}
            </div>
          </div>

          {esDocencia && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Materia asignada <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={materiaAsignada}
                  data-field="materia_asignada"
                  onChange={(e) => { setMateriaAsignada(e.target.value); setErrors(p => ({ ...p, materia_asignada: undefined })); }}
                  placeholder="Nombre de la materia"
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.materia_asignada ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                />
                {errors.materia_asignada && <p className="text-red-500 text-xs mt-1">{errors.materia_asignada}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Horas semanales <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={horasSemanales}
                  data-field="horas_semanales"
                  onChange={(e) => { setHorasSemanales(e.target.value); setErrors(p => ({ ...p, horas_semanales: undefined })); }}
                  placeholder="4"
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.horas_semanales ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                />
                {errors.horas_semanales && <p className="text-red-500 text-xs mt-1">{errors.horas_semanales}</p>}
              </div>
            </div>
          )}
        </div>

        {/* ── 3. Justificación ── */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <h2 className="text-base font-bold text-gray-700">Justificación</h2>
          </div>
          <textarea
            value={justificacion}
            data-field="justificacion"
            onChange={(e) => { setJustificacion(e.target.value); setErrors(p => ({ ...p, justificacion: undefined })); }}
            rows={4}
            placeholder="Explica los motivos de tu solicitud de crédito condonable (mínimo 30 caracteres)."
            className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${errors.justificacion ? "border-red-400 bg-red-50" : "border-gray-200"}`}
          />
          <div className="flex justify-between">
            {errors.justificacion
              ? <p className="text-red-500 text-xs">{errors.justificacion}</p>
              : <span />}
            <p className="text-xs text-gray-400 ml-auto">{justificacion.length} caracteres</p>
          </div>
        </div>

        {/* ── 4. Documentos ── */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <h2 className="text-base font-bold text-gray-700">Documentos de Soporte</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CampoArchivoUI campo="carta_director" label="Carta aval del director" requerido />
            <CampoArchivoUI campo="certificado_notas" label="Certificado de notas" />
            <CampoArchivoUI campo="paz_salvo" label="Paz y salvo" />
          </div>
          <p className="text-xs text-gray-400">Solo archivos PDF · Máximo 20 MB por archivo</p>
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
