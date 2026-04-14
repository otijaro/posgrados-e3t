"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getProgramas, crearSolicitudEvaluacion, Programa } from "@/lib/api";

const tiposEvaluacion = [
  "Propuesta de Investigación",
  "Trabajo Final de Investigación",
  "Tesis Doctoral",
  "Examen de Candidatura",
];

type FormData = {
  nombre_completo: string;
  codigo: string;
  director: string;
  codirector: string;
  titulo: string;
  resumen: string;
  posibles_jurados: string;
  programa: string;
  tipo_evaluacion: string;
  documento: File | null;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function SolicitudEvaluacionPage() {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [cargandoProgramas, setCargandoProgramas] = useState(true);
  const [form, setForm] = useState<FormData>({
    nombre_completo: "", codigo: "", director: "", codirector: "",
    titulo: "", resumen: "", posibles_jurados: "", programa: "",
    tipo_evaluacion: "", documento: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [radicado, setRadicado] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);

  useEffect(() => {
    getProgramas()
      .then(setProgramas)
      .catch(() => setErrorServidor("No se pudo conectar al servidor."))
      .finally(() => setCargandoProgramas(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.type !== "application/pdf") { setErrors((prev) => ({ ...prev, documento: "Solo se permiten archivos PDF." })); return; }
      if (file.size > 20 * 1024 * 1024) { setErrors((prev) => ({ ...prev, documento: "El archivo no puede superar 20 MB." })); return; }
      setForm((prev) => ({ ...prev, documento: file }));
      setNombreArchivo(file.name);
      setErrors((prev) => ({ ...prev, documento: undefined }));
    }
  };

  const validar = (): boolean => {
    const e: FormErrors = {};
    if (!form.nombre_completo.trim()) e.nombre_completo = "El nombre completo es obligatorio.";
    if (!form.codigo.trim()) e.codigo = "El código es obligatorio.";
    if (!form.director.trim()) e.director = "El director es obligatorio.";
    if (!form.titulo.trim()) e.titulo = "El título del trabajo es obligatorio.";
    if (!form.resumen.trim()) e.resumen = "El resumen es obligatorio.";
    if (form.resumen.trim().length < 50) e.resumen = "El resumen debe tener al menos 50 caracteres.";
    if (!form.posibles_jurados.trim()) e.posibles_jurados = "Debe indicar al menos un posible jurado.";
    if (!form.programa) e.programa = "Debe seleccionar un programa.";
    if (!form.tipo_evaluacion) e.tipo_evaluacion = "Debe seleccionar el tipo de evaluación.";
    if (!form.documento) e.documento = "Debe adjuntar el documento a evaluar.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validar()) return;
    setEnviando(true);
    setErrorServidor(null);
    try {
      const resultado = await crearSolicitudEvaluacion({
        nombre_completo: form.nombre_completo,
        codigo: form.codigo,
        director: form.director,
        codirector: form.codirector || undefined,
        titulo: form.titulo,
        resumen: form.resumen,
        posibles_jurados: form.posibles_jurados,
        id_programa: parseInt(form.programa),
        tipo_evaluacion: form.tipo_evaluacion,
        documento: form.documento,
      });
      setRadicado(resultado.numero_radicado);
      setEnviado(true);
    } catch (err: unknown) {
      setErrorServidor(err instanceof Error ? err.message : "Error al enviar la solicitud.");
    } finally {
      setEnviando(false);
    }
  };

  const resetForm = () => {
    setEnviado(false); setRadicado(null); setNombreArchivo(null);
    setForm({ nombre_completo: "", codigo: "", director: "", codirector: "", titulo: "", resumen: "", posibles_jurados: "", programa: "", tipo_evaluacion: "", documento: null });
  };

  if (enviado) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-10 text-center space-y-4">
          <div className="text-6xl">✅</div>
          <h2 className="text-2xl font-bold text-gray-800">¡Solicitud enviada!</h2>
          <p className="text-gray-500">Tu solicitud ha sido radicada exitosamente.</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left mt-4">
            <p className="text-sm text-green-800 font-semibold">Resumen:</p>
            <ul className="mt-2 space-y-1 text-sm text-green-700">
              <li><span className="font-medium">Radicado:</span> <span className="font-mono font-bold">{radicado}</span></li>
              <li><span className="font-medium">Estudiante:</span> {form.nombre_completo}</li>
              <li><span className="font-medium">Tipo:</span> {form.tipo_evaluacion}</li>
              <li><span className="font-medium">Programa:</span> {programas.find(p => String(p.id) === form.programa)?.nombre}</li>
              <li><span className="font-medium">Documento:</span> {nombreArchivo}</li>
            </ul>
          </div>
          <div className="flex gap-3 justify-center mt-6">
            <Link href="/dashboard/estudiante/solicitudes" className="bg-green-700 text-white px-6 py-2.5 rounded-lg hover:bg-green-800 transition-colors font-semibold text-sm">
              Ver mis solicitudes
            </Link>
            <button onClick={resetForm} className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm">
              Nueva solicitud
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <p className="text-gray-500 mt-1">Completa todos los campos para radicar tu solicitud.</p>
      </div>

      {errorServidor && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-center gap-2">
          <span>⚠️</span> {errorServidor}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
        {/* Sección 1 */}
        <div className="p-6 space-y-5">
          <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
            <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            Datos del Estudiante
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre Completo <span className="text-red-500">*</span></label>
              <input type="text" name="nombre_completo" value={form.nombre_completo} onChange={handleChange} placeholder="Ej: Juliam Díaz García"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.nombre_completo ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
              {errors.nombre_completo && <p className="text-red-500 text-xs mt-1">{errors.nombre_completo}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Código Estudiantil <span className="text-red-500">*</span></label>
              <input type="text" name="codigo" value={form.codigo} onChange={handleChange} placeholder="Ej: 2024101001"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.codigo ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
              {errors.codigo && <p className="text-red-500 text-xs mt-1">{errors.codigo}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Programa <span className="text-red-500">*</span></label>
              <select name="programa" value={form.programa} onChange={handleChange} disabled={cargandoProgramas}
                className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white ${errors.programa ? "border-red-400 bg-red-50" : "border-gray-200"}`}>
                <option value="">{cargandoProgramas ? "Cargando programas..." : "Seleccionar programa..."}</option>
                {programas.map((p) => <option key={p.id} value={String(p.id)}>{p.nombre}</option>)}
              </select>
              {errors.programa && <p className="text-red-500 text-xs mt-1">{errors.programa}</p>}
            </div>
          </div>
        </div>

        {/* Sección 2 */}
        <div className="p-6 space-y-5">
          <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
            <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            Datos del Proyecto
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Director <span className="text-red-500">*</span></label>
              <input type="text" name="director" value={form.director} onChange={handleChange} placeholder="Ej: Dr. Omar Tíjaro"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.director ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
              {errors.director && <p className="text-red-500 text-xs mt-1">{errors.director}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Codirector <span className="text-gray-400 text-xs">(opcional)</span></label>
              <input type="text" name="codirector" value={form.codirector} onChange={handleChange} placeholder="Ej: Dr. Juan Pérez"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Título del Trabajo <span className="text-red-500">*</span></label>
            <input type="text" name="titulo" value={form.titulo} onChange={handleChange} placeholder="Título completo del trabajo de investigación o tesis"
              className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.titulo ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
            {errors.titulo && <p className="text-red-500 text-xs mt-1">{errors.titulo}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Resumen <span className="text-red-500">*</span></label>
            <textarea name="resumen" value={form.resumen} onChange={handleChange} rows={5}
              placeholder="Describa brevemente el trabajo: objetivo, metodología y resultados esperados (mínimo 50 caracteres)."
              className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${errors.resumen ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
            <div className="flex justify-between mt-1">
              {errors.resumen ? <p className="text-red-500 text-xs">{errors.resumen}</p> : <span />}
              <p className="text-xs text-gray-400 ml-auto">{form.resumen.length} caracteres</p>
            </div>
          </div>
        </div>

        {/* Sección 3 */}
        <div className="p-6 space-y-5">
          <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
            <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            Información de la Evaluación
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Evaluación <span className="text-red-500">*</span></label>
            <select name="tipo_evaluacion" value={form.tipo_evaluacion} onChange={handleChange}
              className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white ${errors.tipo_evaluacion ? "border-red-400 bg-red-50" : "border-gray-200"}`}>
              <option value="">Seleccionar tipo de evaluación...</option>
              {tiposEvaluacion.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.tipo_evaluacion && <p className="text-red-500 text-xs mt-1">{errors.tipo_evaluacion}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Posibles Jurados <span className="text-red-500">*</span></label>
            <textarea name="posibles_jurados" value={form.posibles_jurados} onChange={handleChange} rows={3}
              placeholder="Nombre, institución y correo de los posibles jurados. Puede indicar más de uno separados por línea."
              className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${errors.posibles_jurados ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
            {errors.posibles_jurados && <p className="text-red-500 text-xs mt-1">{errors.posibles_jurados}</p>}
          </div>
        </div>

        {/* Sección 4 */}
        <div className="p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
            <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
            Documento a Evaluar
          </h2>
          <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${errors.documento ? "border-red-300 bg-red-50" : nombreArchivo ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-green-400 hover:bg-green-50"}`}>
            {nombreArchivo ? (
              <div className="space-y-2">
                <span className="text-4xl">📄</span>
                <p className="text-sm font-semibold text-green-700">{nombreArchivo}</p>
                <p className="text-xs text-green-600">Archivo cargado correctamente</p>
                <button onClick={() => { setNombreArchivo(null); setForm(p => ({ ...p, documento: null })); }} className="text-xs text-red-500 hover:underline mt-1">Eliminar y cargar otro</button>
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

        {/* Botones */}
        <div className="p-6 flex items-center justify-between gap-4 bg-gray-50 rounded-b-xl">
          <Link href="/dashboard/estudiante/solicitudes/nueva" className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
            ← Volver
          </Link>
          <button onClick={handleSubmit} disabled={enviando}
            className={`flex items-center gap-2 bg-green-700 text-white px-8 py-3 rounded-lg font-semibold text-sm transition-colors ${enviando ? "opacity-70 cursor-not-allowed" : "hover:bg-green-800"}`}>
            {enviando ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
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
