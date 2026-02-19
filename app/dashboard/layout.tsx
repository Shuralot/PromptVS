
'use client';

import Sidebar from "@/components/Sidebar";
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex bg-[#0f172a] min-h-screen relative overflow-x-hidden">
      {/* Mobile Menu Button - Visible only on mobile */}
      <button 
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 text-white md:hidden shadow-lg border border-slate-700 active:scale-95 transition-transform"
        aria-label="Toggle Menu"
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed left-0 top-0 h-full w-64 z-50 transition-transform duration-300 ease-in-out md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onCloseMobile={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full min-h-screen relative p-4 md:p-8 pt-16 md:pt-8 md:ml-64 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
