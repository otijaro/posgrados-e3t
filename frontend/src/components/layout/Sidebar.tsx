"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMe, logout, UserInfo, rolPrincipal } from "@/lib/auth";
import { getMisEstudiantes } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const menus: Record<string, { label: string; href: string; icon: string; exacto?: boolean }[]> = {
  estudiante: [
    { label: "Inicio",            href: "/dashboard/estudiante",             icon: "🏠", exacto: true },
    { label: "Mi Proyecto",       href: "/dashboard/estudiante/proyecto",    icon: "📄" },
    { label: "Solicitudes",       href: "/dashboard/estudiante/solicitudes", icon: "📋" },
    { label: "Documentos",        href: "/dashboard/documentos",             icon: "📁" },
    { label: "Reglamento",        href: "/dashboard/reglamento",             icon: "📜" },
    { label: "Calendarios",       href: "/dashboard/calendarios",            icon: "📅" },
    { label: "Planes de Estudio", href: "/dashboard/planes-estudio",         icon: "📚" },
  ],
  director: [
    { label: "Inicio",          href: "/dashboard/director",                  icon: "🏠", exacto: true },
    { label: "Notificaciones",  href: "/dashboard/director/notificaciones",   icon: "🔔" },
    { label: "Por firmar",      href: "/dashboard/director/solicitudes",      icon: "✍️" },
    { label: "Aval grupo inv.", href: "/dashboard/director/firmas-grupo",     icon: "🔬" },
    { label: "Documentos",      href: "/dashboard/documentos",                icon: "📁" },
    { label: "Reglamento",      href: "/dashboard/reglamento",                icon: "📜" },
    { label: "Calendarios",     href: "/dashboard/calendarios",               icon: "📅" },
  ],
  coordinador: [
    { label: "Inicio",      href: "/dashboard/coordinador",                  icon: "🏠", exacto: true },
    { label: "Solicitudes", href: "/dashboard/coordinador/solicitudes",      icon: "📋" },
    { label: "Por firmar",  href: "/dashboard/coordinador/firmas",           icon: "✍️" },
    { label: "Estudiantes", href: "/dashboard/coordinador/estudiantes",      icon: "🎓" },
    { label: "Docentes",    href: "/dashboard/coordinador/docentes",         icon: "👨‍🏫" },
    { label: "Documentos",  href: "/dashboard/coordinador/documentos",       icon: "📁" },
    { label: "Reglamento",  href: "/dashboard/reglamento",                   icon: "📜" },
    { label: "Calendarios", href: "/dashboard/calendarios",                  icon: "📅" },
  ],
  secretaria: [
    { label: "Inicio",      href: "/dashboard/secretaria",                   icon: "🏠", exacto: true },
    { label: "Solicitudes", href: "/dashboard/secretaria/solicitudes",       icon: "📋" },
    { label: "Por firmar",  href: "/dashboard/secretaria/firmas",            icon: "✍️" },
    { label: "Estudiantes", href: "/dashboard/secretaria/estudiantes",       icon: "🎓" },
    { label: "Docentes",    href: "/dashboard/secretaria/docentes",          icon: "👨‍🏫" },
    { label: "Documentos",  href: "/dashboard/documentos",                   icon: "📁" },
    { label: "Reglamento",  href: "/dashboard/reglamento",                   icon: "📜" },
    { label: "Calendarios", href: "/dashboard/calendarios",                  icon: "📅" },
  ],
  comite: [
    { label: "Inicio",      href: "/dashboard/comite",      icon: "🏠", exacto: true },
    { label: "Documentos",  href: "/dashboard/documentos",  icon: "📁" },
    { label: "Reglamento",  href: "/dashboard/reglamento",  icon: "📜" },
    { label: "Calendarios", href: "/dashboard/calendarios", icon: "📅" },
  ],
};

const rolLabel: Record<string, string> = {
  estudiante:  "Estudiante",
  director:    "Docente",
  coordinador: "Coordinador",
  secretaria:  "Secretaria",
  comite:      "Comité",
};

