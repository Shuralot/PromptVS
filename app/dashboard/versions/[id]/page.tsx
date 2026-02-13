'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function VersionHistoryPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const versionId = unwrappedParams.id;
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (versionId) fetchSessions();
    }, [versionId]);

    const fetchSessions = async () => {
        try {
            const res = await fetch(`/api/versions/${versionId}/sessions`);
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="font-sans">
            <header className="mb-10">
                <div className="mb-4">
                    <button onClick={() => window.history.back()} className="text-slate-500 hover:text-white flex items-center gap-1 transition-colors text-sm">
                        ← Back to Agent Versions
                    </button>
                </div>
                <div>
                    <h1 className="text-4xl font-bold mb-2 text-white">
                        Version History
                    </h1>
                    <p className="text-slate-400">Review all test simulations for this specific version.</p>
                </div>
            </header>

            <div className="space-y-4">
                {loading && <p className="text-slate-400 animate-pulse">Loading sessions...</p>}

                {!loading && sessions.length === 0 && (
                    <div className="p-10 text-center border border-dashed border-slate-700 rounded-2xl">
                        <p className="text-slate-500">No test sessions recorded for this version yet.</p>
                        <Link href="/dashboard" className="text-blue-400 hover:underline mt-2 inline-block">Start a new simulation</Link>
                    </div>
                )}

                {sessions.map((session: any) => (
                    <Link href={`/dashboard/sessions/${session.id}`} key={session.id}>
                        <div className="glass-panel p-6 rounded-2xl border-slate-700/50 hover:bg-slate-800/60 transition-all mb-4 group">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                                            {session.scenario?.title || 'Unknown Scenario'}
                                        </h3>
                                        <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${session.status === 'COMPLETED' ? 'bg-green-900 text-green-300' :
                                                session.status === 'FAILED' ? 'bg-red-900 text-red-300' :
                                                    'bg-blue-900 text-blue-300 animate-pulse'
                                            }`}>
                                            {session.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        Target: {session.targetNumber} | Difficulty: {session.scenario?.difficulty}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <div className="text-2xl font-bold text-white mb-1">
                                        {session.report?.score ? (
                                            <span className={
                                                session.report.score >= 80 ? 'text-green-400' :
                                                    session.report.score >= 50 ? 'text-yellow-400' :
                                                        'text-red-400'
                                            }>{session.report.score}%</span>
                                        ) : (
                                            <span className="text-slate-600">-</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {new Date(session.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
