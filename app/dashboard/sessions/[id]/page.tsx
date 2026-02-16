'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';

export default function SessionView({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showPrompt, setShowPrompt] = useState(false);
    const unwrappedParams = use(params);
    const id = unwrappedParams.id;

    useEffect(() => {
        fetchSession();
        const interval = setInterval(fetchSession, 3000); // Poll every 3s as backup

        // Connect to Socket Server
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
        const socket = io(socketUrl);

        socket.on('connect', () => {
            console.log('[Socket] Connected');
            socket.emit('join-session', id);
        });

        socket.on('message', (newMsg: any) => {
            setSession((prev: any) => {
                if (!prev) return prev;
                // Avoid duplicates if we fetched already
                if (prev.messages.find((m: any) => m.id === newMsg.id)) return prev;
                return { ...prev, messages: [...prev.messages, newMsg] };
            });
        });

        socket.on('session-update', (data: any) => {
            // Refresh full state for status changes or report generation
            fetchSession();
        });

        return () => {
            socket.disconnect();
            clearInterval(interval);
        };
    }, [id]);

    const fetchSession = async () => {
        try {
            // Add timestamp to force bypass any aggressive caching
            const res = await fetch(`/api/test-session/${id}?t=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Pragma': 'no-cache' }
            });
            if (res.ok) {
                const data = await res.json();
                console.log("[UI] Poll update:", data.id, "Msgs:", data.messages.length, "Status:", data.status);
                setSession(data);
                setLoading(false);
            }
        } catch (e) {
            console.error("Error fetching session", e);
        }
    };

    const handleStop = async () => {
        if (!confirm('Are you sure you want to stop this test?')) return;
        try {
            await fetch(`/api/test-session/${id}/stop`, { method: 'POST' });
            fetchSession();
        } catch (e) {
            alert('Failed to stop session');
        }
    };

    const handleResume = async () => {
        if (!confirm('Resume this test? Limits will be extended.')) return;
        try {
            await fetch(`/api/test-session/${id}/resume`, { method: 'POST' });
            fetchSession();
        } catch (e) {
            alert('Failed to resume session');
        }
    };

    if (loading && !session) return <div className="p-8 text-white">Loading...</div>;
    if (!session) return <div className="p-8 text-white">Session not found</div>;

    const report = session.report;
    const rawArgs = report?.rawAnalysis ? (typeof report.rawAnalysis === 'string' ? JSON.parse(report.rawAnalysis) : report.rawAnalysis) : {};
    
    // Identificar campos customizados
    const standardKeys = ['score', 'summary', 'strengths', 'weaknesses', 'suggestions', 'avgResponseTimeSeconds', 'totalMessages'];
    const customFields = Object.entries(rawArgs).filter(([key]) => !standardKeys.includes(key));

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col font-sans animate-fade-in-up">
            {/* Header */}
            <header className={`mb-6 flex justify-between items-center bg-slate-800/20 backdrop-blur-xl p-5 rounded-[2rem] border transition-all duration-700 shadow-2xl ${session.simulationMode === 'LABORATORY' ? 'border-emerald-500/20 bg-emerald-950/10' : 'border-slate-700/30'}`}>
                <div className="flex items-center gap-5">
                    <div className="relative group">
                        <div className={`w-4 h-4 rounded-full ${session.status === 'RUNNING' ? (session.simulationMode === 'LABORATORY' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-blue-500 shadow-[0_0_15px_#3b82f6]') : 'bg-slate-600'}`}></div>
                        {session.status === 'RUNNING' && <div className={`absolute -inset-1.5 rounded-full animate-ping opacity-20 ${session.simulationMode === 'LABORATORY' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
                                Sessão <span className="text-slate-500 font-mono text-sm font-medium tracking-normal opacity-50">#{session.id.slice(0, 8)}</span>
                            </h1>
                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${session.simulationMode === 'LABORATORY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                                {session.simulationMode === 'LABORATORY' ? 'LABORATÓRIO' : 'WHATSAPP'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs font-bold text-slate-400">
                                {session.agentVersion?.agent?.name || 'Agente'} • <span className="text-slate-500 font-medium">Versão {session.agentVersion?.versionNumber}</span>
                            </p>
                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                            <span className={`text-xs font-bold uppercase tracking-widest ${session.status === 'RUNNING' ? 'text-indigo-400' : 'text-slate-500'}`}>{session.status}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    {session.status === 'RUNNING' ? (
                        <button
                            onClick={handleStop}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-6 py-2.5 rounded-2xl transition-all text-xs font-black uppercase tracking-widest active:scale-95"
                        >
                            Parar Teste
                        </button>
                    ) : (
                        <button
                            onClick={handleResume}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-6 py-2.5 rounded-2xl transition-all text-xs font-black uppercase tracking-widest active:scale-95"
                        >
                            Retomar
                        </button>
                    )}
                    <button 
                        onClick={() => router.push('/dashboard')} 
                        className="text-slate-400 hover:text-white px-6 py-2.5 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-all text-xs font-black uppercase tracking-widest active:scale-95"
                    >
                        Sair
                    </button>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-0">
                {/* Chat Column */}
                <div className="lg:col-span-3 glass-panel rounded-[2.5rem] border-slate-800/50 flex flex-col overflow-hidden relative shadow-2xl">
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-10 space-y-8 relative z-10 scroll-smooth">
                        {session.messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center text-4xl mb-6 shadow-inner animate-pulse">💬</div>
                                <h3 className="text-xl font-bold text-white mb-2">Aguardando início...</h3>
                                <p className="text-slate-500 text-sm max-w-xs">A simulação está sendo inicializada e a primeira mensagem aparecerá aqui em breve.</p>
                            </div>
                        )}

                        {session.messages.map((msg: any, i: number) => {
                            const isTester = msg.sender === 'TESTER';
                            return (
                                <div key={msg.id} className={`flex ${isTester ? 'justify-end' : 'justify-start'} animate-fade-in-up`} style={{ animationDelay: `${i * 50}ms` }}>
                                    <div className={`max-w-[80%] lg:max-w-[70%] group`}>
                                        <div className={`p-5 rounded-3xl shadow-2xl text-[15px] leading-relaxed transition-all ${isTester
                                            ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-tr-none shadow-indigo-900/20 group-hover:shadow-indigo-600/30'
                                            : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700 group-hover:bg-slate-750'
                                            }`}>
                                            {msg.content}
                                        </div>
                                        <div className={`text-[10px] mt-2 text-slate-500 font-bold uppercase tracking-widest flex gap-3 px-1 ${isTester ? 'justify-end' : 'justify-start'}`}>
                                            <span className={isTester ? 'text-indigo-400' : 'text-slate-400'}>{isTester ? 'Ragnar' : 'Agente Sob Teste'}</span>
                                            <span>•</span>
                                            <span className="opacity-50 font-mono tracking-normal">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Typing Indicator */}
                        {session.status === 'RUNNING' && session.messages.length > 0 && session.messages[session.messages.length - 1].sender === 'TESTER' && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="bg-slate-800/80 p-5 rounded-3xl rounded-tl-none border border-slate-700 flex gap-1.5 items-center w-20 h-14 justify-center">
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats Footer */}
                    <div className="p-4 bg-slate-900/80 border-t border-slate-800/50 backdrop-blur-xl text-xs flex justify-between px-10">
                        <div className="flex gap-8">
                            <span className="flex items-center gap-2"><span className="text-slate-600 uppercase font-black text-[9px] tracking-widest">Turnos</span> <span className="text-white font-mono font-bold">{session.currentTurn}</span></span>
                            <span className="flex items-center gap-2"><span className="text-slate-600 uppercase font-black text-[9px] tracking-widest">Limite</span> <span className="text-white font-mono font-bold">{session.maxMessages}</span></span>
                        </div>
                        <div className="text-[10px] items-center gap-2 hidden sm:flex">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                             <span className="text-slate-500 uppercase font-black tracking-widest">Ambiente de Teste Ativo</span>
                        </div>
                    </div>
                </div>

                {/* Report Column */}
                <div className="glass-panel rounded-[2.5rem] border-slate-800/50 overflow-hidden flex flex-col shadow-2xl relative">
                    <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                        <h3 className="font-black text-white text-xs uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            Relatório de Auditoria
                        </h3>
                        {report && <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest shadow-[0_0_15px_#6366f110]">v4.1-mini (initial)</span>}
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                        {session.status === 'RUNNING' || (session.status === 'STOPPED' && !report) ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-fade-in">
                                <div className="relative w-28 h-28">
                                    <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                                    <div className={`absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent ${session.status === 'RUNNING' ? 'animate-spin' : ''} shadow-[0_0_20px_#6366f133]`}></div>
                                    <div className="absolute inset-0 flex items-center justify-center text-3xl">🧩</div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-white font-black uppercase tracking-widest text-sm">Monitorando...</h4>
                                    <p className="text-xs text-slate-500 px-6 leading-relaxed">
                                        Os heurísticos de segurança e métricas de desempenho estão sendo capturados em tempo real.
                                    </p>
                                </div>
                            </div>
                        ) : report ? (
                            <div className="space-y-8 animate-fade-in">
                                {/* Score Card */}
                                <div className="p-8 rounded-[2rem] bg-gradient-to-br from-slate-800/40 to-slate-900/60 border border-slate-700/50 text-center relative overflow-hidden group">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${report.score > 70 ? 'from-emerald-600/10 to-transparent' : 'from-red-600/10 to-transparent'} transition-opacity opacity-50`}></div>
                                    <div className="relative z-10">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Score de Robustez</div>
                                        <div className={`text-7xl font-black transition-all group-hover:scale-110 tracking-tighter ${report.score > 70 ? 'text-emerald-400' : report.score > 40 ? 'text-amber-400' : 'text-red-400'}`}>
                                            {report.score}
                                        </div>
                                    </div>
                                </div>

                                {/* Qualitative Sections */}
                                <div className="space-y-10">
                                    {report.strengths && (
                                        <section className="space-y-4">
                                            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                                Pontos Fortes
                                                <span className="flex-1 h-px bg-emerald-500/10"></span>
                                            </h4>
                                            <div className="text-sm text-slate-300 bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10 leading-relaxed font-medium">
                                                {report.strengths}
                                            </div>
                                        </section>
                                    )}

                                    {report.weaknesses && (
                                        <section className="space-y-4">
                                            <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                                Vulnerabilidades
                                                <span className="flex-1 h-px bg-rose-500/10"></span>
                                            </h4>
                                            <div className="text-sm text-slate-300 bg-rose-500/5 p-5 rounded-2xl border border-rose-500/10 leading-relaxed font-medium">
                                                {report.weaknesses}
                                            </div>
                                        </section>
                                    )}

                                    {report.suggestions && (
                                        <section className="space-y-4">
                                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                                Sugestões de Reforço
                                                <span className="flex-1 h-px bg-indigo-500/10"></span>
                                            </h4>
                                            <div className="text-sm text-slate-100 bg-indigo-600/10 p-6 rounded-2xl border border-indigo-500/20 leading-relaxed font-medium italic shadow-inner">
                                                "{report.suggestions}"
                                            </div>
                                        </section>
                                    )}

                                    {/* Custom Fields */}
                                    {customFields.map(([key, value]: [string, any]) => (
                                        <section key={key} className="space-y-4">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                                {key}
                                                <span className="flex-1 h-px bg-slate-700/50"></span>
                                            </h4>
                                            <div className="text-sm text-slate-300 bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50 leading-relaxed font-medium">
                                                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                            </div>
                                        </section>
                                    ))}

                                    {/* Used Prompt Collapsible */}
                                    {report.usedPrompt && (
                                        <div className="mt-8 border-t border-slate-800/50 pt-8">
                                            <button 
                                                onClick={() => setShowPrompt(!showPrompt)}
                                                className="w-full text-center text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest flex items-center justify-center gap-2 p-3 hover:bg-slate-800/30 rounded-xl transition-all"
                                            >
                                                <span>{showPrompt ? '▼' : '▶'}</span> Prompt de Auditoria Usado
                                            </button>
                                            {showPrompt && (
                                                <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-400 whitespace-pre-wrap max-h-80 overflow-y-auto custom-scrollbar shadow-inner">
                                                    {report.usedPrompt}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-10 bg-red-950/20 border border-red-500/20 rounded-[2rem]">
                                <div className="text-4xl mb-4">⚠️</div>
                                <h4 className="text-red-400 font-bold mb-2">Falha na Análise</h4>
                                <p className="text-xs text-red-300 opacity-60">Não foi possível processar o relatório de auditoria para esta sessão.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
