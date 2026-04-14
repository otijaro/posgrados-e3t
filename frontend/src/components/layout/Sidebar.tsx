"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const menus: Record<string, { label: string; href: string; icon: string }[]> = {
  estudiante: [
    { label: "Inicio", href: "/dashboard/estudiante", icon: "🏠" },
    { label: "Mi Proyecto", href: "/dashboard/estudiante/proyecto", icon: "📄" },
    { label: "Solicitudes", href: "/dashboard/estudiante/solicitudes", icon: "📋" },
    { label: "Calendarios", href: "/dashboard/calendarios", icon: "📅" },
    { label: "Planes de Estudio", href: "/dashboard/planes-estudio", icon: "📚" },
  ],
  director: [
    { label: "Inicio", href: "/dashboard/director", icon: "🏠" },
    { label: "Proyectos", href: "/dashboard/director/proyectos", icon: "📁" },
    { label: "Calendarios", href: "/dashboard/calendarios", icon: "📅" },
    { label: "Planes de Estudio", href: "/dashboard/planes-estudio", icon: "📚" },
  ],
};

const usuarios: Record<string, { nombre: string; rol: string; codigo: string; iniciales: string }> = {
  estudiante: { nombre: "Juliam Díaz", rol: "Estudiante", codigo: "2024101001", iniciales: "JD" },
  director: { nombre: "Dr. Omar Tíjaro", rol: "Director", codigo: "ojtijaro@uis.edu.co", iniciales: "OT" },
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [rol, setRol] = useState<"estudiante" | "director">("estudiante");

  // Al montar, detectar rol desde la URL o desde localStorage
  useEffect(() => {
    if (pathname.includes("/director")) {
      setRol("director");
      localStorage.setItem("rol_activo", "director");
    } else if (pathname.includes("/estudiante")) {
      setRol("estudiante");
      localStorage.setItem("rol_activo", "estudiante");
    } else {
      // Ruta compartida (ej: /dashboard/calendarios) → leer del localStorage
      const rolGuardado = localStorage.getItem("rol_activo") as "estudiante" | "director" | null;
      if (rolGuardado) setRol(rolGuardado);
    }
  }, [pathname]);

  const menuItems = menus[rol];
  const usuario = usuarios[rol];

  const cambiarRol = (nuevoRol: "estudiante" | "director") => {
    setRol(nuevoRol);
    localStorage.setItem("rol_activo", nuevoRol);
    router.push(`/dashboard/${nuevoRol}`);
  };

  return (
    <aside className="w-64 bg-green-800 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-green-700">
        <h1 className="text-lg font-bold leading-tight">Posgrados E3T</h1>
        <p className="text-green-300 text-sm mt-1">Universidad Industrial de Santander</p>
      </div>

      {/* Info del usuario */}
      <div className="p-4 border-b border-green-700 bg-green-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center font-bold text-white text-sm">
            {usuario.iniciales}
          </div>
          <div>
            <p className="text-sm font-semibold">{usuario.nombre}</p>
            <p className="text-xs text-green-300">{usuario.rol} · {usuario.codigo}</p>
          </div>
        </div>
      </div>

      {/* Cambiar rol (demo) */}
      <div className="px-4 pt-3">
        <p className="text-xs text-green-400 mb-2 font-semibold uppercase tracking-wide">Vista</p>
        <div className="flex gap-2">
          <button
            onClick={() => cambiarRol("estudiante")}
            className={`flex-1 text-center text-xs py-1.5 rounded-lg font-semibold transition-colors ${
              rol === "estudiante" ? "bg-green-600 text-white" : "text-green-300 hover:bg-green-700"
            }`}
          >
            Estudiante
          </button>
          <button
            onClick={() => cambiarRol("director")}
            className={`flex-1 text-center text-xs py-1.5 rounded-lg font-semibold transition-colors ${
              rol === "director" ? "bg-green-600 text-white" : "text-green-300 hover:bg-green-700"
            }`}
          >
            Director
          </button>
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
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-green-200 hover:bg-green-700 hover:text-white transition-colors">
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
