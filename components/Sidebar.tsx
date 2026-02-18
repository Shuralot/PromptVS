'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        fetch('/api/auth/me').then(res => res.json()).then(data => setUser(data));
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    const groups = [
        {
            title: 'Início',
            items: [{ href: '/dashboard', label: 'Home', icon: '🏠' }]
        },
        {
            title: 'Ação',
            items: [{ href: '/dashboard/simulation', label: 'Iniciar Simulação', icon: '⚡' }]
        },
        {
            title: 'Gestão de IA',
            items: [
                { href: '/dashboard/clients', label: 'Agentes e Clientes', icon: '🤖' },
            ]
        },
        {
            title: 'Parâmetros',
            items: [
                { href: '/dashboard/scenarios', label: 'Personas de Teste', icon: '🎭' },
                { href: '/dashboard/numbers', label: 'Números de Teste', icon: '📱' },
            ]
        }
    ];

    // Add Admin section if role is ADMIN
    if (user?.role === 'ADMIN') {
        groups.push({
            title: 'Sistema',
            items: [{ href: '/dashboard/admin', label: 'Admin e Usuários', icon: '🔑' }]
        });
    }

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-slate-950 border-r border-slate-800/50 flex flex-col p-6 z-50 overflow-y-auto custom-scrollbar">
            {/* Brand */}
            <div className="mb-10 flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-white-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
                    <img src="/logo.png" alt="TrackTest Logo" className="w-8 h-8 object-contain" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-white tracking-tight">TrackTest</h1>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">AI Atende</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-8">
                {groups.map((group) => (
                    <div key={group.title} className="space-y-2">
                        <h3 className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">
                            {group.title}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((link) => {
                                const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                                            ? 'bg-indigo-600/10 text-indigo-400 font-bold shadow-[0_0_20px_rgba(79,70,229,0.1)] border border-indigo-500/20'
                                            : 'text-slate-400 hover:bg-slate-800/40 hover:text-white border border-transparent'
                                            }`}
                                    >
                                        <span className={`text-xl transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'} drop-shadow-md`}>{link.icon}</span>
                                        <span className="tracking-wide text-sm">{link.label}</span>
                                        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_10px_#6366f1]"></div>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User Footer & Logout */}
            <div className="mt-8 pt-6 border-t border-slate-800/50">
                {user && (
                    <div className="px-4 mb-4">
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-black mb-1">Logado como</p>
                        <p className="text-sm text-white font-bold truncate">{user.username}</p>
                    </div>
                )}
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors font-bold text-sm"
                >
                    <span>🚪</span> Sair
                </button>
            </div>
        </aside>
    );
}

