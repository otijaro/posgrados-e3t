"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getProgramas, crearSolicitudEvaluacion, getMiPerfil, Programa, EstudianteInfo } from "@/lib/api";
import { getMe, UserInfo } from "@/lib/auth";

// Tipos de evaluación según nivel del programa
const TIPOS_DOCTORADO = [
  "Examen de Candidatura",
  "Propuesta de Investigación",
  "Tesis Doctoral",
];

const TIPOS_MAESTRIA = [
  "Propuesta de Investigación",
  "Trabajo Final de Investigación",
];

function getTiposEvaluacion(programa: string | null | undefined): string[] {
  if (!programa) return [...TIPOS_DOCTORADO, ...TIPOS_MAESTRIA];
  const p = programa.toLowerCase();
  if (p.includes("doctorado")) return TIPOS_DOCTORADO;
  if (p.includes("maestría") || p.includes("maestria")) return TIPOS_MAESTRIA;
  return [...TIPOS_DOCTORADO, ...TIPOS_MAESTRIA];
}

type Jurado = { nombre: string; institucion: string; correo: string };
const juradoVacio = (): Jurado => ({ nombre: "", institucion: "", correo: "" });

type FormData = {
  titulo: string;
  resumen: string;
  tipo_evaluacion: string;
  documento: File | null;
};

type FormErrors = Partial<Record<keyof FormData, string>> & {
  jurados?: string;
  jurado_detalle?: Record<number, Partial<Jurado>>;
};

