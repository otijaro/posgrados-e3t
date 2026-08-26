"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { getMe, UserInfo } from "@/lib/auth";
import {
  getMiPerfil, EstudianteInfo, actualizarPerfil, subirFotoPerfil,
  getDocentesDisponibles, DocenteOpcion,
} from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function SelectorPersona({
  label, nombre, correo, esExterno,
  onNombreChange, onCorreoChange, onExternoChange,
  docentes,
}: {
  label: string;
  nombre: string;
  correo: string;
  esExterno: boolean;
  onNombreChange: (v: string) => void;
  onCorreoChange: (v: string) => void;
  onExternoChange: (v: boolean) => void;
  docentes: DocenteOpcion[];
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={esExterno}
            onChange={(e) => { onExternoChange(e.target.checked); onNombreChange(""); }}
            className="rounded border-gray-300"
          />
          Es externo (no está en la lista)
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
          {esExterno ? (
            <input
              type="text"
              value={nombre}
              onChange={(e) => onNombreChange(e.target.value)}
              placeholder="Nombre completo"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white
                         focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          ) : (
            <select
              value={nombre}
              onChange={(e) => {
                onNombreChange(e.target.value);
                const doc = docentes.find((d) => d.nombre_completo === e.target.value);
                if (doc) onCorreoChange(doc.email_institucional);
              }}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white appearance-none
                         focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Selecciona de la lista...</option>
              {docentes.map((d) => (
                <option key={d.id} value={d.nombre_completo}>{d.nombre_completo}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Correo</label>
          <input
            type="email"
            value={correo}
            onChange={(e) => onCorreoChange(e.target.value)}
            placeholder="correo@uis.edu.co"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white
                       focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
    </div>
  );
}

export default function PerfilPage() {
  const [user, setUser]       = useState<UserInfo | null>(null);
  const [perfil, setPerfil]   = useState<EstudianteInfo | null>(null);
  const [docentes, setDocentes] = useState<DocenteOpcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Formulario editable
  const [titulo, setTitulo]                     = useState("");
  const [promedio, setPromedio]                 = useState("");
  const [directorNombre, setDirectorNombre]       = useState("");
  const [directorCorreo, setDirectorCorreo]       = useState("");
  const [directorExterno, setDirectorExterno]     = useState(false);
  const [codirectorNombre, setCodirectorNombre]   = useState("");
  const [codirectorCorreo, setCodirectorCorreo]   = useState("");
  const [codirectorExterno, setCodirectorExterno] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje]     = useState<string | null>(null);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  // Foto
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMe(), getMiPerfil(), getDocentesDisponibles()])
      .then(([u, p, docs]) => {
        setUser(u);
        setPerfil(p);
        setDocentes(docs);
        setFotoUrl(u?.foto_url ?? null);
        setPromedio(p.promedio_acumulado ?? "");
        if (p.proyecto) {
          setTitulo(p.proyecto.titulo ?? "");
          const nombreDir = p.proyecto.director === "Sin director registrado" ? "" : p.proyecto.director ?? "";
          setDirectorNombre(nombreDir);
          setDirectorCorreo(p.proyecto.director_correo ?? "");
          setDirectorExterno(Boolean(nombreDir) && !docs.some((d) => d.nombre_completo === nombreDir));
          setCodirectorNombre(p.proyecto.codirector ?? "");
          setCodirectorCorreo(p.proyecto.codirector_correo ?? "");
          setCodirectorExterno(
            Boolean(p.proyecto.codirector) && !docs.some((d) => d.nombre_completo === p.proyecto?.codirector)
          );
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  function iniciales(nombre?: string | null): string {
    if (!nombre) return "…";
    return nombre.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    setErrorForm(null);
    setMensaje(null);

    if (promedio) {
      const valor = Number(promedio);
      if (Number.isNaN(valor) || valor < 0 || valor > 5) {
        setErrorForm("El promedio debe ser un número entre 0.0 y 5.0");
        return;
      }
    }

    setGuardando(true);
    try {
      await actualizarPerfil({
        titulo: titulo || undefined,
        promedio_acumulado: promedio || undefined,
        director_nombre: directorNombre || undefined,
        director_correo: directorCorreo || undefined,
        codirector_nombre: codirectorNombre || undefined,
        codirector_correo: codirectorCorreo || undefined,
      });
      setMensaje("Información actualizada correctamente.");
      const p = await getMiPerfil();
      setPerfil(p);
    } catch (err: unknown) {
      setErrorForm(err instanceof Error ? err.message : "Error al guardar los cambios");
    } finally {
      setGuardando(false);
    }
  }

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoFoto(true);
    setErrorForm(null);
    try {
      const res = await subirFotoPerfil(file);
      setFotoUrl(res.foto_url);
    } catch (err: unknown) {
      setErrorForm(err instanceof Error ? err.message : "Error al subir la foto");
    } finally {
      setSubiendoFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (cargando) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando perfil...</div>;
  if (error)    return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">⚠️ {error}</div>;

  const esDoctorado = perfil?.programa?.includes("Doctorado") ?? false;
  const labelTitulo = esDoctorado ? "Título de la tesis" : "Título del proyecto de grado";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">👤 Mi Perfil</h1>
        <p className="text-gray-500 mt-1">Consulta tu información y mantén actualizados los datos de tu proyecto.</p>
      </div>

      {/* Foto + info no editable */}
      <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-6 flex-wrap">
        <div className="relative">
          {fotoUrl ? (
            <Image
              src={`${API_URL}${fotoUrl}`}
              alt="Foto de perfil"
              width={88} height={88}
              className="rounded-full object-cover w-[88px] h-[88px] border border-gray-100"
            />
          ) : (
            <div className="w-[88px] h-[88px] rounded-full bg-green-600 text-white flex items-center justify-center text-2xl font-bold">
              {iniciales(user?.nombre_completo)}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={subiendoFoto}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow border border-gray-200
                       flex items-center justify-center text-sm hover:bg-gray-50"
            title="Cambiar foto"
          >
            {subiendoFoto ? "…" : "📷"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFotoChange}
            className="hidden"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <p className="text-lg font-bold text-gray-800">{user?.nombre_completo}</p>
          <p className="text-sm text-gray-500 mt-0.5">{user?.email_institucional}</p>
          <div className="flex flex-wrap gap-4 mt-2 text-sm">
            <span className="text-gray-400">Código: <span className="text-gray-700 font-medium">{perfil?.codigo_estudiante}</span></span>
            <span className="text-gray-400">Programa: <span className="text-gray-700 font-medium">{perfil?.programa}</span></span>
          </div>
        </div>
      </div>

      {/* Formulario editable */}
      <form onSubmit={handleGuardar} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <h2 className="text-base font-bold text-gray-800">
          {esDoctorado ? "📄 Tesis de Investigación" : "📄 Proyecto de Investigación"}
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Promedio ponderado acumulado <span className="text-gray-400 font-normal">(escala 0.0 – 5.0)</span>
          </label>
          <input
            type="number"
            step="0.1" min="0" max="5"
            value={promedio}
            onChange={(e) => setPromedio(e.target.value)}
            placeholder="4.5"
            className="w-full md:w-40 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900
                       focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent
                       placeholder:text-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{labelTitulo}</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Escribe el título de tu trabajo de grado"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900
                       focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent
                       placeholder:text-gray-400"
          />
        </div>

        <SelectorPersona
          label="Director"
          nombre={directorNombre}
          correo={directorCorreo}
          esExterno={directorExterno}
          onNombreChange={setDirectorNombre}
          onCorreoChange={setDirectorCorreo}
          onExternoChange={setDirectorExterno}
          docentes={docentes}
        />

        <SelectorPersona
          label="Codirector (opcional)"
          nombre={codirectorNombre}
          correo={codirectorCorreo}
          esExterno={codirectorExterno}
          onNombreChange={setCodirectorNombre}
          onCorreoChange={setCodirectorCorreo}
          onExternoChange={setCodirectorExterno}
          docentes={docentes}
        />

        {errorForm && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{errorForm}</div>
        )}
        {mensaje && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{mensaje}</div>
        )}

        <button
          type="submit"
          disabled={guardando}
          className="bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>

        <p className="text-xs text-gray-400 pt-2 border-t border-gray-50">
          Nota: estos cambios se guardan directamente, sin pasar por aprobación del comité.
          Si necesitas un cambio formal y con soporte documental (por ejemplo, para un cambio
          oficial de director ya avanzado el proyecto), usa la solicitud &quot;Cambio de Director / Codirector&quot;
          desde el módulo de Solicitudes.
        </p>
      </form>
    </div>
  );
}
