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
    
    // Test Phones
    const [testPhones, setTestPhones] = useState<any[]>([]);
    const [useManualNumber, setUseManualNumber] = useState(false);

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

        fetch('/api/test-phones')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setTestPhones(data);
            })
            .catch(err => console.error("Failed to fetch test phones", err));
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
        // Validation:
        // 1. Scenario and Version are always required
        // 2. Target Number is required ONLY for EVOLUTION mode
        if (!selectedScenarioId || !selectedVersionId) return;
        if (testMode === 'EVOLUTION' && !targetNumber) return;

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
        <div className="font-sans animate-fade-in-up">
            <header className="mb-12">
                <button 
                    onClick={() => window.history.back()} 
                    className="text-slate-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2 group"
                >
                    <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span> Voltar para Dashboard
                </button>
                <h1 className="text-4xl md:text-5xl font-black mb-3 text-white tracking-tight">Iniciar Simulação</h1>
                <p className="text-slate-400 text-lg">Selecione uma versão do agente para realizar um ataque adversarial controlado.</p>
            </header>

            <main className="max-w-4xl pb-20">
                {/* Mode Selector */}
                <div className="flex gap-4 mb-10">
                    <button
                        onClick={() => setTestMode('EVOLUTION')}
                        aria-pressed={testMode === 'EVOLUTION'}
                        className={`flex-1 p-8 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 group ${testMode === 'EVOLUTION'
                            ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-[0_0_40px_rgba(99,102,241,0.15)]'
                            : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:bg-slate-800 hover:border-slate-700'}`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all ${testMode === 'EVOLUTION' ? 'bg-indigo-500 shadow-lg shadow-indigo-500/40' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
                            📱
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-lg">Modo WhatsApp</p>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40 mt-1">Real-time • Evolution API</p>
                        </div>
                    </button>
                    <button
                        onClick={() => setTestMode('LABORATORY')}
                        aria-pressed={testMode === 'LABORATORY'}
                        className={`flex-1 p-8 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 group ${testMode === 'LABORATORY'
                            ? 'bg-emerald-600/15 border-emerald-500 text-white shadow-[0_0_40px_rgba(16,185,129,0.15)]'
                            : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:bg-slate-800 hover:border-slate-700'}`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all ${testMode === 'LABORATORY' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
                            🧪
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-lg">Modo Laboratório</p>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40 mt-1">Sandbox • Interno</p>
                        </div>
                    </button>
                </div>

                <div className={`glass-panel p-10 rounded-[2.5rem] border transition-all duration-700 ${testMode === 'LABORATORY' ? 'border-emerald-500/20 bg-emerald-950/5' : 'border-slate-700/30 bg-slate-900/20 shadow-2xl'}`}>
                    <div className="space-y-12">
                        {/* Hierarchy Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Cliente</label>
                                <select
                                    value={selectedClientId}
                                    onChange={(e) => setSelectedClientId(e.target.value)}
                                    className={`w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${testMode === 'LABORATORY' ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500'}`}
                                >
                                    <option value="">Selecione o Cliente</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Agente</label>
                                <select
                                    value={selectedAgentId}
                                    onChange={(e) => setSelectedAgentId(e.target.value)}
                                    disabled={!selectedClientId}
                                    className={`w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:ring-2 transition-all appearance-none cursor-pointer disabled:opacity-20 ${testMode === 'LABORATORY' ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500'}`}
                                >
                                    <option value="">Selecione o Agente</option>
                                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Versão</label>
                                <select
                                    value={selectedVersionId}
                                    onChange={(e) => setSelectedVersionId(e.target.value)}
                                    disabled={!selectedAgentId}
                                    className={`w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:ring-2 transition-all appearance-none cursor-pointer disabled:opacity-20 ${testMode === 'LABORATORY' ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500'}`}
                                >
                                    <option value="">Selecione a Versão</option>
                                    {versions.map(v => <option key={v.id} value={v.id}>{v.versionNumber}</option>)}
                                </select>
                            </div>
                        </div>

                        {selectedAgentId && agents.find(a => a.id === selectedAgentId)?.assistantId && (
                            <div className={`p-5 rounded-2xl flex items-center gap-4 animate-scale-in border ${testMode === 'LABORATORY' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-indigo-500/5 border-indigo-500/20 text-indigo-400'}`}>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/5`}>🤖</div>
                                <div>
                                    <p className="text-sm font-bold text-white">OpenAI Assistant Conectado</p>
                                    <p className="text-xs font-mono opacity-60">ID: {agents.find(a => a.id === selectedAgentId).assistantId}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className={`transition-all duration-700 ${testMode === 'LABORATORY' ? 'opacity-50 grayscale pointer-events-none' : 'opacity-100'}`}>
                                <div className="flex justify-between items-center mb-3 pl-1">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Número de Destino</label>
                                    <button 
                                        onClick={() => setUseManualNumber(!useManualNumber)}
                                        className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
                                        disabled={testMode === 'LABORATORY'}
                                    >
                                        {useManualNumber ? '• Usar Lista' : '• Manual'}
                                    </button>
                                </div>
                                <div className="relative group">
                                    {(!useManualNumber && testPhones.length > 0) && testMode !== 'LABORATORY' ? (
                                        <select
                                            value={targetNumber}
                                            onChange={(e) => setTargetNumber(e.target.value)}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 pr-12 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Selecione um número salvo</option>
                                            {testPhones.map(p => (
                                                <option key={p.id} value={p.number}>
                                                    {p.name ? `${p.name} (${p.number})` : p.number}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={testMode === 'LABORATORY' ? 'LAB-TEST-SESSION' : targetNumber}
                                            onChange={(e) => setTargetNumber(e.target.value)}
                                            placeholder={testMode === 'LABORATORY' ? "N/A - Modo Laboratório" : "Ex: 5511999999999"}
                                            disabled={testMode === 'LABORATORY'}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 pr-12 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-700 disabled:opacity-50"
                                        />
                                    )}
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors pointer-events-none">📱</div>
                                </div>
                                {!useManualNumber && testPhones.length === 0 && testMode !== 'LABORATORY' && (
                                    <p className="text-[10px] text-amber-500 mt-3 font-medium pl-1">⚠️ Nenhum número cadastrado. <a href="/dashboard/numbers" className="underline font-bold hover:text-amber-400 transition-colors">Gerenciar Lista</a></p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-1 pl-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Profundidade do Ataque</label>
                                    <span className={`${testMode === 'LABORATORY' ? 'text-emerald-400' : 'text-indigo-400'} text-xs font-black font-mono bg-white/5 py-1 px-3 rounded-full border border-white/5 animate-scale-in`}>{maxMessages} turns</span>
                                </div>
                                <div className="relative pt-2">
                                    <input
                                        type="range"
                                        min="5"
                                        max="50"
                                        step="1"
                                        value={maxMessages}
                                        onChange={(e) => setMaxMessages(Number(e.target.value))}
                                        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-all ${testMode === 'LABORATORY' ? 'bg-emerald-900 accent-emerald-500' : 'bg-slate-800 accent-indigo-500'}`}
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-600 font-bold mt-3 px-1">
                                        <span>Curto</span>
                                        <span>Padrão</span>
                                        <span>Extenso</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Cenário Adversarial</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {scenarios.map((s: any) => (
                                    <div
                                        key={s.id}
                                        onClick={() => setSelectedScenarioId(s.id)}
                                        className={`p-6 rounded-3xl border cursor-pointer transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 active:scale-95 ${selectedScenarioId === s.id
                                            ? (testMode === 'LABORATORY' 
                                                ? 'bg-emerald-600/10 border-emerald-500 shadow-lg shadow-emerald-500/10' 
                                                : 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/10')
                                            : 'bg-slate-950/30 border-slate-800/50 hover:bg-slate-800/40 hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="font-black text-white text-base group-hover:text-indigo-400 transition-colors leading-tight">{s.title}</div>
                                            {selectedScenarioId === s.id && (
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs animate-scale-in ${testMode === 'LABORATORY' ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'}`}>✓</div>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 group-hover:text-slate-400 transition-colors">
                                            {s.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleStartTest}
                            disabled={loading || !selectedVersionId || !selectedScenarioId || (testMode === 'EVOLUTION' && !targetNumber)}
                            className={`w-full py-6 rounded-[2rem] font-black text-xl shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed group relative overflow-hidden ${testMode === 'LABORATORY' 
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:shadow-emerald-500/20' 
                                : 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white hover:shadow-indigo-500/20'}`}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            {loading ? (
                                <span className="flex items-center justify-center gap-4">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Preparando Ambiente...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-4 uppercase tracking-[0.1em]">
                                    {testMode === 'LABORATORY' ? 'Iniciar Simulação' : 'Lançar Ataque Real'}
                                    <span className="text-2xl transition-transform group-hover:translate-x-2">→</span>
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
