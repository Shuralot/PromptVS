'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (res.ok) {
                window.location.href = '/dashboard';
            } else {
                const data = await res.json();
                setError(data.error || 'Credenciais inválidas');
            }
        } catch (err) {
            setError('Erro ao conectar ao servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#070b14] flex items-center justify-center p-4">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-blue-600 shadow-2xl shadow-indigo-500/20 mb-6 group hover:scale-105 transition-transform duration-500">
                         <img src="/logo.png" alt="TrackTest Logo" className="w-12 h-12 object-contain" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">TrackTest</h1>
                    <p className="text-slate-500 font-medium uppercase tracking-[0.3em] text-[10px]">AI Atende Suite</p>
                </div>

                <div className="glass-panel p-10 rounded-[2.5rem] border border-slate-800/50 shadow-2xl bg-slate-900/40 backdrop-blur-xl">
                    <h2 className="text-2xl font-bold text-white mb-8">Entrar de volta</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Usuário</label>
                            <input 
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-700"
                                placeholder="digite seu usuário..."
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Senha</label>
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-700"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-shake">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <>Acessar Plataforma <span className="text-lg">→</span></>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-slate-600 text-xs font-medium">
                    &copy; 2026 AI Atende. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
