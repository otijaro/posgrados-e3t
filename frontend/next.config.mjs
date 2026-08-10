/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint sigue corriendo en desarrollo (npm run lint / editor),
    // pero no bloquea el build de producción en Docker.
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    // Proxy interno: el navegador siempre llama a /api/... (mismo origen),
    // y Next.js lo reenvía server-side al contenedor del backend.
    // Esto hace que la app funcione igual sea que se acceda por
    // localhost, IP de LAN, o por Twingate — sin depender de una URL fija.
    return [
      { source: '/api/:path*', destination: 'http://backend:8000/api/:path*' },
    ];
  },
};

export default nextConfig;
