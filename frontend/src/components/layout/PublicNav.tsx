"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Calendarios",             href: "/calendarios",          icono: "📅" },
  { label: "Planes de Estudio",       href: "/planes-estudio",        icono: "📚" },
  { label: "Grupos de Investigación", href: "/grupos-investigacion",  icono: "🔬" },
];

export default function PublicNav() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">

        {/* Logos */}
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logouis.png" alt="UIS" width={90} height={40} className="object-contain" />
          <div className="w-px h-8 bg-gray-200" />
          <Image src="/E3T.png" alt="E3T" width={36} height={36} className="object-contain" />
          <span className="hidden sm:block text-sm font-bold text-gray-700 leading-tight">
            Posgrados E3T
          </span>
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                pathname === link.href
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span>{link.icono}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Botón login */}
        <Link
          href="/login"
          className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
        >
          Ingresar →
        </Link>
      </div>
    </header>
  );
}
