'use client';

import { useState, useEffect } from 'react';

export default function SimulationWizard() {
    // Selection State
    const [clients, setClients] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [versions, setVersions] = useState<any[]>([]);

    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedAgentId, setSelectedAgentId] = useState('');
    const [selectedVersionId, setSelectedVersionId] = useState('');

    // Test Config State
    const [targetNumber, setTargetNumber] = useState('');
    const [scenarios, setScenarios] = useState<any[]>([]);
    const [selectedScenarioId, setSelectedScenarioId] = useState('');
    const [maxMessages, setMaxMessages] = useState(10);
    const [testMode, setTestMode] = useState<'EVOLUTION' | 'LABORATORY'>('EVOLUTION');
    const [tenantId] = useState('demo-tenant');
    const [loading, setLoading] = useState(false);

    // Initial Load: Scenarios & Clients
    useEffect(() => {
        fetch('/api/scenarios')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setScenarios(data);
            });

        fetch('/api/clients')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setClients(data);
            })
            .catch(err => console.error("Failed to fetch clients", err));
    }, []);

    // Cascade: Fetch Agents when Client changes
    useEffect(() => {
        setAgents([]);
        setVersions([]);
        setSelectedAgentId('');
        setSelectedVersionId('');

        if (selectedClientId) {
            fetch(`/api/agents?clientId=${selectedClientId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setAgents(data);
                });
        }
    }, [selectedClientId]);

    // Cascade: Fetch Versions when Agent changes
    useEffect(() => {
        setVersions([]);
        setSelectedVersionId('');

        if (selectedAgentId) {
            fetch(`/api/agents/${selectedAgentId}/versions`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setVersions(data);
                        if (data.length > 0) setSelectedVersionId(data[0].id);
                    }
                });
        }
    }, [selectedAgentId]);

    const handleStartTest = async () => {
        if (!selectedScenarioId || !targetNumber || !selectedVersionId) return;
        setLoading(true);

        try {
            const res = await fetch('/api/test-session/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId,
                    scenarioId: selectedScenarioId,
                    targetNumber: testMode === 'LABORATORY' ? (targetNumber || 'LAB-TEST') : targetNumber,
                    maxMessages: Number(maxMessages),
                    agentVersionId: selectedVersionId,
                    simulationMode: testMode
                })
            });
            const data = await res.json();
            if (data.sessionId) {
                window.location.href = `/dashboard/sessions/${data.sessionId}`;
            } else {
                alert('Failed to start: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            alert('Error starting test');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="font-sans">
            <header className="mb-12">
                <button onClick={() => window.history.back()} className="text-slate-500 hover:text-white transition-colors text-sm mb-4 flex items-center gap-2">
                    <span className="text-lg">←</span> Voltar
                </button>
                <h1 className="text-4xl font-black mb-2 text-white tracking-tight">Launcher de Simulação</h1>
                <p className="text-slate-400 text-lg">Selecione uma versão do agente para realizar um ataque adversarial.</p>
            </header>

            <main className="max-w-4xl">
                {/* Mode Selector */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setTestMode('EVOLUTION')}
                        className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${testMode === 'EVOLUTION'
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                    >
                        <span className="text-2xl">📱</span>
                        <div className="text-center">
                            <p className="font-bold text-sm">Modo WhatsApp</p>
                            <p className="text-[10px] opacity-60">Usa Evolution API + Celular</p>
                        </div>
                    </button>
                    <button
                        onClick={() => setTestMode('LABORATORY')}
                        className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${testMode === 'LABORATORY'
                            ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                    >
                        <span className="text-2xl">🧪</span>
                        <div className="text-center">
                            <p className="font-bold text-sm">Modo Laboratório</p>
                            <p className="text-[10px] opacity-60">100% Interno (Sem WhatsApp)</p>
                        </div>
                    </button>
                </div>

                <div className="glass-panel p-8 rounded-3xl border-slate-700/50 bg-slate-800/20 shadow-2xl">
                    <div className="space-y-10">
                        {/* Hierarchy Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Cliente</label>
                                <select
                                    value={selectedClientId}
                                    onChange={(e) => setSelectedClientId(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                >
                                    <option value="">-- Selecione o Cliente --</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Agente</label>
                                <select
                                    value={selectedAgentId}
                                    onChange={(e) => setSelectedAgentId(e.target.value)}
                                    disabled={!selectedClientId}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-30"
                                >
                                    <option value="">-- Selecione o Agente --</option>
                                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Versão</label>
                                <select
                                    value={selectedVersionId}
                                    onChange={(e) => setSelectedVersionId(e.target.value)}
                                    disabled={!selectedAgentId}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-30"
                                >
                                    <option value="">-- Selecione a Versão --</option>
                                    {versions.map(v => <option key={v.id} value={v.id}>{v.versionNumber}</option>)}
                                </select>
                            </div>
                        </div>

                        {selectedAgentId && agents.find(a => a.id === selectedAgentId)?.assistantId && (
                            <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top-2 duration-500">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-xl">🤖</div>
                                <div>
                                    <p className="text-sm font-bold text-white">IA da Plataforma Ativa</p>
                                    <p className="text-xs text-indigo-400 font-mono">Assistant ID: {agents.find(a => a.id === selectedAgentId).assistantId}</p>
                                </div>
                                <div className="ml-auto">
                                    <span className="bg-indigo-500 text-[10px] font-black px-2 py-1 rounded-md text-white uppercase tracking-tighter shadow-lg shadow-indigo-900/40">OpenAI Assistants API</span>
                                </div>
                            </div>
                        )}

                        <hr className="border-slate-800" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Número WhatsApp de Destino</label>
                                <input
                                    type="text"
                                    value={targetNumber}
                                    onChange={(e) => setTargetNumber(e.target.value)}
                                    placeholder="Ex: 55119..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest flex justify-between">
                                    <span>Profundidade (Máx Mensagens)</span>
                                    <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-mono">{maxMessages}</span>
                                </label>
                                <div className="relative h-10 flex items-center">
                                    <input
                                        type="range"
                                        min="5"
                                        max="50"
                                        step="1"
                                        value={maxMessages}
                                        onChange={(e) => setMaxMessages(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                                    />
                                    <div className="absolute -bottom-4 left-0 right-0 flex justify-between text-[10px] text-slate-600 font-mono">
                                        <span>5</span>
                                        <span>25</span>
                                        <span>50</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest">
                                Cenário Adversarial
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {scenarios.map((s: any) => (
                                    <div
                                        key={s.id}
                                        onClick={() => setSelectedScenarioId(s.id)}
                                        className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] ${selectedScenarioId === s.id
                                            ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                                            : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-600'
                                            }`}
                                    >
                                        <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-0 transition-opacity duration-500 blur-2xl ${selectedScenarioId === s.id && 'opacity-20'}`}></div>
                                        <div className="font-bold text-white mb-2 relative z-10 flex justify-between items-center text-sm md:text-base">
                                            {s.title}
                                            {selectedScenarioId === s.id && <span className="text-indigo-400 animate-in zoom-in duration-300">✓</span>}
                                        </div>
                                        <div className="text-xs text-slate-400 leading-normal relative z-10 line-clamp-3">
                                            {s.description}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleStartTest}
                            disabled={loading || !selectedVersionId || !selectedScenarioId || (testMode === 'EVOLUTION' && !targetNumber)}
                            className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-lg shadow-xl shadow-indigo-900/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 overflow-hidden group relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer"></div>
                            {loading ? (
                                <><span className="animate-spin text-xl">🌀</span> Inicializando...</>
                            ) : (
                                <><span className="text-xl group-hover:rotate-12 transition-transform">⚔️</span> Lançar Teste Adversarial</>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
