/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint sigue corriendo en desarrollo (npm run lint / editor),
    // pero no bloquea el build de producción en Docker.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
