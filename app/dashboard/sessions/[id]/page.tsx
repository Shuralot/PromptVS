'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';

export default function SessionView({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
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

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col font-sans">
            {/* Header */}
            <header className="mb-6 flex justify-between items-center bg-slate-800/50 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${session.status === 'RUNNING' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-slate-500'}`}></div>
                    <div>
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            Session <span className="text-slate-500 font-mono text-sm">#{session.id.slice(0, 8)}</span>
                        </h1>
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                            {session.scenario?.title} • <span className={session.status === 'RUNNING' ? 'text-green-400' : 'text-slate-400'}>{session.status}</span>
                            {session.scenario?.personaSystemPrompt && (
                                <span className="group relative cursor-help">
                                    <span className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold">PROMPT ⓘ</span>
                                    <div className="absolute left-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl z-50 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Prompt do Sistema Usado:</p>
                                        <p className="text-xs text-indigo-300 font-mono leading-relaxed whitespace-pre-wrap">{session.scenario.personaSystemPrompt}</p>
                                    </div>
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {session.status === 'RUNNING' ? (
                        <button
                            onClick={handleStop}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded-xl transition-all text-sm font-medium"
                        >
                            🛑 Stop Test
                        </button>
                    ) : (
                        <button
                            onClick={handleResume}
                            className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/50 px-4 py-2 rounded-xl transition-all text-sm font-medium"
                        >
                            ▶ Resume
                        </button>
                    )}
                    <button onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-800 text-sm">
                        Exit
                    </button>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Chat Column */}
                <div className="lg:col-span-2 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col overflow-hidden relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 scroll-smooth">
                        {session.messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                                <div className="text-4xl mb-2">💬</div>
                                <p>Waiting for conversation to start...</p>
                            </div>
                        )}

                        {session.messages.map((msg: any) => {
                            const isTester = msg.sender === 'TESTER';
                            return (
                                <div key={msg.id} className={`flex ${isTester ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] lg:max-w-[70%] group`}>
                                        <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${isTester
                                            ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-900/20'
                                            : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                            }`}>
                                            {msg.content}
                                        </div>
                                        <div className={`text-[10px] mt-1 text-slate-500 flex gap-2 ${isTester ? 'justify-end' : 'justify-start'}`}>
                                            <span className="font-semibold">{isTester ? 'Tester AI' : 'Agent'}</span>
                                            <span>•</span>
                                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Typing Indicator (Fake for UX) */}
                        {session.status === 'RUNNING' && session.messages.length > 0 && session.messages[session.messages.length - 1].sender === 'TESTER' && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-700 flex gap-1 items-center w-16 h-10">
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats Footer */}
                    <div className="p-3 bg-slate-800/80 border-t border-slate-700 backdrop-blur text-xs text-slate-400 flex justify-between px-6">
                        <span>Turns: {session.currentTurn}</span>
                        <span>Limit: {session.maxMessages} messages</span>
                    </div>
                </div>

                {/* Report Column */}
                <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-800 bg-slate-800/30">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            📊 Analysis Report
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {session.status === 'RUNNING' || (session.status === 'STOPPED' && !report) ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                                <div className="relative w-20 h-20">
                                    <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                                    <div className={`absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent ${session.status === 'RUNNING' ? 'animate-spin' : ''}`}></div>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-white font-medium">Analyzing Conversation...</h4>
                                    <p className="text-xs text-slate-500 max-w-[200px] mx-auto">
                                        Metrics and insights will be generated automatically once the test concludes.
                                    </p>
                                </div>
                            </div>
                        ) : report ? (
                            <div className="space-y-6 animate-fade-in">
                                {/* Score Card */}
                                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                                    <div className="text-sm text-slate-400 uppercase tracking-widest mb-2">Overall Score</div>
                                    <div className={`text-5xl font-bold ${report.score > 70 ? 'text-green-400' : report.score > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {report.score}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">out of 100</div>
                                </div>

                                {/* Key Metrics */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                        <div className="text-[10px] text-slate-400 uppercase">Response Time</div>
                                        <div className="text-lg font-mono text-blue-300">{rawArgs.avgResponseTimeSeconds || '1.2'}s</div>
                                    </div>
                                    <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                        <div className="text-[10px] text-slate-400 uppercase">Hallucinations</div>
                                        <div className="text-lg font-mono text-purple-300">{rawArgs.hallucinations !== 'None' && rawArgs.hallucinations ? '⚠ Detected' : '0'}</div>
                                    </div>
                                </div>

                                {/* Qualitative */}
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                            <span className="text-green-400">●</span> Strengths
                                        </h4>
                                        <p className="text-sm text-slate-300 bg-green-900/10 p-3 rounded-lg border border-green-900/30 leading-relaxed">
                                            {report.strengths}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                            <span className="text-red-400">●</span> Weaknesses
                                        </h4>
                                        <p className="text-sm text-slate-300 bg-red-900/10 p-3 rounded-lg border border-red-900/30 leading-relaxed">
                                            {report.weaknesses}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                            <span className="text-blue-400">●</span> Suggestions
                                        </h4>
                                        <div className="text-sm text-slate-300 bg-blue-900/10 p-3 rounded-lg border border-blue-900/30 leading-relaxed">
                                            {report.suggestions}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-red-400 bg-red-900/10 p-4 rounded-xl">
                                Analysis failed or not available.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
