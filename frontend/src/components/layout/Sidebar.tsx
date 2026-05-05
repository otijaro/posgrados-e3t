"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMe, logout, UserInfo, rolPrincipal } from "@/lib/auth";

const menus: Record<string, { label: string; href: string; icon: string }[]> = {
  estudiante: [
    { label: "Inicio",            href: "/dashboard/estudiante",             icon: "🏠" },
    { label: "Mi Proyecto",       href: "/dashboard/estudiante/proyecto",    icon: "📄" },
    { label: "Solicitudes",       href: "/dashboard/estudiante/solicitudes", icon: "📋" },
    { label: "Calendarios",       href: "/dashboard/calendarios",            icon: "📅" },
    { label: "Planes de Estudio", href: "/dashboard/planes-estudio",         icon: "📚" },
  ],
  director: [
    { label: "Inicio",            href: "/dashboard/director",               icon: "🏠" },
    { label: "Proyectos",         href: "/dashboard/director/proyectos",     icon: "📁" },
    { label: "Calendarios",       href: "/dashboard/calendarios",            icon: "📅" },
    { label: "Planes de Estudio", href: "/dashboard/planes-estudio",         icon: "📚" },
  ],
  coordinador: [
    { label: "Inicio",      href: "/dashboard/coordinador", icon: "🏠" },
    { label: "Calendarios", href: "/dashboard/calendarios", icon: "📅" },
  ],
  comite: [
    { label: "Inicio",      href: "/dashboard/comite",      icon: "🏠" },
    { label: "Calendarios", href: "/dashboard/calendarios", icon: "📅" },
  ],
};

const rolLabel: Record<string, string> = {
  estudiante:  "Estudiante",
  director:    "Director",
  coordinador: "Coordinador",
  comite:      "Comité",
};

function iniciales(nombre: string): string {
  return nombre.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [rol, setRol] = useState<string>("estudiante");

  useEffect(() => {
    getMe().then((u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      const r = rolPrincipal(u);
      setRol(r);
      localStorage.setItem("rol_activo", r);
    });
  }, []);

  useEffect(() => {
    if (pathname.includes("/director"))    setRol("director");
    else if (pathname.includes("/estudiante"))  setRol("estudiante");
    else if (pathname.includes("/coordinador")) setRol("coordinador");
    else if (pathname.includes("/comite"))      setRol("comite");
    else {
      const rolGuardado = localStorage.getItem("rol_activo");
      if (rolGuardado) setRol(rolGuardado);
    }
  }, [pathname]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const menuItems = menus[rol] ?? menus["estudiante"];

  return (
    <aside className="w-64 bg-green-800 text-white flex flex-col min-h-screen">

      {/* Logo */}
      <div className="p-5 border-b border-green-700 flex items-center gap-3">
        <div className="bg-white rounded-lg p-1.5">
          <Image src="/E3T.png" alt="E3T" width={32} height={28} className="object-contain" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">Posgrados E3T</p>
          <p className="text-green-300 text-xs">UIS</p>
        </div>
      </div>

      {/* Usuario */}
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

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-1 mt-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-green-600 text-white font-semibold"
                  : "text-green-200 hover:bg-green-700 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Cerrar sesión */}
      <div className="p-4 border-t border-green-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-green-200 hover:bg-red-700 hover:text-white transition-colors"
        >
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
