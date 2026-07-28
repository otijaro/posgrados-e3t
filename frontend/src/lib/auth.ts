const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface UserInfo {
  id: number;
  nombre_completo: string;
  email_institucional: string;
  roles: string[];
}

export async function login(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Correo o contraseña incorrectos");
  }
  const { access_token } = await res.json();
  localStorage.setItem("token", access_token);
}

export function logout(): void {
  localStorage.removeItem("token");
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export async function getMe(): Promise<UserInfo | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) { logout(); return null; }
  return res.json();
}

// Códigos de rol que corresponden al rol "director" en el sistema
const ROLES_DIRECTOR = new Set([
  "director",
  "codirector",
  "prof_planta",
  "prof_catedra",
  "docente",
  "coordinador_grupo",
  "evaluador",
]);

export function rolPrincipal(user: UserInfo): string {
  const roles = user.roles.map(r => r.toLowerCase());

  // Orden de prioridad
  if (roles.some(r => r === "comite"))                   return "comite";
  if (roles.some(r => r === "coordinador"))              return "coordinador";
  if (roles.some(r => r === "secretaria"))               return "secretaria";
  if (roles.some(r => ROLES_DIRECTOR.has(r)))            return "director";
  if (roles.some(r => r === "estudiante"))               return "estudiante";

  return "estudiante";
}

export function rutaPorRol(user: UserInfo): string {
  const rol = rolPrincipal(user);
  const rutas: Record<string, string> = {
    estudiante:  "/dashboard/estudiante",
    director:    "/dashboard/director",
    coordinador: "/dashboard/coordinador",
    secretaria:  "/dashboard/secretaria",
    comite:      "/dashboard/comite",
  };
  return rutas[rol] ?? "/dashboard";
}
