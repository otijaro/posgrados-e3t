"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { login, getMe, rutaPorRol } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      await login(email, password);
      const user = await getMe();
      if (!user) throw new Error("No se pudo obtener el usuario");
      router.push(rutaPorRol(user));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
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
          <h1 className="text-2xl font-bold text-gray-800">Sistema de Posgrados</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Escuela de Ingeniería Eléctrica, Electrónica y de Telecomunicaciones
          </p>
        </div>

        {/* Tarjeta */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-6">Iniciar sesión</h2>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
              {cargando ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>

        {/* Volver al inicio */}
        <p className="text-center text-sm text-gray-400 mt-5">
          <Link href="/" className="hover:text-green-700 transition-colors">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
