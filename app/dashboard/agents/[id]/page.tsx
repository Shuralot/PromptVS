'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AgentVersionsPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const agentId = unwrappedParams.id;
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [newVersionNumber, setNewVersionNumber] = useState('');
    const [config, setConfig] = useState('');
    const [editingVersion, setEditingVersion] = useState<any>(null);

    useEffect(() => {
        if (agentId) fetchVersions();
    }, [agentId]);

    const fetchVersions = async () => {
        try {
            const res = await fetch(`/api/agents/${agentId}/versions`);
            if (res.ok) {
                const data = await res.json();
                setVersions(data);
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
            const url = editingVersion
                ? `/api/versions/${editingVersion.id}`
                : `/api/agents/${agentId}/versions`;

            const method = editingVersion ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    versionNumber: newVersionNumber,
                    config: config ? JSON.parse(config) : {}
                })
            });

            if (res.ok) {
                setModalOpen(false);
                setEditingVersion(null);
                setNewVersionNumber('');
                setConfig('');
                fetchVersions();
            }
        } catch (e) {
            alert('Failed to save version (check JSON format for config)');
        }
    };

    const handleDelete = async (versionId: string) => {
        if (!confirm('Are you sure you want to delete this version?')) return;
        try {
            const res = await fetch(`/api/versions/${versionId}`, { method: 'DELETE' });
            if (res.ok) fetchVersions();
            else alert('Failed to delete (may have associated sessions)');
        } catch (e) {
            alert('Failed to delete');
        }
    };

    const openCreateModal = () => {
        setEditingVersion(null);
        setNewVersionNumber('');
        setConfig('');
        setModalOpen(true);
    };

    const openEditModal = (version: any) => {
        setEditingVersion(version);
        setNewVersionNumber(version.versionNumber);
        setConfig(JSON.stringify(version.config || {}, null, 2));
        setModalOpen(true);
    };

    return (
        <div className="font-sans">
            <header className="mb-10">
                <div className="mb-4">
                    <button onClick={() => window.history.back()} className="text-slate-500 hover:text-white flex items-center gap-1 transition-colors text-sm">
                        ← Back to Agent
                    </button>
                </div>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 text-white">
                            Agent Versions
                        </h1>
                        <p className="text-slate-400">Iterate and improve your agent's behavior.</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2"
                    >
                        <span>+</span> New Version
                    </button>
                </div>
            </header>

            <div className="space-y-4">
                {loading && <p className="text-slate-400 animate-pulse">Loading versions...</p>}

                {!loading && versions.length === 0 && (
                    <div className="p-10 text-center border border-dashed border-slate-700 rounded-2xl">
                        <p className="text-slate-500">No versions found.</p>
                    </div>
                )}

                {versions.map((version: any) => (
                    <div key={version.id} className="glass-panel p-6 rounded-2xl border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-800/60 transition-colors">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xl text-purple-400">
                                {version.versionNumber}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Version {version.versionNumber}</h3>
                                <p className="text-xs text-slate-500 font-mono">ID: {version.id}</p>
                                <div className="mt-1 flex gap-2">
                                    <span className="text-xs bg-slate-700/50 px-2 py-0.5 rounded text-slate-300">
                                        {version._count?.sessions || 0} Test Run{version._count?.sessions !== 1 ? 's' : ''}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        Created: {new Date(version.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                            <div className="flex gap-3 items-center">
                                <button
                                    onClick={() => openEditModal(version)}
                                    className="text-slate-400 hover:text-blue-400 transition-colors text-sm"
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(version.id)}
                                    className="text-slate-400 hover:text-red-400 transition-colors text-sm"
                                >
                                    🗑️ Delete
                                </button>
                                <Link
                                    href={`/dashboard/versions/${version.id}`}
                                    className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/30 px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2"
                                >
                                    <span>📜</span> View History
                                </Link>
                            </div>
                            {version.config && Object.keys(version.config).length > 0 && (
                                <details className="text-xs text-slate-500 w-full text-right cursor-pointer group">
                                    <summary className="hover:text-slate-300 transition-colors list-none select-none">View Config ▾</summary>
                                    <pre className="mt-2 bg-black/40 p-3 rounded-lg text-left overflow-x-auto max-w-md text-[10px] text-green-400 border border-slate-700 font-mono shadow-inner">
                                        {JSON.stringify(version.config, null, 2)}
                                    </pre>
                                </details>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingVersion ? 'Edit Version' : 'New Version'}
                        </h2>
                        <form onSubmit={handleSave}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-400 mb-2">Version Number / Tag</label>
                                <input
                                    autoFocus
                                    className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. v1.2 - More empathetic"
                                    value={newVersionNumber}
                                    onChange={(e) => setNewVersionNumber(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-400 mb-2">Config Override (JSON) (Optional)</label>
                                <textarea
                                    className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs h-32"
                                    placeholder='{ "model": "gpt-4o-mini", "temperature": 0.7 }'
                                    value={config}
                                    onChange={(e) => setConfig(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition-all">Cancel</button>
                                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all">
                                    {editingVersion ? 'Save Changes' : 'Create Version'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
