import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex bg-[#0f172a] min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen relative p-8">
        {children}
      </main>
    </div>
  );
}
