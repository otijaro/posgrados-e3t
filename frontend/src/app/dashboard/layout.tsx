import Sidebar from "@/components/layout/Sidebar";
import NotificacionesBell from "@/components/layout/NotificacionesBell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <NotificacionesBell />
      <main className="overflow-y-auto p-8 pt-20">
        {children}
      </main>
    </div>
  );
}
