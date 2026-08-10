"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function OlvideContrasenaPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "No se pudo procesar la solicitud");
      }
      // El backend siempre responde igual, exista o no la cuenta.
      setEnviado(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al enviar la solicitud");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logos */}
        <div className="flex items-center justify-center gap-5 mb-8">
          <Image src="/logouis.png" alt="UIS" width={130} height={55} className="object-contain" />
          <div className="w-px h-12 bg-gray-200" />
          <Image src="/E3T.png" alt="E3T" width={52} height={48} className="object-contain" />
        </div>

        {/* Título */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Recuperar contraseña</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Te enviaremos un enlace a tu correo institucional para crear una nueva contraseña.
          </p>
        </div>

        {/* Tarjeta */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {enviado ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">📩</div>
              <p className="text-gray-700 text-sm">
                Si el correo <strong>{email}</strong> está registrado en el sistema,
                te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja
                de entrada (y la carpeta de spam, por si acaso).
              </p>
              <p className="text-gray-400 text-xs">
                El enlace es válido por 1 hora.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo institucional
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@uis.edu.co"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900
                             focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent
                             placeholder:text-gray-400"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-400
                           text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                {cargando ? "Enviando..." : "Enviar enlace de recuperación"}
              </button>
            </form>
          )}
        </div>

        {/* Volver al login */}
        <p className="text-center text-sm text-gray-400 mt-5">
          <Link href="/login" className="hover:text-green-700 transition-colors">
            ← Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
