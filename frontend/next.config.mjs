/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint sigue corriendo en desarrollo (npm run lint / editor),
    // pero no bloquea el build de producción en Docker.
    ignoreDuringBuilds: true,
  },
  // Evita que Next.js normalice automáticamente las barras finales de la URL
  // (redirect automático /api/documentos/ → /api/documentos) ANTES de aplicar
  // los rewrites de abajo. Sin esto, se arma un rebote de redirecciones entre
  // Next.js y el backend (que sí espera la barra final) y la petición falla.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    // Proxy interno: el navegador siempre llama a /api/... o /uploads/... (mismo origen),
    // y Next.js lo reenvía server-side al contenedor del backend.
    // Esto hace que la app funcione igual sea que se acceda por
    // localhost, IP de LAN, o por Twingate — sin depender de una URL fija.
    return [
      { source: '/api/:path*', destination: 'http://backend:8000/api/:path*' },
      { source: '/uploads/:path*', destination: 'http://backend:8000/uploads/:path*' },
    ];
  },
};

export default nextConfig;
