// Tarjeta de resumen reutilizable
interface StatCardProps {
  titulo: string;
  valor: string | number;
  descripcion: string;
  icono: string;
  color: string;
}

export function StatCard({ titulo, valor, descripcion, icono, color }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{titulo}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{valor}</p>
          <p className="text-sm text-gray-400 mt-1">{descripcion}</p>
        </div>
        <span className="text-4xl">{icono}</span>
      </div>
    </div>
  );
}
