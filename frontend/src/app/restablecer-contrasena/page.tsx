"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function RestablecerContrasenaPage() {
  return (
    <Suspense fallback={null}>
      <RestablecerContrasenaForm />
    </Suspense>
  );
}

function RestablecerContrasenaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "No se pudo restablecer la contraseña");
      setListo(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al restablecer la contraseña");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="flex items-center justify-center gap-5 mb-8">
          <Image src="/logouis.png" alt="UIS" width={130} height={55} className="object-contain" />
          <div className="w-px h-12 bg-gray-200" />
          <Image src="/E3T.png" alt="E3T" width={52} height={48} className="object-contain" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Nueva contraseña</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {!token ? (
            <div className="text-center space-y-3">
              <p className="text-red-600 text-sm">
                Este enlace no es válido. Solicita uno nuevo desde la página de recuperación.
              </p>
              <Link href="/olvide-contrasena" className="text-green-700 text-sm hover:underline">
                Ir a recuperar contraseña →
              </Link>
            </div>
          ) : listo ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">✅</div>
              <p className="text-gray-700 text-sm">
                Tu contraseña fue actualizada correctamente. Te vamos a redirigir al login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900
                             focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent
                             placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  required
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="Repite la contraseña"
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
                {cargando ? "Guardando..." : "Guardar nueva contraseña"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-400 mt-5">
          <Link href="/login" className="hover:text-green-700 transition-colors">
            ← Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
