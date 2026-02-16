'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ClientsPage() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any>(null);
    const [clientName, setClientName] = useState('');

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const res = await fetch('/api/clients');
            if (res.ok) {
                const data = await res.json();
                setClients(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
            const method = editingClient ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: clientName })
            });

            if (res.ok) {
                setModalOpen(false);
                setEditingClient(null);
                setClientName('');
                fetchClients();
            }
        } catch (e) {
            alert('Failed to save client');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will fail if the client has active agents.')) return;
        try {
            const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
            if (res.ok) fetchClients();
            else {
                const data = await res.json();
                alert(data.error || 'Failed to delete');
            }
        } catch (e) {
            alert('Delete failed');
        }
    };

    const openCreateModal = () => {
        setEditingClient(null);
        setClientName('');
        setModalOpen(true);
    };

    const openEditModal = (client: any) => {
        setEditingClient(client);
        setClientName(client.name);
        setModalOpen(true);
    };

    return (
        <div className="font-sans px-4 md:px-0">
            <header className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">Agentes e Clientes</h1>
                    <p className="text-slate-400">Gerencie as contas e seus respectivos agentes de IA.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-2xl shadow-xl shadow-indigo-900/20 transition-all hover:scale-105 active:scale-95"
                >
                    + Novo Cliente
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading && <p className="text-slate-400 animate-pulse">Carregando clientes...</p>}

                {!loading && clients.length === 0 && (
                    <div className="col-span-full py-20 text-center border border-dashed border-slate-700 rounded-3xl bg-slate-800/10">
                        <p className="text-slate-500">Nenhum cliente cadastrado ainda.</p>
                    </div>
                )}

                {clients.map((client: any) => (
                    <div key={client.id} className="group relative glass-panel p-6 rounded-3xl border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 bg-slate-800/40 hover:bg-slate-800/60 hover:shadow-2xl hover:shadow-indigo-900/10 shadow-lg">
                        <Link href={`/dashboard/clients/${client.id}`} className="block">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    🏢
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                                        {client.name}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">ID: {client.id.slice(0, 8)}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> {client._count?.agents || 0} Agentes</span>
                                <div className="text-right">
                                    <p>Criado em {new Date(client.createdAt).toLocaleDateString()}</p>
                                    {client.createdBy && <p className="text-indigo-400 mt-0.5">por {client.createdBy.username}</p>}
                                </div>
                            </div>
                        </Link>

                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(client)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white" title="Editar">
                                ✏️
                            </button>
                            <button onClick={() => handleDelete(client.id)} className="p-2 hover:bg-red-900/40 rounded-lg text-slate-400 hover:text-red-400" title="Excluir">
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                        </h2>
                        <form onSubmit={handleSave}>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-400 mb-2">Nome do Cliente</label>
                                <input
                                    autoFocus
                                    className="w-full bg-slate-900 border border-slate-600 rounded-2xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                                    placeholder="Ex: Acme Corp"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-2xl transition-all">Cancelar</button>
                                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-indigo-900/30">
                                    {editingClient ? 'Atualizar' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

    );
}
