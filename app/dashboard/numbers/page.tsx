'use client';

import { useState, useEffect } from 'react';

interface TestPhone {
    id: string;
    number: string;
    name: string | null;
}

export default function NumbersPage() {
    const [phones, setPhones] = useState<TestPhone[]>([]);
    const [loading, setLoading] = useState(true);
    const [newNumber, setNewNumber] = useState('');
    const [newName, setNewName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPhones();
    }, []);

    const fetchPhones = async () => {
        try {
            const res = await fetch('/api/test-phones');
            const data = await res.json();
            if (Array.isArray(data)) setPhones(data);
        } catch (error) {
            console.error('Failed to fetch phones');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNumber) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/test-phones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: newNumber, name: newName })
            });
            if (res.ok) {
                setNewNumber('');
                setNewName('');
                fetchPhones();
            } else {
                const data = await res.json();
                alert(data.error || 'Erro ao adicionar número');
            }
        } catch (error) {
            alert('Erro ao conectar com o servidor');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este número?')) return;
        try {
            const res = await fetch(`/api/test-phones/${id}`, { method: 'DELETE' });
            if (res.ok) fetchPhones();
        } catch (error) {
            alert('Erro ao excluir número');
        }
    };

    return (
        <div className="font-sans min-h-screen">
            <header className="mb-12">
                <button onClick={() => window.history.back()} className="text-slate-500 hover:text-white transition-colors text-sm mb-4 flex items-center gap-2">
                    <span className="text-lg">←</span> Voltar
                </button>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black mb-2 text-white tracking-tight">Números de Teste</h1>
                        <p className="text-slate-400 text-lg">Gerencie os números de WhatsApp para testes adversariais.</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl space-y-8">
                {/* Add New Form */}
                <section className="glass-panel p-8 rounded-3xl border border-slate-700/50 bg-slate-800/20 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="text-2xl">➕</span> Adicionar Novo Número
                    </h2>
                    <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Apelido (Opcional)</label>
                            <input
                                type="text"
                                placeholder="Ex: Celular de Teste 1"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Número WhatsApp</label>
                            <input
                                type="text"
                                placeholder="5511999999999"
                                value={newNumber}
                                onChange={(e) => setNewNumber(e.target.value)}
                                required
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                            >
                                {submitting ? 'Adicionando...' : 'Adicionar'}
                            </button>
                        </div>
                    </form>
                </section>

                {/* List */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">📋</span> Números Cadastrados
                    </h2>
                    {loading ? (
                        <div className="text-slate-500 animate-pulse">Carregando números...</div>
                    ) : phones.length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-600">
                            Nenhum número cadastrado ainda.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {phones.map((phone) => (
                                <div
                                    key={phone.id}
                                    className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/40 flex justify-between items-center group hover:border-slate-600 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center text-xl text-indigo-400">📱</div>
                                        <div>
                                            <p className="font-bold text-white text-lg">{phone.name || 'Sem Apelido'}</p>
                                            <p className="text-indigo-400 font-mono text-sm">{phone.number}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(phone.id)}
                                        className="p-3 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
