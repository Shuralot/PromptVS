'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        fetch('/api/auth/me').then(res => res.json()).then(u => setUser(u));
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
        <div className="font-sans px-4 md:px-0 animate-fade-in-up">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">Acesso Autorizado</span>
                    {user && <span className="text-slate-500 text-[10px] font-bold">Bem-vindo, {user.username}</span>}
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-3 text-white tracking-tight">
                    Home
                </h1>
                <p className="text-slate-400 text-lg md:text-xl max-w-2xl">
                    Visão geral de segurança e desempenho para o seu ecossistema AI Atende.
                </p>
            </header>


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {stats.map((s, i) => (
                    <div 
                        key={i} 
                        className="glass-panel p-8 rounded-3xl relative overflow-hidden group hover:-translate-y-1"
                        style={{ animationDelay: `${i * 100}ms` }}
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${s.color} opacity-5 blur-3xl group-hover:opacity-15 transition-opacity`}></div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="text-5xl group-hover:scale-110 transition-transform duration-500 select-none" aria-hidden="true">{s.icon}</div>
                            <div>
                                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em]">{s.label}</p>
                                <p className="text-4xl font-black text-white mt-1">
                                    {loading ? (
                                        <span className="inline-block w-12 h-8 bg-slate-800 animate-pulse rounded"></span>
                                    ) : s.value}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Quick Actions */}
                <div className="lg:col-span-4 space-y-6">
                    <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                        Ações Rápidas
                    </h2>
                    
                    <div className="flex flex-col gap-4">
                        <Link href="/dashboard/clients" aria-label="Criar novo agente" className="block glass-panel p-6 rounded-2xl hover:bg-slate-800/40 flex items-center justify-between group overflow-hidden relative active:scale-[0.98]">
                            <div className="flex items-center gap-4 z-10">
                                <span className="text-2xl group-hover:rotate-6 transition-transform">🤖</span>
                                <div>
                                    <p className="font-bold text-white">Novo Agente</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Criar Persona de IA</p>
                                </div>
                            </div>
                            <span className="text-slate-600 group-hover:translate-x-1 group-hover:text-indigo-400 transition-all z-10">→</span>
                        </Link>

                        <Link href="/dashboard/simulation" aria-label="Lançar novo teste adversarial" className="block glass-panel p-6 rounded-2xl border-indigo-500/30 bg-indigo-600/5 hover:bg-indigo-600/10 flex items-center justify-between group overflow-hidden relative active:scale-[0.98] border-l-4 border-l-indigo-500">
                            <div className="flex items-center gap-4 z-10">
                                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">⚡</span>
                                <div>
                                    <p className="font-bold text-indigo-400">Lançar Teste</p>
                                    <p className="text-[10px] text-indigo-500/70 uppercase tracking-wider">Simulação Adversarial</p>
                                </div>
                            </div>
                            <span className="text-indigo-400 group-hover:translate-x-1 transition-all z-10">→</span>
                        </Link>

                        <Link href="/dashboard/numbers" aria-label="Gerenciar números de teste" className="block glass-panel p-6 rounded-2xl hover:bg-slate-800/40 flex items-center justify-between group overflow-hidden relative active:scale-[0.98]">
                            <div className="flex items-center gap-4 z-10">
                                <span className="text-2xl group-hover:rotate-6 transition-transform">📱</span>
                                <div>
                                    <p className="font-bold text-white">Números de Teste</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Gerenciar Lista</p>
                                </div>
                            </div>
                            <span className="text-slate-600 group-hover:translate-x-1 group-hover:text-indigo-400 transition-all z-10">→</span>
                        </Link>

                        <Link href="/dashboard/audit-config" aria-label="Configurar prompt de auditoria" className="block glass-panel p-6 rounded-2xl hover:bg-slate-800/40 flex items-center justify-between group overflow-hidden relative active:scale-[0.98]">
                            <div className="flex items-center gap-4 z-10">
                                <span className="text-2xl group-hover:rotate-6 transition-transform">⚙️</span>
                                <div>
                                    <p className="font-bold text-white">Prompt de Auditoria</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Configurar Avaliador</p>
                                </div>
                            </div>
                            <span className="text-slate-600 group-hover:translate-x-1 group-hover:text-indigo-400 transition-all z-10">→</span>
                        </Link>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-8 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                            Execuções Recentes
                        </h2>
                        <button className="text-[10px] font-bold text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-[0.2em]">Ver Tudo</button>
                    </div>
                    <div className="glass-panel rounded-3xl overflow-hidden bg-slate-900/40 shadow-inner">
                        {loading && (
                            <div className="p-12 space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center justify-between animate-pulse">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                                            <div className="space-y-2">
                                                <div className="w-32 h-3 bg-slate-800 rounded"></div>
                                                <div className="w-20 h-2 bg-slate-800 rounded"></div>
                                            </div>
                                        </div>
                                        <div className="w-16 h-4 bg-slate-800 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!loading && (!data?.recentSessions || data.recentSessions.length === 0) && (
                            <div className="p-16 text-center">
                                <div className="text-3xl mb-4 grayscale opacity-30">📭</div>
                                <p className="text-slate-500 mb-6">Nenhuma sessão de teste iniciada ainda.</p>
                                <Link href="/dashboard/simulation" className="bg-indigo-600/10 text-indigo-400 px-6 py-3 rounded-xl border border-indigo-500/20 hover:bg-indigo-600/20 transition-all font-bold">Lançar primeira simulação</Link>
                            </div>
                        )}
                        {data?.recentSessions?.map((session: any) => (
                            <Link key={session.id} href={`/dashboard/sessions/${session.id}`} className="flex items-center justify-between p-6 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/40 transition-all group">
                                <div className="flex items-center gap-5">
                                    <div className={`w-2.5 h-2.5 rounded-full ${session.status === 'RUNNING' ? 'bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'}`}></div>
                                    <div>
                                        <p className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                                            {session.agentVersion?.agent?.name || 'Agente Desconhecido'}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 tracking-wider uppercase">{session.simulationMode} Mode</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400">{new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p className="text-[9px] font-black text-indigo-500/80 mt-1 uppercase tracking-widest leading-none">{session.status}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
