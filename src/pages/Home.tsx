import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGame } from '../store/GameContext';
import { Users, UserPlus, Play, Key } from 'lucide-react';

export default function Home() {
    const navigate = useNavigate();
    const { createGame, joinGame, error } = useGame();

    const [playerName, setPlayerName] = useState('');
    const [mode, setMode] = useState<'initial' | 'create' | 'join'>('initial');
    const [loading, setLoading] = useState(false);

    // Room Settings
    const [jacksCount, setJacksCount] = useState(1);
    const [discussionTime, setDiscussionTime] = useState(60);
    const [roomCode, setRoomCode] = useState('');

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!playerName.trim()) return;
        try {
            setLoading(true);
            const newRoomId = await createGame(playerName, jacksCount, discussionTime);
            navigate(`/room/${newRoomId}`);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!playerName.trim() || !roomCode.trim()) return;
        try {
            setLoading(true);
            await joinGame(playerName, roomCode);
            navigate(`/room/${roomCode.toUpperCase()}`);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400 mb-2 filter drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                        PARANOIA
                    </h1>
                    <p className="text-slate-400 text-xs sm:text-sm tracking-widest uppercase">Trust no one.</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
                    {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded text-sm text-center">{error}</div>}
                    {mode === 'initial' && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-1">Identify Yourself</label>
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={e => setPlayerName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                                    maxLength={15}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <button
                                    disabled={!playerName.trim()}
                                    onClick={() => setMode('create')}
                                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-500/30 hover:border-red-500 hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-red-100"
                                >
                                    <Users className="w-8 h-8 group-hover:scale-110 transition-transform text-red-400" />
                                    <span className="font-semibold tracking-wide text-sm">Create Room</span>
                                </button>
                                <button
                                    disabled={!playerName.trim()}
                                    onClick={() => setMode('join')}
                                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-blue-100"
                                >
                                    <UserPlus className="w-8 h-8 group-hover:scale-110 transition-transform text-blue-400" />
                                    <span className="font-semibold tracking-wide text-sm">Join Room</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === 'create' && (
                        <form onSubmit={handleCreateRoom} className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 relative">
                            <div className="flex items-center gap-4 mb-6">
                                <button type="button" onClick={() => setMode('initial')} className="text-slate-400 hover:text-white text-sm">
                                    ← Back
                                </button>
                                <h2 className="text-xl font-bold">Room Settings</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-1">Number of Jacks</label>
                                    <input
                                        type="number" min="1" max="10"
                                        value={jacksCount} onChange={e => setJacksCount(Number(e.target.value))}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-1">Discussion Time (sec)</label>
                                    <input
                                        type="number" min="30" step="30"
                                        value={discussionTime} onChange={e => setDiscussionTime(Number(e.target.value))}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                                <Play className="w-5 h-5 fill-current" />
                                {loading ? 'Initializing...' : 'Initialize Room'}
                            </button>
                        </form>
                    )}

                    {mode === 'join' && (
                        <form onSubmit={handleJoinRoom} className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 relative">
                            <div className="flex items-center gap-4 mb-6">
                                <button type="button" onClick={() => setMode('initial')} className="text-slate-400 hover:text-white text-sm">
                                    ← Back
                                </button>
                                <h2 className="text-xl font-bold">Join Game</h2>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-1">Room Code</label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text"
                                        value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())}
                                        placeholder="ENTER 6-CHAR CODE"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase"
                                        maxLength={6}
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={roomCode.length < 3 || loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                                {loading ? 'Entering...' : 'Enter Room'}
                            </button>
                        </form>
                    )}

                </div>
            </div>

            <div className="mt-8 text-center animate-in fade-in duration-1000 delay-500">
                <Link to="/rules" className="text-slate-400 hover:text-white uppercase tracking-[0.2em] font-bold text-xs sm:text-sm border-b border-white/20 hover:border-white/50 pb-1 transition-all">
                    How to Play
                </Link>
            </div>
        </div>
    );
}
