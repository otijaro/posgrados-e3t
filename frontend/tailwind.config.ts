import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Se redefine la paleta "green" completa para que apunte al azul
        // institucional (RGB 0,113,182 / #0071B6 → tono 600), así TODAS las
        // clases bg-green-*, text-green-*, border-green-*, hover:bg-green-*,
        // focus:ring-green-*, etc. en todo el proyecto cambian de color sin
        // tener que tocar cada archivo uno por uno.
        green: {
          50:  "hsl(203, 100%, 96%)",
          100: "hsl(203, 100%, 91%)",
          200: "hsl(203, 98%, 83%)",
          300: "hsl(203, 96%, 71%)",
          400: "hsl(203, 96%, 58%)",
          500: "hsl(203, 100%, 44%)",
          600: "hsl(203, 100%, 36%)",
          700: "hsl(203, 100%, 30%)",
          800: "hsl(203, 95%, 24%)",
          900: "hsl(203, 85%, 19%)",
          950: "hsl(203, 90%, 11%)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
