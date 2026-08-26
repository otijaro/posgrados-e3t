"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMe, rutaPorRol } from "@/lib/auth";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      router.replace("/login?error=microsoft_token");
      return;
    }
    localStorage.setItem("token", token);

    getMe()
      .then((user) => {
        if (!user) {
          setError("No se pudo verificar tu sesión. Intenta de nuevo.");
          return;
        }
        router.replace(rutaPorRol(user));
      })
      .catch(() => setError("Ocurrió un error al iniciar sesión."));
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-red-600 text-sm mb-3">{error}</p>
            <a href="/login" className="text-green-700 text-sm font-semibold hover:underline">
              Volver a intentar
            </a>
          </>
        ) : (
          <p className="text-gray-400 text-sm">Iniciando sesión...</p>
        )}
      </div>
    </div>
  );
}

export default function LoginCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackHandler />
    </Suspense>
  );
}