function iniciales(nombre: string): string {
  return nombre.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function isActive(pathname: string, href: string, exacto?: boolean): boolean {
  if (exacto) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser]                   = useState<UserInfo | null>(null);
  const [rol, setRol]                     = useState<string>("estudiante");
  const [pendientes, setPendientes]       = useState(0);
  const [firmasPendientes, setFirmasPendientes]       = useState(0);
  const [avalGrupoPendientes, setAvalGrupoPendientes] = useState(0);

  useEffect(() => {
    getMe().then((u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      const r = rolPrincipal(u);
      setRol(r);
      localStorage.setItem("rol_activo", r);
      const token = localStorage.getItem("token");
      if (!token) return;
      const h = { Authorization: `Bearer ${token}` };

      if (r === "director") {
        getMisEstudiantes()
          .then((d) => setPendientes(d.reportes_pendientes_aval + d.solicitudes_pendientes))
          .catch(() => {});
        fetch(`${API_URL}/api/firmas/pendientes/director`, { headers: h })
          .then(r => r.json()).then(d => setFirmasPendientes(Array.isArray(d) ? d.length : 0)).catch(() => {});
        fetch(`${API_URL}/api/firmas/pendientes/dir_grupo`, { headers: h })
          .then(r => r.json()).then(d => setAvalGrupoPendientes(Array.isArray(d) ? d.length : 0)).catch(() => {});
      }

      if (r === "coordinador" || r === "secretaria") {
        fetch(`${API_URL}/api/coordinador/resumen`, { headers: h })
          .then(res => res.json()).then(d => setPendientes(d.solicitudes_pendientes ?? 0)).catch(() => {});
        fetch(`${API_URL}/api/firmas/pendientes/coordinador`, { headers: h })
          .then(r => r.json()).then(d => setFirmasPendientes(Array.isArray(d) ? d.length : 0)).catch(() => {});
      }
    });
  }, []);

  useEffect(() => {
    if (pathname.includes("/secretaria"))       setRol("secretaria");
    else if (pathname.includes("/coordinador")) setRol("coordinador");
    else if (pathname.includes("/director"))    setRol("director");
    else if (pathname.includes("/estudiante"))  setRol("estudiante");
    else if (pathname.includes("/comite"))      setRol("comite");
    else { const r = localStorage.getItem("rol_activo"); if (r) setRol(r); }
  }, [pathname]);

  function handleLogout() { logout(); router.push("/"); }

  const menuItems = menus[rol] ?? menus["estudiante"];

  return (
    <aside className="w-64 bg-green-800 text-white flex flex-col min-h-screen">
      <div className="p-5 border-b border-green-700 flex items-center gap-3">
        <div className="bg-white rounded-lg p-1.5">
          <Image src="/E3T.png" alt="E3T" width={32} height={28} className="object-contain" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">Posgrados E3T</p>
          <p className="text-green-300 text-xs">UIS</p>
        </div>
      </div>

      <div className="p-4 border-b border-green-700 bg-green-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center font-bold text-sm">
            {user ? iniciales(user.nombre_completo) : "…"}
          </div>
          <div>
            <p className="text-sm font-semibold">{user?.nombre_completo ?? "Cargando..."}</p>
            <p className="text-xs text-green-300">{rolLabel[rol]} · {user?.email_institucional ?? ""}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 mt-2">
        {menuItems.map((item) => {
          const activo      = isActive(pathname, item.href, item.exacto);
          const esBadge     = (rol === "director" && item.label === "Notificaciones") ||
                              ((rol === "coordinador" || rol === "secretaria") && item.label === "Solicitudes");
          const esFirmas    = item.label === "Por firmar";
          const esAvalGrupo = item.label === "Aval grupo inv.";

          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                activo ? "bg-green-600 text-white font-semibold" : "text-green-200 hover:bg-green-700 hover:text-white"
              }`}>
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {esBadge && pendientes > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {pendientes > 99 ? "99+" : pendientes}
                </span>
              )}
              {esFirmas && firmasPendientes > 0 && (
                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {firmasPendientes}
                </span>
              )}
              {esAvalGrupo && avalGrupoPendientes > 0 && (
                <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {avalGrupoPendientes}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-green-700">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-green-200 hover:bg-red-700 hover:text-white transition-colors">
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