export default function SolicitudEvaluacionPage() {
  const [user, setUser]         = useState<UserInfo | null>(null);
  const [perfil, setPerfil]     = useState<EstudianteInfo | null>(null);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    titulo: "",
    resumen: "",
    tipo_evaluacion: "",
    documento: null,
  });

  const [jurados, setJurados]   = useState<Jurado[]>([juradoVacio(), juradoVacio(), juradoVacio()]);
  const [errors, setErrors]     = useState<FormErrors>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado]   = useState(false);
  const [radicado, setRadicado] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMe(), getMiPerfil(), getProgramas()])
      .then(([u, p, progs]) => {
        setUser(u);
        setPerfil(p);
        setProgramas(progs);
        if (p.proyecto?.titulo) {
          setForm((prev) => ({ ...prev, titulo: p.proyecto!.titulo }));
        }
      })
      .catch((e) => setErrorCarga(e.message))
      .finally(() => setCargando(false));
  }, []);

  // Resetear tipo_evaluacion si cambia el programa
  const tiposDisponibles = getTiposEvaluacion(perfil?.programa);

  // ── Jurados ───────────────────────────────────────────────────────────────

  function actualizarJurado(idx: number, campo: keyof Jurado, valor: string) {
    setJurados((prev) => prev.map((j, i) => i === idx ? { ...j, [campo]: valor } : j));
    setErrors((prev) => {
      const det = { ...(prev.jurado_detalle ?? {}) };
      if (det[idx]) det[idx] = { ...det[idx], [campo]: undefined };
      return { ...prev, jurado_detalle: det, jurados: undefined };
    });
  }

  function agregarJurado() {
    if (jurados.length < 6) setJurados((prev) => [...prev, juradoVacio()]);
  }

  function eliminarJurado(idx: number) {
    if (jurados.length > 3) setJurados((prev) => prev.filter((_, i) => i !== idx));
  }

  // ── Archivo ───────────────────────────────────────────────────────────────

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    if (file.type !== "application/pdf") { setErrors((p) => ({ ...p, documento: "Solo se permiten archivos PDF." })); return; }
    if (file.size > 20 * 1024 * 1024)    { setErrors((p) => ({ ...p, documento: "El archivo no puede superar 20 MB." })); return; }
    setForm((p) => ({ ...p, documento: file }));
    setNombreArchivo(file.name);
    setErrors((p) => ({ ...p, documento: undefined }));
  };

  // ── Validación ────────────────────────────────────────────────────────────

  const validar = (): boolean => {
    const e: FormErrors = {};
    if (!form.titulo.trim())             e.titulo = "El título es obligatorio.";
    if (!form.resumen.trim())            e.resumen = "El resumen es obligatorio.";
    if (form.resumen.trim().length < 50) e.resumen = "El resumen debe tener al menos 50 caracteres.";
    if (!form.tipo_evaluacion)           e.tipo_evaluacion = "Selecciona el tipo de evaluación.";
    if (!form.documento)                 e.documento = "Debes adjuntar el documento a evaluar.";

    const detalle: Record<number, Partial<Jurado>> = {};
    let hayErrorJurado = false;
    jurados.forEach((j, i) => {
      const d: Partial<Jurado> = {};
      if (!j.nombre.trim())      { d.nombre = "Requerido"; hayErrorJurado = true; }
      if (!j.institucion.trim()) { d.institucion = "Requerido"; hayErrorJurado = true; }
      if (!j.correo.trim())      { d.correo = "Requerido"; hayErrorJurado = true; }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(j.correo)) { d.correo = "Correo inválido"; hayErrorJurado = true; }
      if (Object.keys(d).length) detalle[i] = d;
    });
    if (hayErrorJurado) { e.jurados = "Completa todos los campos de los jurados."; e.jurado_detalle = detalle; }

    setErrors(e);
    return Object.keys(e).filter(k => k !== "jurado_detalle").length === 0;
  };

  // ── Envío ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validar()) return;
    setEnviando(true);
    setErrorServidor(null);
    try {
      const resultado = await crearSolicitudEvaluacion({
        titulo:           form.titulo,
        resumen:          form.resumen,
        posibles_jurados: jurados.map(j => `${j.nombre} | ${j.institucion} | ${j.correo}`).join("\n"),
        tipo_evaluacion:  form.tipo_evaluacion,
        id_programa:      programas.find(p => p.nombre === perfil?.programa)?.id ?? programas[0]?.id ?? 1,
        documento:        form.documento,
      });
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
          <p className="text-gray-500">Tu solicitud ha sido enviada exitosamente al comité de posgrados.</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left space-y-1 text-sm text-green-700">
            <p><span className="font-semibold">Radicado:</span> <span className="font-mono font-bold">{radicado}</span></p>
            <p><span className="font-semibold">Estudiante:</span> {user?.nombre_completo}</p>
            <p><span className="font-semibold">Tipo:</span> {form.tipo_evaluacion}</p>
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

  const CampoReadonly = ({ label, valor }: { label: string; valor: string | null | undefined }) => (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <div className={`w-full border rounded-lg px-4 py-2.5 text-sm border-gray-100 bg-gray-50 ${valor ? "text-gray-700" : "text-gray-400 italic"}`}>
        {valor ?? "No registrado"}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <Link href="/dashboard/estudiante/solicitudes" className="hover:text-green-700">Solicitudes</Link>
          <span>›</span>
          <Link href="/dashboard/estudiante/solicitudes/nueva" className="hover:text-green-700">Nueva Solicitud</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">Solicitud de Evaluación</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">🔍 Solicitud de Evaluación</h1>
        <p className="text-gray-500 mt-1">Revisa tu información y completa los campos requeridos.</p>
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
            <div className="md:col-span-2"><CampoReadonly label="Nombre Completo" valor={user?.nombre_completo} /></div>
            <CampoReadonly label="Correo Institucional" valor={user?.email_institucional} />
            <CampoReadonly label="Código Estudiantil"   valor={perfil?.codigo_estudiante} />
            <div className="md:col-span-2"><CampoReadonly label="Programa" valor={perfil?.programa} /></div>
          </div>
        </div>

        {/* ── 2. Datos del proyecto ── */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <h2 className="text-base font-bold text-gray-700">Datos del Proyecto</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CampoReadonly label="Director"   valor={perfil?.proyecto?.director} />
            <CampoReadonly label="Codirector" valor={perfil?.proyecto?.codirector} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Título del Trabajo <span className="text-red-500">*</span>
              <span className="ml-2 text-xs font-normal text-gray-400">Puedes modificarlo si es necesario</span>
            </label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => { setForm(p => ({ ...p, titulo: e.target.value })); setErrors(p => ({ ...p, titulo: undefined })); }}
              className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.titulo ? "border-red-400 bg-red-50" : "border-gray-200"}`}
            />
            {errors.titulo && <p className="text-red-500 text-xs mt-1">{errors.titulo}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Resumen <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.resumen}
              onChange={(e) => { setForm(p => ({ ...p, resumen: e.target.value })); setErrors(p => ({ ...p, resumen: undefined })); }}
              rows={5}
              placeholder="Describe el objetivo, metodología y resultados esperados (mínimo 50 caracteres)."
              className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${errors.resumen ? "border-red-400 bg-red-50" : "border-gray-200"}`}
            />
            <div className="flex justify-between mt-1">
              {errors.resumen ? <p className="text-red-500 text-xs">{errors.resumen}</p> : <span />}
              <p className="text-xs text-gray-400 ml-auto">{form.resumen.length} caracteres</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tipo de Evaluación <span className="text-red-500">*</span>
            </label>
            <select
              value={form.tipo_evaluacion}
              onChange={(e) => { setForm(p => ({ ...p, tipo_evaluacion: e.target.value })); setErrors(p => ({ ...p, tipo_evaluacion: undefined })); }}
              className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white ${errors.tipo_evaluacion ? "border-red-400" : "border-gray-200"}`}
            >
              <option value="">Seleccionar tipo...</option>
              {tiposDisponibles.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.tipo_evaluacion && <p className="text-red-500 text-xs mt-1">{errors.tipo_evaluacion}</p>}
          </div>
        </div>

        {/* ── 3. Posibles jurados ── */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <h2 className="text-base font-bold text-gray-700">Posibles Jurados</h2>
            </div>
            <span className="text-xs text-gray-400">Mínimo 3 · Máximo 6</span>
          </div>

          {errors.jurados && <p className="text-red-500 text-xs">⚠️ {errors.jurados}</p>}

          <div className="space-y-4">
            {jurados.map((j, idx) => {
              const det = errors.jurado_detalle?.[idx] ?? {};
              return (
                <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-600">Jurado {idx + 1}</p>
                    {jurados.length > 3 && (
                      <button onClick={() => eliminarJurado(idx)} className="text-xs text-red-400 hover:text-red-600 font-medium">
                        Eliminar
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(["nombre", "institucion", "correo"] as (keyof Jurado)[]).map((campo) => (
                      <div key={campo}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {campo === "nombre" ? "Nombre" : campo === "institucion" ? "Institución" : "Correo electrónico"} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type={campo === "correo" ? "email" : "text"}
                          value={j[campo]}
                          onChange={(e) => actualizarJurado(idx, campo, e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white ${det[campo] ? "border-red-400" : "border-gray-200"}`}
                        />
                        {det[campo] && <p className="text-red-500 text-xs mt-0.5">{det[campo]}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {jurados.length < 6 && (
            <button
              onClick={agregarJurado}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-colors font-medium"
            >
              + Agregar jurado ({jurados.length}/6)
            </button>
          )}
        </div>

        {/* ── 4. Documento ── */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <h2 className="text-base font-bold text-gray-700">Documento a Evaluar</h2>
          </div>
          <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${errors.documento ? "border-red-300 bg-red-50" : nombreArchivo ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-green-400 hover:bg-green-50"}`}>
            {nombreArchivo ? (
              <div className="space-y-2">
                <span className="text-4xl">📄</span>
                <p className="text-sm font-semibold text-green-700">{nombreArchivo}</p>
                <p className="text-xs text-green-600">Archivo cargado correctamente</p>
                <button onClick={() => { setNombreArchivo(null); setForm(p => ({ ...p, documento: null })); }} className="text-xs text-red-500 hover:underline">
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
            {enviando
              ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Enviando...</>
              : "Enviar Solicitud →"
            }
          </button>
        </div>
      </div>
    </div>
  );
}
