'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
    const pathname = usePathname();

    const links = [
        { href: '/dashboard', label: 'Home', icon: '🏠' },
        { href: '/dashboard/clients', label: 'Clients & Agents', icon: '👥' },
        { href: '/dashboard/scenarios', label: 'Personas de Teste', icon: '🎭' },
        { href: '/dashboard/simulation', label: 'Launch Test', icon: '⚡' },
        // { href: '/dashboard/history', label: 'History', icon: 'clock' }, // Future
    ];

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 flex flex-col p-6 z-50">
            {/* Brand */}
            <div className="mb-10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    P
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">PromptVS</h1>
                    <p className="text-xs text-indigo-400 font-medium">AI Atende</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-indigo-600/10 text-indigo-400 font-medium shadow-[0_0_15px_rgba(79,70,229,0.1)]'
                                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                                }`}
                        >
                            <span className={`text-xl transition-transform ${!isActive && 'group-hover:scale-120'}`}>{link.icon}</span>
                            <span>{link.label}</span>
                        </Link>
                    )
                })}
            </nav>

        </aside>
    );
}
