"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { getMe, rolPrincipal } from "@/lib/auth";
import { getMisEstudiantes, getMisSolicitudes, getMiPerfil } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ItemPendiente {
  icono: string;
  texto: string;
  cantidad: number;
  href: string;
}

interface EventoCalendario {
  fecha: Date;
  texto: string;
  aplicaA?: "maestria" | "doctorado"; // si no se especifica, aplica a ambos
  nivel?: number[]; // semestre_actual al que aplica; si no se especifica, aplica a todos
}

// Fechas oficiales del Acuerdo n.° 252 de 2025 del Consejo Académico UIS —
// SEGUNDO PERIODO ACADÉMICO 2026 (maestrías de investigación y doctorados).
// ⚠️ Este calendario es específico de este periodo; hay que actualizarlo
// a mano cuando se apruebe el calendario del siguiente periodo.
const CALENDARIO_2026_2: EventoCalendario[] = [
  { fecha: new Date(2026, 7, 19),  texto: "Fecha límite: reporte de créditos condonables a Dirección de Posgrados" },
  { fecha: new Date(2026, 7, 21),  texto: "Fecha límite: subir a la plataforma estudiantes beneficiarios de créditos condonables" },
  { fecha: new Date(2026, 7, 23),  texto: "Fecha límite: solicitar inclusión y cancelación de actividades académicas" },
  { fecha: new Date(2026, 7, 30),  texto: "Fecha límite: examen de candidatura al doctorado (3er periodo académico)", aplicaA: "doctorado", nivel: [3] },
  { fecha: new Date(2026, 7, 30),  texto: "Fecha límite: entregar propuesta de tesis doctoral al coordinador (4to periodo)", aplicaA: "doctorado", nivel: [4] },
  { fecha: new Date(2026, 8, 4),   texto: "Fecha límite: reportar matrícula a Admisiones y Registro Académico" },
  { fecha: new Date(2026, 9, 26),  texto: "Fecha límite: entregar propuesta del trabajo de investigación al coordinador (2do nivel)", aplicaA: "maestria", nivel: [2] },
  { fecha: new Date(2026, 9, 26),  texto: "Fecha límite: solicitar examen de candidatura al doctorado (2do nivel)", aplicaA: "doctorado", nivel: [2] },
  { fecha: new Date(2026, 10, 13), texto: "Fecha límite: entregar el tema del trabajo de investigación o tesis doctoral al coordinador (1er nivel)", nivel: [1] },
  { fecha: new Date(2026, 10, 20), texto: "Finalización de actividades académicas y evaluativas" },
  { fecha: new Date(2026, 10, 25), texto: "Último día para registrar notas definitivas" },
  { fecha: new Date(2026, 11, 21), texto: "Inicio de vacaciones del personal docente y administrativo" },
];

function obtenerEventosRelevantes(nivelPrograma: "maestria" | "doctorado" | null, semestreActual: number | null): EventoCalendario[] {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return CALENDARIO_2026_2
    .filter((e) => e.fecha >= hoy)
    .filter((e) => !e.aplicaA || e.aplicaA === nivelPrograma)
    .filter((e) => !e.nivel || (semestreActual !== null && e.nivel.includes(semestreActual)))
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
    .slice(0, 4);
}

function formatearFecha(f: Date): string {
  return f.toLocaleDateString("es-CO", { day: "numeric", month: "long" });
}

