import { Sidebar } from "@/shared/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-surface px-8 py-8">
        {children}
      </main>
    </div>
  );
}
