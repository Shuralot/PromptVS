'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function ClientAgentsPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const clientId = unwrappedParams.id;
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    // Form State
    const [editingAgent, setEditingAgent] = useState<any>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [assistantId, setAssistantId] = useState('');

    useEffect(() => {
        if (clientId) fetchAgents();
    }, [clientId]);

    const fetchAgents = async () => {
        try {
            const res = await fetch(`/api/agents?clientId=${clientId}`);
            if (res.ok) {
                const data = await res.json();
                setAgents(data);
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
            const url = editingAgent ? `/api/agents/${editingAgent.id}` : '/api/agents';
            const method = editingAgent ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description,
                    assistantId,
                    clientId // Required for POST
                })
            });

            if (res.ok) {
                setModalOpen(false);
                setEditingAgent(null);
                setName('');
                setDescription('');
                setAssistantId('');
                fetchAgents();
            }
        } catch (e) {
            alert('Failed to save agent');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will delete all versions for this agent.')) return;
        try {
            const res = await fetch(`/api/agents/${id}`, { method: 'DELETE' });
            if (res.ok) fetchAgents();
            else alert('Failed to delete agent');
        } catch (e) {
            alert('Delete error');
        }
    };

    const openCreateModal = () => {
        setEditingAgent(null);
        setName('');
        setDescription('');
        setAssistantId('');
        setModalOpen(true);
    };

    const openEditModal = (agent: any) => {
        setEditingAgent(agent);
        setName(agent.name);
        setDescription(agent.description || '');
        setAssistantId(agent.assistantId || '');
        setModalOpen(true);
    };

    return (
        <div className="font-sans">
            <header className="mb-10">
                <div className="mb-4">
                    <Link href="/dashboard/clients" className="text-slate-500 hover:text-white flex items-center gap-1 transition-colors text-sm">
                        ← Back to Clients
                    </Link>
                </div>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 text-white">Client Agents</h1>
                        <p className="text-slate-400">Manage personas assigned to this client account.</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all"
                    >
                        + Create Agent
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading && <p className="text-slate-400 animate-pulse">Loading agents...</p>}

                {!loading && agents.length === 0 && (
                    <div className="col-span-full py-20 text-center border border-dashed border-slate-700 rounded-3xl">
                        <p className="text-slate-500 mb-4">No agents deployed for this client.</p>
                        <button onClick={openCreateModal} className="text-blue-400 hover:underline">Deploy your first agent persona</button>
                    </div>
                )}

                {agents.map((agent: any) => (
                    <div key={agent.id} className="group glass-panel p-6 rounded-2xl border-slate-700/50 hover:border-blue-500/50 transition-all bg-slate-800/40 hover:bg-slate-800/60 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                        {agent.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1">{agent.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                                                {agent._count?.versions || 1} Vers.
                                            </span>
                                            {agent.assistantId && (
                                                <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded font-mono border border-green-800/50">
                                                    ID: {agent.assistantId.slice(0, 6)}...
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditModal(agent)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400" title="Edit">✏️</button>
                                    <button onClick={() => handleDelete(agent.id)} className="p-1.5 hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-400" title="Delete">🗑️</button>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                                {agent.description || 'Customized AI for specific business logic.'}
                            </p>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium border-t border-slate-700/50 pt-2 mb-4">
                                <span>{new Date(agent.createdAt).toLocaleDateString()}</span>
                                <span>{agent.createdBy?.username ? `by ${agent.createdBy.username}` : ''}</span>
                            </div>
                        </div>
                        <Link
                            href={`/dashboard/agents/${agent.id}`}
                            className="w-full text-center py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
                        >
                            Open Versions
                        </Link>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingAgent ? 'Edit Agent' : 'New Agent'}
                        </h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Name</label>
                                <input className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500" value={name} onChange={e => setName(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                                <textarea className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none h-24 resize-none" value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">OpenAI Assistant ID (Optional)</label>
                                <input className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none font-mono text-sm" placeholder="asst_..." value={assistantId} onChange={e => setAssistantId(e.target.value)} />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-slate-700 text-white py-3 rounded-xl">Cancel</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl">{editingAgent ? 'Save' : 'Deploy'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
