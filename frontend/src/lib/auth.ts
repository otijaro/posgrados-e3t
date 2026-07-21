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

export function rolPrincipal(user: UserInfo): string {
  // Orden de prioridad — secretaria va justo después de coordinador
  const prioridad = ["comite", "coordinador", "secretaria", "director", "estudiante"];
  const rolesNorm = user.roles.map((r) => r.toLowerCase()
    .replace("secretaria", "secretaria")
    .replace("coordinador de posgrados", "coordinador")
    .replace("profesor planta", "director")
    .replace("profesor cátedra", "director")
    .replace("personal administrativo", "secretaria")
  );
  for (const p of prioridad) {
    if (rolesNorm.includes(p) || user.roles.some(r =>
      r.toLowerCase().includes(p) ||
      (p === "secretaria" && r.toLowerCase().includes("secretaria")) ||
      (p === "coordinador" && r.toLowerCase().includes("coordinador"))
    )) return p;
  }
  return user.roles[0] ?? "estudiante";
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
