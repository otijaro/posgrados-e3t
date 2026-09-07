"use client";

import { useState, useEffect, useCallback, memo, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getMiPerfil, EstudianteInfo } from "@/lib/api";
import { getMe, UserInfo } from "@/lib/auth";

const FirmadorPDF = dynamic(() => import("@/components/FirmadorPDF"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface GrupoInv { id: number; nombre: string; }

const CampoReadonly = memo(({ label, valor }: { label: string; valor?: string | null }) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
    <div className={`w-full border rounded-lg px-4 py-2.5 text-sm border-gray-100 bg-gray-50 ${valor ? "text-gray-700" : "text-gray-400 italic"}`}>
      {valor ?? "No registrado"}
    </div>
  </div>
));
CampoReadonly.displayName = "CampoReadonly";

const CampoPersona = memo(({
  label, opcionalLabel, nombre, correo,
  onNombre, onCorreo, errorNombre, errorCorreo,
}: {
  label: string; opcionalLabel?: string;
  nombre: string; correo: string;
  onNombre: (v: string) => void; onCorreo: (v: string) => void;
  errorNombre?: string; errorCorreo?: string;
}) => (
  <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-3">
    <p className="text-sm font-semibold text-gray-600">
      {label}
      {opcionalLabel && <span className="ml-2 text-xs font-normal text-gray-400">{opcionalLabel}</span>}
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Nombre completo {!opcionalLabel && <span className="text-red-500">*</span>}
        </label>
        <input type="text" value={nombre} onChange={e => onNombre(e.target.value)}
          data-field="director_nombre"
          placeholder="Ej. Juan Manuel Rey López"
          className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white ${errorNombre ? "border-red-400" : "border-gray-200"}`} />
        {errorNombre && <p className="text-red-500 text-xs mt-0.5">{errorNombre}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Correo institucional {!opcionalLabel && <span className="text-red-500">*</span>}
        </label>
        <input type="email" value={correo} onChange={e => onCorreo(e.target.value)}
          data-field="director_correo"
          placeholder="Ej. juan.rey@uis.edu.co"
          className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white ${errorCorreo ? "border-red-400" : "border-gray-200"}`} />
        {errorCorreo && <p className="text-red-500 text-xs mt-0.5">{errorCorreo}</p>}
      </div>
    </div>
  </div>
));
CampoPersona.displayName = "CampoPersona";

function RegistrarTemaForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idEditar = searchParams.get("editar");
  const modoEdicion = Boolean(idEditar);

  const [user, setUser]         = useState<UserInfo | null>(null);
  const [perfil, setPerfil]     = useState<EstudianteInfo | null>(null);
  const [grupos, setGrupos]     = useState<GrupoInv[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [documentoExistente, setDocumentoExistente] = useState<string | null>(null);
  const [temaActivo, setTemaActivo] = useState<{ id: number; numero_radicado: string; estado: string; editable: boolean } | null>(null);

  const [dirNombre, setDirNombre]               = useState("");
  const [dirCorreo, setDirCorreo]               = useState("");
  const [codNombre, setCodNombre]               = useState("");
  const [codCorreo, setCodCorreo]               = useState("");
  const [codCargo, setCodCargo]                 = useState("");
  const [codEntidad, setCodEntidad]             = useState("");
  const [titulo, setTitulo]                     = useState("");
  const [lineaEstrategica, setLineaEstrategica] = useState("");
  const [grupoInv, setGrupoInv]                 = useState("");
  const [areaFormacion, setAreaFormacion]       = useState("");
  const [objetivo, setObjetivo]                 = useState("");
  const [alcances, setAlcances]                 = useState("");

  const [errors, setErrors]               = useState<Record<string, string>>({});
  const [enviando, setEnviando]           = useState(false);
  const [enviado, setEnviado]             = useState(false);
  const [radicado, setRadicado]           = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const [pdfGenerado, setPdfGenerado]         = useState<string | null>(null);
  const [pdfFirmado, setPdfFirmado]           = useState<string | null>(null);
  const [mostrarFirmador, setMostrarFirmador] = useState(false);
  const [generandoPDF, setGenerandoPDF]       = useState(false);
  const [generandoVer, setGenerandoVer]       = useState(false);

  const [visorUrl, setVisorUrl] = useState<string | null>(null);
  const visorRef                = useRef<HTMLDivElement>(null);
  const prevVisorUrl            = useRef<string | null>(null);

  useEffect(() => {
    Promise.all([
      getMe(),
      getMiPerfil(),
      fetch(`${API_URL}/api/programas/grupos-investigacion`).then(r => r.json()).catch(() => []),
      idEditar ? fetch(`${API_URL}/api/solicitudes/${idEditar}`).then(r => r.ok ? r.json() : null) : Promise.resolve(null),
      !idEditar ? fetch(`${API_URL}/api/solicitudes/registrar-tema/tema-activo`, { headers: authHeaders() }).then(r => r.ok ? r.json() : null) : Promise.resolve(null),
    ])
      .then(([u, p, grps, solicitud, activo]) => {
        setUser(u); setPerfil(p);
        setGrupos(Array.isArray(grps) ? grps : []);

        if (activo && activo.tiene_tema_activo) {
          setTemaActivo(activo);
        }

        if (solicitud && solicitud.datos_formulario) {
          const d = solicitud.datos_formulario;
          setDirNombre(d.director ?? "");
          setDirCorreo(d.director_correo ?? "");
          setCodNombre(d.codirector ?? "");
          setCodCorreo(d.codirector_correo ?? "");
          setCodCargo(d.codirector_cargo ?? "");
          setCodEntidad(d.codirector_entidad ?? "");
          setTitulo(d.titulo ?? "");
          setLineaEstrategica(d.linea_estrategica ?? "");
          setGrupoInv(d.grupo_investigacion ?? "");
          setAreaFormacion(d.area_formacion ?? "");
          setObjetivo(d.objetivo_general ?? "");
          setAlcances(d.descripcion_alcances ?? "");
          setDocumentoExistente(solicitud.documento ?? null);
        } else {
          setDirNombre(p.proyecto?.director   ?? "");
          setCodNombre(p.proyecto?.codirector ?? "");
          setTitulo(p.proyecto?.titulo        ?? "");
        }
      })
      .catch((e) => setErrorCarga(e.message))
      .finally(() => setCargando(false));
  }, [idEditar]);

  useEffect(() => {
    return () => { if (prevVisorUrl.current) URL.revokeObjectURL(prevVisorUrl.current); };
  }, []);

  const onDirNombre = useCallback((v: string) => { setDirNombre(v); setErrors(p => ({ ...p, director_nombre: "" })); }, []);
  const onDirCorreo = useCallback((v: string) => { setDirCorreo(v); setErrors(p => ({ ...p, director_correo: "" })); }, []);
  const onCodNombre = useCallback((v: string) => setCodNombre(v), []);
  const onCodCorreo = useCallback((v: string) => { setCodCorreo(v); setErrors(p => ({ ...p, codirector_correo: "" })); }, []);

  const getDatosFormulario = () => ({
    titulo, programa: perfil?.programa ?? "", autor: user?.nombre_completo ?? "",
    codigo: perfil?.codigo_estudiante ?? "", director: dirNombre,
    codirector: codNombre, codirector_cargo: codCargo, codirector_entidad: codEntidad,
    linea_estrategica: lineaEstrategica, grupo_investigacion: grupoInv,
    area_formacion: areaFormacion, objetivo_general: objetivo, descripcion_alcances: alcances,
  });

  const fetchPDF = async (): Promise<string> => {
    const res = await fetch(`${API_URL}/api/firmas/generar-pdf-tema-completo`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(getDatosFormulario()),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Error al generar el PDF");
    return (await res.json()).pdf_base64;
  };

  const mostrarEnVisor = useCallback((b64: string) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const blob  = new Blob([bytes], { type: "application/pdf" });
    if (prevVisorUrl.current) URL.revokeObjectURL(prevVisorUrl.current);
    const url = URL.createObjectURL(blob);
    prevVisorUrl.current = url;
    setVisorUrl(url);
    setTimeout(() => visorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  }, []);

  const handlePrevisualizar = async () => {
    setGenerandoVer(true); setErrorServidor(null);
    try { mostrarEnVisor(await fetchPDF()); }
    catch (err: unknown) { setErrorServidor(err instanceof Error ? err.message : "Error al generar el PDF"); }
    finally { setGenerandoVer(false); }
  };

  const handleFirmar = async () => {
    setGenerandoPDF(true); setErrorServidor(null);
    try { const b64 = await fetchPDF(); setPdfGenerado(b64); setMostrarFirmador(true); }
    catch (err: unknown) { setErrorServidor(err instanceof Error ? err.message : "Error al generar el PDF"); }
    finally { setGenerandoPDF(false); }
  };

  const handleFirmado = useCallback((b64: string) => {
    setPdfFirmado(b64); setMostrarFirmador(false); mostrarEnVisor(b64);
  }, [mostrarEnVisor]);

  const esCorreoValido = (c: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);

  const ORDEN_CAMPOS = [
    "director_nombre", "director_correo",
    "codirector_nombre", "codirector_correo", "codirector_cargo", "codirector_entidad",
    "titulo", "linea_estrategica", "grupo_inv", "area_formacion",
    "objetivo_general", "alcances", "documento",
  ];

  const validar = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!dirNombre.trim())                e.director_nombre   = "Obligatorio.";
    if (!dirCorreo.trim())                e.director_correo   = "Obligatorio.";
    else if (!esCorreoValido(dirCorreo))  e.director_correo   = "Correo inválido.";

    const tieneCod = codNombre.trim() || codCorreo.trim() || codCargo.trim() || codEntidad.trim();
    if (tieneCod) {
      if (!codNombre.trim())              e.codirector_nombre  = "Obligatorio si registras un codirector.";
      if (!codCorreo.trim())              e.codirector_correo  = "Obligatorio si registras un codirector.";
      else if (!esCorreoValido(codCorreo)) e.codirector_correo = "Correo inválido.";
      if (!codCargo.trim())               e.codirector_cargo   = "Obligatorio si registras un codirector.";
      if (!codEntidad.trim())             e.codirector_entidad = "Obligatorio si registras un codirector.";
    }

    if (!titulo.trim())                   e.titulo            = "Obligatorio.";
    if (!lineaEstrategica.trim())         e.linea_estrategica = "Obligatorio.";
    if (!grupoInv.trim())                 e.grupo_inv         = "Obligatorio.";
    if (!areaFormacion.trim())            e.area_formacion    = "Obligatorio.";
    if (!objetivo.trim())                 e.objetivo_general  = "Obligatorio.";
    else if (objetivo.trim().length < 30) e.objetivo_general  = "Mínimo 30 caracteres.";
    if (!alcances.trim())                 e.alcances          = "Obligatorio.";
    if (!pdfFirmado && !documentoExistente)
                                           e.documento         = "Debes generar y firmar el formulario antes de enviar la solicitud.";
    return e;
  };

  const irAlPrimerError = (erroresEncontrados: Record<string, string>) => {
    const primerCampo = ORDEN_CAMPOS.find((campo) => erroresEncontrados[campo]);
    if (!primerCampo) return;
    const el = document.querySelector<HTMLElement>(`[data-field="${primerCampo}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus({ preventScroll: true });
    }
  };

  const handleSubmit = async () => {
    const erroresEncontrados = validar();
    setErrors(erroresEncontrados);
    if (Object.keys(erroresEncontrados).length > 0) {
      irAlPrimerError(erroresEncontrados);
      return;
    }
    setEnviando(true); setErrorServidor(null);
    try {
      const formData = new FormData();
      formData.append("director",             dirNombre);
      formData.append("director_correo",      dirCorreo);
      formData.append("titulo",               titulo);
      formData.append("objetivo_general",     objetivo);
      formData.append("descripcion_alcances", alcances);
      formData.append("grupo_investigacion",  grupoInv);
      formData.append("area_formacion",       areaFormacion);
      formData.append("linea_estrategica",    lineaEstrategica);
      if (codNombre.trim()) {
        formData.append("codirector",         codNombre);
        formData.append("codirector_correo",  codCorreo);
        formData.append("codirector_cargo",   codCargo);
        formData.append("codirector_entidad", codEntidad);
      }
      if (pdfFirmado) {
        const bytes = Uint8Array.from(atob(pdfFirmado), c => c.charCodeAt(0));
        formData.append("documento", new Blob([bytes], { type: "application/pdf" }), "formulario_tema_firmado.pdf");
      }
      const url = modoEdicion
        ? `${API_URL}/api/solicitudes/registrar-tema/${idEditar}/editar`
        : `${API_URL}/api/solicitudes/registrar-tema`;
      const res = await fetch(url, {
        method: modoEdicion ? "PUT" : "POST", headers: authHeaders(), body: formData,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Error al enviar.");
      if (modoEdicion) {
        router.push("/dashboard/estudiante/solicitudes");
        return;
      }
      setRadicado((await res.json()).numero_radicado);
      setEnviado(true);
    } catch (err: unknown) {
      setErrorServidor(err instanceof Error ? err.message : "Error al enviar.");
    } finally { setEnviando(false); }
  };

  if (enviado) return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-10 text-center space-y-4">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-bold text-gray-800">¡Tema registrado!</h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left space-y-1 text-sm text-green-700">
          <p><span className="font-semibold">Radicado:</span> <span className="font-mono font-bold">{radicado}</span></p>
          <p><span className="font-semibold">Estudiante:</span> {user?.nombre_completo}</p>
          <p><span className="font-semibold">Título:</span> {titulo}</p>
          <p><span className="font-semibold">Director:</span> {dirNombre} · {dirCorreo}</p>
          {codNombre && <p><span className="font-semibold">Codirector:</span> {codNombre}</p>}
          {pdfFirmado && <p><span className="font-semibold">Documento:</span> formulario_tema_firmado.pdf ✍️</p>}
        </div>
        <Link href="/dashboard/estudiante/solicitudes"
          className="inline-block bg-green-700 text-white px-6 py-2.5 rounded-lg hover:bg-green-800 font-semibold text-sm">
          Ver mis solicitudes
        </Link>
      </div>
    </div>
  );

  if (cargando) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>;
  if (errorCarga) return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">⚠️ {errorCarga}</div>;

  if (temaActivo && !modoEdicion) {
    const estadoLabel: Record<string, string> = {
      enviada: "enviado, esperando revisión del director",
      en_revision: "en revisión del coordinador",
      en_comite: "en revisión del comité",
      aprobada: "aprobado",
    };
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-10 text-center space-y-4">
          <div className="text-6xl">📝</div>
          <h2 className="text-2xl font-bold text-gray-800">Ya tienes un tema registrado</h2>
          <p className="text-gray-500">
            Tu tema (<span className="font-mono">{temaActivo.numero_radicado}</span>) está actualmente{" "}
            <span className="font-semibold">{estadoLabel[temaActivo.estado] ?? temaActivo.estado}</span>.
            No puedes registrar uno nuevo hasta que este sea cancelado o rechazado.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {temaActivo.editable && (
              <Link href={`/dashboard/estudiante/solicitudes/editar/${temaActivo.id}`}
                className="bg-amber-500 text-white px-6 py-2.5 rounded-lg hover:bg-amber-600 font-semibold text-sm">
                ✏️ Editar ese tema
              </Link>
            )}
            <Link href="/dashboard/estudiante/solicitudes"
              className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-lg hover:bg-gray-50 font-semibold text-sm">
              Ver mis solicitudes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {mostrarFirmador && pdfGenerado && (
        <FirmadorPDF pdfBase64={pdfGenerado} soloVer={false}
          onFirmado={handleFirmado} onCerrar={() => setMostrarFirmador(false)} />
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <Link href="/dashboard/estudiante/solicitudes" className="hover:text-green-700">Solicitudes</Link>
            <span>›</span>
            <Link href="/dashboard/estudiante/solicitudes/nueva" className="hover:text-green-700">Nueva Solicitud</Link>
            <span>›</span>
            <span className="text-gray-700 font-medium">Registrar Tema</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{modoEdicion ? "✏️ Editar Tema Registrado" : "📝 Registrar Tema"}</h1>
          <p className="text-gray-500 mt-1">
            {modoEdicion ? "Ajusta los datos de tu tema y guarda los cambios." : "Registra el título, director y objetivo general de tu trabajo de grado."}
          </p>
        </div>

        {errorServidor && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">⚠️ {errorServidor}</div>}

        {pdfFirmado && (
          <div className="bg-green-50 border border-green-300 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✍️</span>
              <div>
                <p className="text-sm font-semibold text-green-800">Formulario firmado</p>
                <p className="text-xs text-green-600">Se adjuntará automáticamente al enviar</p>
              </div>
            </div>
            <button onClick={() => setMostrarFirmador(true)}
              className="text-xs text-green-700 underline hover:text-green-900">Ver / editar firma</button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">

          {/* 1. Datos del estudiante */}
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

          {/* 2. Director y Codirector */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <h2 className="text-base font-bold text-gray-700">Director y Codirector</h2>
            </div>
            <CampoPersona label="Director" nombre={dirNombre} correo={dirCorreo}
              onNombre={onDirNombre} onCorreo={onDirCorreo}
              errorNombre={errors.director_nombre} errorCorreo={errors.director_correo} />
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-3">
              <p className="text-sm font-semibold text-gray-600">
                Codirector <span className="ml-2 text-xs font-normal text-gray-400">Opcional</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo</label>
                  <input type="text" value={codNombre} onChange={e => onCodNombre(e.target.value)}
                    data-field="codirector_nombre"
                    placeholder="Nombre del codirector"
                    className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white ${errors.codirector_nombre ? "border-red-400" : "border-gray-200"}`} />
                  {errors.codirector_nombre && <p className="text-red-500 text-xs mt-0.5">{errors.codirector_nombre}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Correo institucional</label>
                  <input type="email" value={codCorreo} onChange={e => onCodCorreo(e.target.value)}
                    data-field="codirector_correo"
                    placeholder="correo@uis.edu.co"
                    className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white ${errors.codirector_correo ? "border-red-400" : "border-gray-200"}`} />
                  {errors.codirector_correo && <p className="text-red-500 text-xs mt-0.5">{errors.codirector_correo}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Categoría / Cargo</label>
                  <input type="text" value={codCargo} onChange={e => setCodCargo(e.target.value)}
                    data-field="codirector_cargo"
                    placeholder="Ej. Profesor planta, Investigador"
                    className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white ${errors.codirector_cargo ? "border-red-400" : "border-gray-200"}`} />
                  {errors.codirector_cargo && <p className="text-red-500 text-xs mt-0.5">{errors.codirector_cargo}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Universidad / Entidad</label>
                  <input type="text" value={codEntidad} onChange={e => setCodEntidad(e.target.value)}
                    data-field="codirector_entidad"
                    placeholder="Ej. UIS, Universidad Nacional"
                    className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white ${errors.codirector_entidad ? "border-red-400" : "border-gray-200"}`} />
                  {errors.codirector_entidad && <p className="text-red-500 text-xs mt-0.5">{errors.codirector_entidad}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Datos del Tema */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <h2 className="text-base font-bold text-gray-700">Datos del Tema</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Título del Trabajo <span className="text-red-500">*</span>
              </label>
              <input type="text" value={titulo}
                data-field="titulo"
                onChange={e => { setTitulo(e.target.value); setErrors(p => ({ ...p, titulo: "" })); }}
                placeholder="Título completo del trabajo de grado"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.titulo ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
              {errors.titulo && <p className="text-red-500 text-xs mt-1">{errors.titulo}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Línea Estratégica de Aporte al Desarrollo Regional <span className="text-red-500">*</span>
              </label>
              <input type="text" value={lineaEstrategica}
                data-field="linea_estrategica"
                onChange={e => { setLineaEstrategica(e.target.value); setErrors(p => ({ ...p, linea_estrategica: "" })); }}
                placeholder="Ej. Energía eléctrica y telecomunicaciones"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.linea_estrategica ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
              {errors.linea_estrategica && <p className="text-red-500 text-xs mt-1">{errors.linea_estrategica}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Grupo de Investigación — dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Grupo de Investigación <span className="text-red-500">*</span>
                </label>
                <select
                  value={grupoInv}
                  data-field="grupo_inv"
                  onChange={e => { setGrupoInv(e.target.value); setErrors(p => ({ ...p, grupo_inv: "" })); }}
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white appearance-none ${errors.grupo_inv ? "border-red-400 bg-red-50" : "border-gray-200"}`}>
                  <option value="">Seleccionar grupo...</option>
                  {grupos.map(g => (
                    <option key={g.id} value={g.nombre}>{g.nombre}</option>
                  ))}
                </select>
                {errors.grupo_inv && <p className="text-red-500 text-xs mt-1">{errors.grupo_inv}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Área de Formación <span className="text-red-500">*</span>
                </label>
                <input type="text" value={areaFormacion}
                  data-field="area_formacion"
                  onChange={e => { setAreaFormacion(e.target.value); setErrors(p => ({ ...p, area_formacion: "" })); }}
                  placeholder="Ej. Ingeniería Electrónica"
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.area_formacion ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
                {errors.area_formacion && <p className="text-red-500 text-xs mt-1">{errors.area_formacion}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Objetivo General <span className="text-red-500">*</span>
              </label>
              <textarea value={objetivo} rows={4}
                data-field="objetivo_general"
                onChange={e => { setObjetivo(e.target.value); setErrors(p => ({ ...p, objetivo_general: "" })); }}
                placeholder="Describe el objetivo general del trabajo (mínimo 30 caracteres)."
                className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${errors.objetivo_general ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
              <div className="flex justify-between mt-1">
                {errors.objetivo_general ? <p className="text-red-500 text-xs">{errors.objetivo_general}</p> : <span />}
                <p className="text-xs text-gray-400 ml-auto">{objetivo.length} caracteres</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Descripción de los Alcances <span className="text-red-500">*</span>
              </label>
              <textarea value={alcances} rows={4}
                data-field="alcances"
                onChange={e => { setAlcances(e.target.value); setErrors(p => ({ ...p, alcances: "" })); }}
                placeholder="Describe los alcances del trabajo de grado."
                className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${errors.alcances ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
              {errors.alcances && <p className="text-red-500 text-xs mt-1">{errors.alcances}</p>}
            </div>
          </div>

          {/* 4. Documento */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <h2 className="text-base font-bold text-gray-700">Documento</h2>
            </div>

            {documentoExistente && !pdfFirmado && (
              <a href={`${API_URL}${documentoExistente}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-green-700 hover:underline">
                📄 Ver documento actualmente adjunto
              </a>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3" data-field="documento" tabIndex={-1}>
              <div>
                <p className="text-sm font-semibold text-blue-800">📋 Formulario oficial UIS <span className="text-red-500">*</span></p>
                <p className="text-xs text-gray-500 mt-0.5">Debes generar y firmar el formulario antes de poder enviar la solicitud</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handlePrevisualizar} disabled={generandoVer || generandoPDF}
                  className={`flex-1 flex items-center justify-center gap-2 bg-white border border-blue-300 text-blue-700 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors ${generandoVer ? "opacity-60 cursor-not-allowed" : ""}`}>
                  {generandoVer ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Generando...</> : <><span>👁️</span> Previsualizar</>}
                </button>
                <button onClick={handleFirmar} disabled={generandoPDF || generandoVer}
                  className={`flex-1 flex items-center justify-center gap-2 bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-800 transition-colors ${generandoPDF ? "opacity-60 cursor-not-allowed" : ""}`}>
                  {generandoPDF ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Generando...</> : <><span>✍️</span> {pdfFirmado ? "Editar firma" : "Firmar"}</>}
                </button>
              </div>
              {pdfFirmado && <p className="text-xs text-green-700 text-center">✅ Formulario firmado — se adjuntará al enviar</p>}
              {errors.documento && <p className="text-xs text-red-600 text-center font-medium">⚠️ {errors.documento}</p>}
            </div>

            {visorUrl && (
              <div ref={visorRef} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-600">
                    {pdfFirmado ? "✍️ Formulario firmado" : "📄 Vista previa del formulario"}
                  </span>
                  <button onClick={() => { setVisorUrl(null); if (prevVisorUrl.current) { URL.revokeObjectURL(prevVisorUrl.current); prevVisorUrl.current = null; } }}
                    className="text-xs text-gray-400 hover:text-red-500 font-bold">✕ Cerrar</button>
                </div>
                <iframe src={visorUrl} className="w-full" style={{ height: "700px" }} title="Vista previa" />
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="p-6 flex items-center justify-between bg-gray-50 rounded-b-xl">
            <Link href="/dashboard/estudiante/solicitudes/nueva" className="text-sm text-gray-500 hover:text-gray-700 font-medium">← Volver</Link>
            <button onClick={handleSubmit} disabled={enviando}
              className={`flex items-center gap-2 bg-green-700 text-white px-8 py-3 rounded-lg font-semibold text-sm transition-colors ${enviando ? "opacity-70 cursor-not-allowed" : "hover:bg-green-800"}`}>
              {enviando
                ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> {modoEdicion ? "Guardando..." : "Enviando..."}</>
                : (modoEdicion ? "Guardar cambios" : "Registrar Tema →")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function RegistrarTemaPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>}>
      <RegistrarTemaForm />
    </Suspense>
  );
}
