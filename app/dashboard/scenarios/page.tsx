'use client';

import { useState, useEffect } from 'react';

export default function ScenariosPage() {
    const [scenarios, setScenarios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingScenario, setEditingScenario] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        personaSystemPrompt: '',
        difficulty: 'Medium'
    });

    useEffect(() => {
        fetchScenarios();
    }, []);

    const fetchScenarios = async () => {
        try {
            const res = await fetch('/api/scenarios');
            const data = await res.json();
            setScenarios(data);
        } catch (err) {
            console.error("Failed to fetch scenarios", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingScenario(null);
        setFormData({
            title: '',
            description: '',
            personaSystemPrompt: '',
            difficulty: 'Medium'
        });
        setShowModal(true);
    };

    const handleOpenEdit = (scenario: any) => {
        setEditingScenario(scenario);
        setFormData({
            title: scenario.title,
            description: scenario.description,
            personaSystemPrompt: scenario.personaSystemPrompt,
            difficulty: scenario.difficulty
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingScenario ? `/api/scenarios/${editingScenario.id}` : '/api/scenarios';
        const method = editingScenario ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowModal(false);
                fetchScenarios();
            }
        } catch (err) {
            console.error("Error saving scenario", err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja excluir esta persona?')) return;
        try {
            const res = await fetch(`/api/scenarios/${id}`, { method: 'DELETE' });
            if (res.ok) fetchScenarios();
            else alert('Erro ao excluir. Verifique se há sessões vinculadas.');
        } catch (err) {
            console.error("Error deleting scenario", err);
        }
    };

    return (
        <div className="font-sans">
            <header className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black mb-2 text-white tracking-tight">Personas de Teste</h1>
                    <p className="text-slate-400 text-lg">Gerencie os perfis e comportamentos da IA atacante.</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
                >
                    + Nova Persona
                </button>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin text-4xl">🌀</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scenarios.map((s) => (
                        <div key={s.id} className="glass-panel p-6 rounded-3xl border-slate-700/50 bg-slate-800/20 relative group">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${s.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' :
                                        s.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-emerald-500/20 text-emerald-400'
                                    }`}>
                                    {s.difficulty}
                                </span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenEdit(s)} className="text-slate-400 hover:text-white transition-colors">✏️</button>
                                    <button onClick={() => handleDelete(s.id)} className="text-slate-400 hover:text-red-400 transition-colors">🗑️</button>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                            <p className="text-sm text-slate-400 mb-4 line-clamp-2">{s.description}</p>

                            <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50 mb-3">
                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-tighter">System Prompt</p>
                                <p className="text-xs text-indigo-300 font-mono line-clamp-3">{s.personaSystemPrompt}</p>
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider pt-3 border-t border-slate-700/30">
                                <span>{s.createdBy?.username || 'Sistema'}</span>
                                {/* Assuming createdAt exists on scenarios too */}
                                {/* <span>{new Date().toLocaleDateString()}</span> */} 
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <header className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">{editingScenario ? 'Editar Persona' : 'Nova Persona'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </header>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Título</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition-all"
                                        placeholder="Ex: Cliente Impaciente"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Dificuldade</label>
                                    <select
                                        value={formData.difficulty}
                                        onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition-all"
                                    >
                                        <option value="Easy">Fácil</option>
                                        <option value="Medium">Média</option>
                                        <option value="Hard">Difícil</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Descrição curta</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition-all"
                                    placeholder="Explique o objetivo deste teste..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest flex justify-between">
                                    <span>Persona System Prompt</span>
                                    <span className="text-indigo-400 lowercase italic font-normal text-[10px]">as instruções secretas da IA</span>
                                </label>
                                <textarea
                                    required
                                    rows={6}
                                    value={formData.personaSystemPrompt}
                                    onChange={e => setFormData({ ...formData, personaSystemPrompt: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white font-mono text-sm outline-none focus:border-indigo-500 transition-all"
                                    placeholder="Você é um cliente insatisfeito... Não aceite nada menos que o estorno total..."
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20"
                                >
                                    Salvar Persona
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
