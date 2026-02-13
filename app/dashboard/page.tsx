'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(d => setData(d))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const stats = [
        { label: 'Clientes Ativos', value: data?.stats?.clients || 0, icon: '🏢', color: 'from-indigo-500 to-blue-600 shadow-indigo-900/20' },
        { label: 'Agentes IA', value: data?.stats?.agents || 0, icon: '🤖', color: 'from-blue-500 to-cyan-600 shadow-blue-900/20' },
        { label: 'Total de Testes', value: data?.stats?.sessions || 0, icon: '⚔️', color: 'from-indigo-600 to-purple-600 shadow-purple-900/20' },
    ];

    return (
        <div className="font-sans px-4 md:px-0">
            <header className="mb-12">
                <h1 className="text-4xl font-extrabold mb-2 text-white tracking-tight">
                    Dashboard <span className="text-indigo-500">PromptVS</span>
                </h1>
                <p className="text-slate-400 text-lg">Visão geral do ecossistema AI Atende.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {stats.map((s, i) => (
                    <div key={i} className="glass-panel p-6 rounded-3xl border-slate-700/50 bg-slate-800/20 relative overflow-hidden group hover:scale-[1.03] transition-all duration-300 shadow-lg">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${s.color} opacity-5 blur-3xl group-hover:opacity-15 transition-opacity`}></div>
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="text-4xl group-hover:scale-110 transition-transform duration-500">{s.icon}</div>
                            <div>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">{s.label}</p>
                                <p className="text-3xl font-black text-white mt-1">
                                    {loading ? '...' : s.value}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Quick Actions */}
                <div className="lg:col-span-4 space-y-4">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                        Ações Rápidas
                    </h2>
                    <Link href="/dashboard/clients" className="block glass-panel p-6 rounded-2xl border-slate-700/50 hover:bg-slate-800/60 transition-all flex items-center justify-between group overflow-hidden relative active:scale-95">
                        <div className="flex items-center gap-4 z-10">
                            <span className="text-2xl group-hover:rotate-6 transition-transform">➕</span>
                            <div>
                                <p className="font-bold text-white">Novo Agente</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Criar Persona de IA</p>
                            </div>
                        </div>
                        <span className="text-slate-600 group-hover:translate-x-1 group-hover:text-indigo-400 transition-all z-10">→</span>
                        <div className="absolute inset-0 bg-indigo-600/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </Link>

                    <Link href="/dashboard/simulation" className="block glass-panel p-6 rounded-2xl border-indigo-500/30 bg-indigo-600/5 hover:bg-indigo-600/10 transition-all flex items-center justify-between group overflow-hidden relative active:scale-95 border-l-4 border-l-indigo-500">
                        <div className="flex items-center gap-4 z-10">
                            <span className="text-2xl group-hover:scale-125 transition-transform duration-300">⚡</span>
                            <div>
                                <p className="font-bold text-indigo-400">Lançar Teste</p>
                                <p className="text-[10px] text-indigo-500/70 uppercase tracking-wider">Simulação Adversarial</p>
                            </div>
                        </div>
                        <span className="text-indigo-400 group-hover:translate-x-1 transition-all z-10">→</span>
                        <div className="absolute inset-0 bg-indigo-600/5 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                    </Link>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-8 flex flex-col mt-8 lg:mt-0">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                            Execuções Recentes
                        </h2>
                        <button className="text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-widest">Ver Tudo</button>
                    </div>
                    <div className="glass-panel rounded-2xl border-slate-700/50 overflow-hidden bg-slate-800/20 flex-1">
                        {loading && <div className="p-8 text-center text-slate-500 animate-pulse">Fetching history...</div>}
                        {!loading && (!data?.recentSessions || data.recentSessions.length === 0) && (
                            <div className="p-12 text-center">
                                <p className="text-slate-500 mb-4">No recent test sessions found.</p>
                                <Link href="/dashboard/simulation" className="text-blue-400 hover:underline">Launch your first test</Link>
                            </div>
                        )}
                        {data?.recentSessions?.map((session: any) => (
                            <Link key={session.id} href={`/dashboard/sessions/${session.id}`} className="flex items-center justify-between p-5 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${session.status === 'RUNNING' ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                                    <div>
                                        <p className="text-sm font-bold text-white">
                                            {session.agentVersion?.agent?.name || 'Unknown Agent'}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-mono">ID: {session.id}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400">{new Date(session.createdAt).toLocaleTimeString()}</p>
                                    <p className="text-[10px] text-blue-400 font-medium uppercase">{session.status}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
