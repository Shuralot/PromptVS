'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('USER');
    const [message, setMessage] = useState('');

    const fetchUsers = async () => {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
            const data = await res.json();
            setUsers(data);
        }
        setLoading(false);
    };

    const fetchAuditLogs = async () => {
        const res = await fetch('/api/admin/audit');
        if (res.ok) {
            const data = await res.json();
            setAuditLogs(data);
        }
    };

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'audit') fetchAuditLogs();
    }, [activeTab]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role }),
        });

        if (res.ok) {
            setMessage('Usuário criado com sucesso!');
            setUsername('');
            setPassword('');
            fetchUsers();
        } else {
            const data = await res.json();
            setMessage('Erro: ' + data.error);
        }
    };

    const handleUpdateRole = async (id: string, newRole: string) => {
        try {
            await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });
            fetchUsers();
        } catch (e) {
            console.error("Update failed", e);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Tem certeza? Isso irá desativar este acesso permanentemente.')) return;
        try {
            await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            fetchUsers();
        } catch (e) {
            console.error("Delete failed", e);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">Admin e Usuários</h1>
                    <p className="text-slate-400 text-lg">Gerencie acessos e monitore a segurança.</p>
                </div>
                
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        Usuários
                    </button>
                    <button 
                         onClick={() => setActiveTab('audit')}
                         className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        Auditoria
                    </button>
                </div>
            </header>

            {activeTab === 'users' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4">
                    {/* Create User Section */}
                    <div className="glass-panel p-8 rounded-3xl border border-slate-800 bg-slate-900/40">
                         <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <span className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">👤</span>
                            Novo Usuário
                        </h2>
                        
                        <form onSubmit={handleCreateUser} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Username</label>
                                <input 
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Senha Inicial</label>
                                <input 
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Permissão</label>
                                <select 
                                    value={role} 
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="USER">Usuário Comum</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>
                            <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95">
                                Criar Usuário
                            </button>
                        </form>
                        {message && <p className="mt-4 text-sm text-indigo-400 font-medium">{message}</p>}
                    </div>

                    {/* Users List */}
                    <div className="glass-panel p-8 rounded-3xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <span className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">📋</span>
                            Usuários Ativos
                        </h2>
                        
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {users.map(u => (
                                <div key={u.id} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group">
                                    <div>
                                        <p className="text-white font-bold">{u.username}</p>
                                        <div className="flex gap-2 items-center mt-1">
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                                                className="bg-transparent text-[10px] text-slate-500 uppercase tracking-widest font-black outline-none hover:text-indigo-400 cursor-pointer"
                                            >
                                                <option value="USER">USER</option>
                                                <option value="ADMIN">ADMIN</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-[10px] text-slate-600 font-medium hidden sm:block">
                                            ID: {u.id.slice(0,8)}...
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteUser(u.id)}
                                            className="p-2 hover:bg-red-500/10 rounded-lg text-slate-600 hover:text-red-400 transition-colors"
                                            title="Remover usuário"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'audit' && (
                <div className="glass-panel p-8 rounded-3xl border border-slate-800 bg-slate-900/40 animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="p-2 bg-amber-500/10 rounded-xl text-amber-400">🕵️‍♂️</span>
                        Logs de Auditoria do Sistema
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400 text-[10px] uppercase tracking-widest">
                                    <th className="py-4 font-black">Data/Hora</th>
                                    <th className="py-4 font-black">Usuário</th>
                                    <th className="py-4 font-black">Ação</th>
                                    <th className="py-4 font-black">Entidade</th>
                                    <th className="py-4 font-black">Detalhes</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {auditLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-500">Nenhum registro de auditoria encontrado.</td>
                                    </tr>
                                )}
                                {auditLogs.map((log) => (
                                    <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="py-4 text-slate-400 font-mono text-xs">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="py-4 text-white font-bold">
                                            {log.user?.username || 'Desconhecido'}
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                                log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400' :
                                                log.action === 'UPDATE' ? 'bg-blue-500/10 text-blue-400' :
                                                log.action === 'DELETE' ? 'bg-red-500/10 text-red-400' :
                                                'bg-slate-500/10 text-slate-400'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="py-4 text-indigo-300 font-medium">
                                            {log.entity} <span className="text-slate-600 text-[10px] ml-1">{log.entityId?.slice(0,6)}...</span>
                                        </td>
                                        <td className="py-4 text-slate-300 max-w-xs truncate" title={log.details}>
                                            {log.details}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
