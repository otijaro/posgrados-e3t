"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/auth";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Resumen {
  total_estudiantes: number;
  total_docentes: number;
  total_solicitudes: number;
  solicitudes_pendientes: number;
  solicitudes_aprobadas: number;
  solicitudes_rechazadas: number;
}

export default function DashboardCoordinador() {
  const router = useRouter();
  const [nombre, setNombre]   = useState("");
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    getMe().then((u) => { if (u) setNombre(u.nombre_completo); });
    fetch(`${API_URL}/api/coordinador/resumen`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setResumen).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const tarjetas = resumen ? [
    { label: "Estudiantes",            valor: resumen.total_estudiantes,      color: "text-green-700",   bg: "bg-green-50",   border: "border-green-200",  href: "/dashboard/coordinador/estudiantes",                  icono: "🎓" },
    { label: "Docentes",               valor: resumen.total_docentes,         color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",   href: "/dashboard/coordinador/docentes",                     icono: "👨‍🏫" },
    { label: "Solicitudes pendientes", valor: resumen.solicitudes_pendientes, color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-300",  href: "/dashboard/coordinador/solicitudes?estado=enviada",   icono: "⏳" },
    { label: "Total solicitudes",      valor: resumen.total_solicitudes,      color: "text-gray-700",    bg: "bg-gray-50",    border: "border-gray-200",   href: "/dashboard/coordinador/solicitudes",                  icono: "📋" },
    { label: "Aprobadas",              valor: resumen.solicitudes_aprobadas,  color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200",href: "/dashboard/coordinador/solicitudes?estado=aprobada",  icono: "✅" },
    { label: "Rechazadas",             valor: resumen.solicitudes_rechazadas, color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",    href: "/dashboard/coordinador/solicitudes?estado=rechazada", icono: "❌" },
  ] : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {nombre || "Coordinador"}</h1>
        <p className="text-gray-500 text-sm mt-1">Panel de Coordinación — Posgrados E3T</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {tarjetas.map((t) => (
              <Link key={t.label} href={t.href}>
                <div className={`${t.bg} border ${t.border} rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{t.icono}</span>
                    {t.label === "Solicitudes pendientes" && resumen && resumen.solicitudes_pendientes > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Nuevo</span>
                    )}
                  </div>
                  <p className={`text-3xl font-bold ${t.color}`}>{t.valor}</p>
                  <p className="text-xs text-gray-500 mt-1">{t.label}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <h2 className="text-base font-bold text-gray-700">Accesos rápidos</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link href="/dashboard/coordinador/solicitudes?estado=enviada">
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer">
                  <p className="text-sm font-semibold text-amber-700">⏳ Revisar solicitudes pendientes</p>
                  <p className="text-xs text-gray-500 mt-1">Solicitudes que esperan tu revisión</p>
                </div>
              </Link>
              <Link href="/dashboard/coordinador/estudiantes">
                <div className="border border-green-200 bg-green-50 rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer">
                  <p className="text-sm font-semibold text-green-700">🎓 Ver todos los estudiantes</p>
                  <p className="text-xs text-gray-500 mt-1">Programas, correos, códigos y semestres</p>
                </div>
              </Link>
              <Link href="/dashboard/coordinador/docentes">
                <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer">
                  <p className="text-sm font-semibold text-blue-700">👨‍🏫 Ver docentes y grupos</p>
                  <p className="text-xs text-gray-500 mt-1">Directores, codirectores y grupos de investigación</p>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