export default function NotificacionesBell() {
  const [abierto, setAbierto] = useState(false);
  const [items, setItems] = useState<ItemPendiente[]>([]);
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [cargado, setCargado] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const cargarNotificaciones = useCallback(async () => {
    const u = await getMe();
    if (!u) return;
    const rol = rolPrincipal(u);
    const token = localStorage.getItem("token");
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    const nuevos: ItemPendiente[] = [];

    try {
        if (rol === "director") {
          const d = await getMisEstudiantes();
          if (d.reportes_pendientes_aval > 0) {
            nuevos.push({
              icono: "✅", texto: "reporte(s) por avalar",
              cantidad: d.reportes_pendientes_aval, href: "/dashboard/director",
            });
          }
          if (d.solicitudes_pendientes > 0) {
            nuevos.push({
              icono: "📋", texto: "solicitud(es) de tus estudiantes",
              cantidad: d.solicitudes_pendientes, href: "/dashboard/director/solicitudes",
            });
          }
          const [firmas, avalGrupo] = await Promise.all([
            fetch(`${API_URL}/api/firmas/pendientes/director`, { headers: h }).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}/api/firmas/pendientes/dir_grupo`, { headers: h }).then(r => r.json()).catch(() => []),
          ]);
          if (Array.isArray(firmas) && firmas.length > 0) {
            nuevos.push({
              icono: "✍️", texto: "documento(s) por firmar",
              cantidad: firmas.length, href: "/dashboard/director/solicitudes",
            });
          }
          if (Array.isArray(avalGrupo) && avalGrupo.length > 0) {
            nuevos.push({
              icono: "🔬", texto: "aval(es) de grupo de investigación pendientes",
              cantidad: avalGrupo.length, href: "/dashboard/director/firmas-grupo",
            });
          }
        }

        if (rol === "coordinador" || rol === "secretaria") {
          const base = rol === "coordinador" ? "/dashboard/coordinador" : "/dashboard/secretaria";
          const resumen = await fetch(`${API_URL}/api/coordinador/resumen`, { headers: h })
            .then(r => r.json()).catch(() => ({}));
          if (resumen?.solicitudes_pendientes > 0) {
            nuevos.push({
              icono: "📋", texto: "solicitud(es) pendientes de resolver",
              cantidad: resumen.solicitudes_pendientes, href: `${base}/solicitudes`,
            });
          }
          const firmas = await fetch(`${API_URL}/api/firmas/pendientes/coordinador`, { headers: h })
            .then(r => r.json()).catch(() => []);
          if (Array.isArray(firmas) && firmas.length > 0) {
            nuevos.push({
              icono: "✍️", texto: "documento(s) por firmar",
              cantidad: firmas.length, href: `${base}/firmas`,
            });
          }
        }

        if (rol === "estudiante") {
          const solicitudes = await getMisSolicitudes();
          const estadosResueltos = ["aprobada", "rechazada", "cancelada"];
          const enTramite = solicitudes.filter(
            (s) => !estadosResueltos.includes(s.estado?.toLowerCase())
          );
          if (enTramite.length > 0) {
            nuevos.push({
              icono: "📄", texto: "solicitud(es) en trámite",
              cantidad: enTramite.length, href: "/dashboard/estudiante/solicitudes",
            });
          }

          try {
            const perfil = await getMiPerfil();
            const nivelPrograma = perfil.programa?.includes("Doctorado") ? "doctorado" : "maestria";
            setEventos(obtenerEventosRelevantes(nivelPrograma, perfil.semestre_actual ?? null));
          } catch { /* si falla, simplemente no mostramos fechas */ }
        }
      } catch {
        // Si algo falla, simplemente no mostramos notificaciones — no bloquea la app.
      }

      setItems(nuevos);
      setCargado(true);
  }, []);

  // Se recarga cada vez que cambia de página (ej. después de aprobar/rechazar
  // algo y volver), para que los contadores no queden "pegados" a datos viejos.
  useEffect(() => {
    cargarNotificaciones();
  }, [pathname, cargarNotificaciones]);

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  const total = items.reduce((acc, i) => acc + i.cantidad, 0) + eventos.length;

  return (
    <div ref={contenedorRef} className="fixed top-4 right-4 z-50">
      <button
        onClick={() => { setAbierto((v) => !v); if (!abierto) cargarNotificaciones(); }}
        aria-label="Notificaciones"
        className="relative w-10 h-10 flex items-center justify-center rounded-lg bg-white shadow-md border border-gray-100 hover:bg-gray-50 transition-colors"
      >
        <span className="text-lg">🔔</span>
        {cargado && total > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-700">Notificaciones</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && eventos.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">No tienes nada pendiente por ahora 🎉</p>
            ) : (
              <>
                {items.map((item, i) => (
                  <Link
                    key={`item-${i}`}
                    href={item.href}
                    onClick={() => setAbierto(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50"
                  >
                    <span className="text-lg flex-shrink-0">{item.icono}</span>
                    <p className="text-sm text-gray-700">
                      <span className="font-bold text-gray-800">{item.cantidad}</span> {item.texto}
                    </p>
                  </Link>
                ))}

                {eventos.length > 0 && (
                  <>
                    <p className="px-4 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wide">
                      📅 Fechas importantes
                    </p>
                    {eventos.map((ev, i) => (
                      <div
                        key={`ev-${i}`}
                        className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0"
                      >
                        <span className="text-lg flex-shrink-0">📆</span>
                        <p className="text-sm text-gray-700">
                          <span className="font-bold text-gray-800">{formatearFecha(ev.fecha)}:</span> {ev.texto}
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
