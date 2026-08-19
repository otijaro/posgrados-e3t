"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { login, getMe, rutaPorRol } from "@/lib/auth";

const MICROSOFT_CLIENT_ID = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || "";
const MICROSOFT_TENANT_ID = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID || "";

function construirUrlMicrosoft(): string {
  const redirectUri = `${window.location.origin}/api/auth/microsoft/callback`;
  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: "openid profile email User.Read",
    // Viaja de ida y vuelta con el mismo redirect_uri, para que el backend
    // sepa exactamente a qué origen regresar (funciona en cualquier puerto/host).
    state: redirectUri,
  });
  return `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
}

const errorLabels: Record<string, string> = {
  microsoft_cancelado:     "Inicio de sesión con Microsoft cancelado.",
  microsoft_token:         "No se pudo completar el inicio de sesión con Microsoft. Intenta de nuevo.",
  microsoft_sin_correo:    "No se pudo obtener tu correo desde Microsoft. Intenta de nuevo.",
  correo_no_registrado:    "Tu correo no está registrado en el sistema. Contacta a la coordinación de posgrados.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    errorLabels[searchParams.get("error") ?? ""] ?? null
  );
  const [cargando, setCargando] = useState(false);
  const microsoftConfigurado = Boolean(MICROSOFT_CLIENT_ID && MICROSOFT_TENANT_ID);

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

  function handleMicrosoftLogin() {
    window.location.href = construirUrlMicrosoft();
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          {microsoftConfigurado && (
            <>
              <button
                type="button"
                onClick={handleMicrosoftLogin}
                className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-2.5
                           text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors mb-5"
              >
                <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
                Continuar con Microsoft
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">o con tu contraseña</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            </>
          )}

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
              <div className="text-right mt-1.5">
                <Link href="/olvide-contrasena" className="text-xs text-green-700 hover:text-green-800 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
