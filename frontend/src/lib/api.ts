const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// ─── Tipos ────────────────────────────────────────────────────

export interface Programa {
  id: number;
  nombre: string;
  nivel: string;
  codigo_snies: string | null;
  creditos_totales: number | null;
  duracion_semestres: number | null;
}

export interface SolicitudResumen {
  id: number;
  numero_radicado: string | null;
  tipo_solicitud: string;
  asunto: string;
  estado: string;
  fecha_creacion: string;
}

export interface SolicitudEvaluacionPayload {
  titulo: string;
  resumen: string;
  posibles_jurados: string;
  tipo_evaluacion: string;
  id_programa: number;
  documento?: File | null;
}

export interface ProyectoInfo {
  titulo: string;
  estado: string;
  director: string;
  director_correo: string | null;
  codirector: string | null;
  codirector_correo: string | null;
  ultimo_reporte: string | null;
}

export interface EstudianteInfo {
  codigo_estudiante: string;
  programa: string;
  semestre_actual: number;
  promedio_acumulado: string | null;
  estado: string;
  fecha_max_graduacion: string | null;
  cohorte: string;
  proyecto: ProyectoInfo | null;
}

// ─── Tipos Director ───────────────────────────────────────────

export interface ReporteInfo {
  periodo: string;
  aval_director: number;
  fecha_carga: string | null;
  observaciones_director: string | null;
}

export interface SolicitudDirectorInfo {
  id: number;
  numero_radicado: string | null;
  tipo_solicitud: string;
  estado: string;
  asunto: string;
  fecha_creacion: string;
}

export interface EvaluacionInfo {
  nombre_evaluador: string;
  tipo_evaluacion: string | null;
  concepto: string | null;
  calificacion: string | null;
  fecha_asignacion: string | null;
  fecha_respuesta: string | null;
}

export interface EstudianteACargo {
  id_proyecto: number;
  nombre_estudiante: string;
  email_estudiante: string;
  codigo_estudiante: string;
  programa: string;
  semestre_actual: number;
  titulo_proyecto: string;
  estado_proyecto: string;
  rol_docente: string;
  reportes_pendientes: number;
  solicitudes_pendientes: number;
  reportes: ReporteInfo[];
  solicitudes: SolicitudDirectorInfo[];
  evaluaciones: EvaluacionInfo[];
}

export interface ResumenDirector {
  total_estudiantes: number;
  como_director: number;
  como_codirector: number;
  reportes_pendientes_aval: number;
  solicitudes_pendientes: number;
  estudiantes: EstudianteACargo[];
}

// ─── Helper con auth ──────────────────────────────────────────

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Programas ────────────────────────────────────────────────

export async function getProgramas(): Promise<Programa[]> {
  const res = await fetch(`${API_URL}/api/programas/`);
  if (!res.ok) throw new Error("Error al obtener programas");
  return res.json();
}

// ─── Estudiante ───────────────────────────────────────────────

export async function getMiPerfil(): Promise<EstudianteInfo> {
  const res = await fetch(`${API_URL}/api/estudiante/mi-perfil`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error al obtener el perfil del estudiante");
  return res.json();
}

export interface ActualizarPerfilPayload {
  titulo?: string;
  director_nombre?: string;
  director_correo?: string;
  codirector_nombre?: string;
  codirector_correo?: string;
  promedio_acumulado?: string;
}

export async function actualizarPerfil(
  data: ActualizarPerfilPayload
): Promise<{ mensaje: string }> {
  const res = await fetch(`${API_URL}/api/estudiante/perfil`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Error al actualizar el perfil");
  }
  return res.json();
}

export async function subirFotoPerfil(
  foto: File
): Promise<{ mensaje: string; foto_url: string }> {
  const formData = new FormData();
  formData.append("foto", foto);
  const res = await fetch(`${API_URL}/api/estudiante/foto-perfil`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Error al subir la foto");
  }
  return res.json();
}

export interface DocenteOpcion {
  id: number;
  nombre_completo: string;
  email_institucional: string;
}

export async function getDocentesDisponibles(): Promise<DocenteOpcion[]> {
  const res = await fetch(`${API_URL}/api/estudiante/docentes-disponibles`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error al obtener la lista de docentes");
  return res.json();
}

// ─── Director ─────────────────────────────────────────────────

export async function getMisEstudiantes(): Promise<ResumenDirector> {
  const res = await fetch(`${API_URL}/api/director/mis-estudiantes`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error al obtener los estudiantes a cargo");
  return res.json();
}

export async function darAvalReporte(
  reporteId: number,
  observaciones?: string
): Promise<{ mensaje: string }> {
  const params = new URLSearchParams();
  if (observaciones) params.append("observaciones", observaciones);
  const res = await fetch(
    `${API_URL}/api/director/reportes/${reporteId}/aval?${params.toString()}`,
    { method: "POST", headers: authHeaders() }
  );
  if (!res.ok) throw new Error("Error al dar aval al reporte");
  return res.json();
}

// ─── Solicitudes ──────────────────────────────────────────────

export async function getMisSolicitudes(): Promise<SolicitudResumen[]> {
  const res = await fetch(`${API_URL}/api/solicitudes/mis-solicitudes`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error al obtener solicitudes");
  return res.json();
}

export async function getSolicitudes(
  id_programa?: number,
  estado?: string
): Promise<SolicitudResumen[]> {
  const params = new URLSearchParams();
  if (id_programa) params.append("id_programa", String(id_programa));
  if (estado) params.append("estado", estado);
  const res = await fetch(`${API_URL}/api/solicitudes/?${params.toString()}`);
  if (!res.ok) throw new Error("Error al obtener solicitudes");
  return res.json();
}

export async function crearSolicitudEvaluacion(
  data: SolicitudEvaluacionPayload
): Promise<{ numero_radicado: string; id: number; estado: string }> {
  const formData = new FormData();
  formData.append("titulo", data.titulo);
  formData.append("resumen", data.resumen);
  formData.append("posibles_jurados", data.posibles_jurados);
  formData.append("tipo_evaluacion", data.tipo_evaluacion);
  formData.append("id_programa", String(data.id_programa));
  if (data.documento) formData.append("documento", data.documento);

  const res = await fetch(`${API_URL}/api/solicitudes/evaluacion`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Error al crear la solicitud");
  }

  return res.json();
}
