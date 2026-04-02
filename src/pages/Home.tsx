import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useGame, type Room } from '../store/GameContext';
import { Users, UserPlus, Play, Key, ChevronLeft, ChevronRight, Globe, Lock } from 'lucide-react';
import { AVATARS } from '../assets/avatars';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';

export default function Home() {
    const navigate = useNavigate();
    const { createGame, joinGame, error } = useGame();
    const [searchParams] = useSearchParams();
    const joinParam = searchParams.get('join');

    const [playerName, setPlayerName] = useState(() => localStorage.getItem('trustNone_playerName') || '');
    const [avatarIndex, setAvatarIndex] = useState(() => parseInt(localStorage.getItem('trustNone_avatarIndex') || '0', 10));
    const [mode, setMode] = useState<'initial' | 'create' | 'join' | 'public'>('initial');
    const [loading, setLoading] = useState(false);

    // Room Settings
    const [jacksCount, setJacksCount] = useState(1);
    const [discussionTime, setDiscussionTime] = useState(60);
    const [sdRounds, setSdRounds] = useState(5);
    const [isPublic, setIsPublic] = useState(true);
    const [roomCode, setRoomCode] = useState(joinParam || '');
    const [publicRoomsList, setPublicRoomsList] = useState<Room[]>([]);
    const [gameType, setGameType] = useState<'paranoia' | 'shadow-duel'>('paranoia');

    useEffect(() => {
        localStorage.setItem('trustNone_playerName', playerName);
    }, [playerName]);

    useEffect(() => {
        localStorage.setItem('trustNone_avatarIndex', avatarIndex.toString());
    }, [avatarIndex]);

    useEffect(() => {
        if (mode !== 'public') return;
        const roomsRef = ref(db, 'rooms');
        const unsubscribe = onValue(roomsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const roomsArray = Object.values(data) as Room[];
                const waitingPublic = roomsArray.filter(r => r.isPublic && r.status === 'waiting');
                setPublicRoomsList(waitingPublic);
            } else {
                setPublicRoomsList([]);
            }
        });
        return () => unsubscribe();
    }, [mode]);

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!playerName.trim()) return;
        try {
            setLoading(true);
            const newRoomId = await createGame(playerName, avatarIndex, jacksCount, discussionTime, isPublic, gameType, sdRounds);
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
            await joinGame(playerName, avatarIndex, roomCode);
            navigate(`/room/${roomCode.toUpperCase()}`);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDirectJoin = async () => {
        if (!playerName.trim() || !joinParam) return;
        try {
            setLoading(true);
            await joinGame(playerName, avatarIndex, joinParam);
            navigate(`/room/${joinParam.toUpperCase()}`);
        } catch (err) {
            console.error(err);
            navigate('/', { replace: true });
            setRoomCode('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400 mb-2 filter drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                        Fun@TM
                    </h1>
                    <p className="text-slate-400 text-xs sm:text-sm tracking-widest uppercase">For TIGMA PEEPS , BY AJI.</p>
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

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-1">Select Avatar</label>
                                <div className="flex items-center gap-4 bg-black/50 p-3 border border-white/10 rounded-lg justify-between shadow-inner">
                                    <button type="button" onClick={() => setAvatarIndex(i => (i - 1 + AVATARS.length) % AVATARS.length)} className="p-2 hover:bg-white/10 rounded border border-transparent hover:border-white/10 text-slate-400 hover:text-white transition-all">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-900 border border-white/20 shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center justify-center p-1">
                                        <img src={`data:image/svg+xml;utf8,${encodeURIComponent(AVATARS[avatarIndex])}`} className="w-full h-full object-contain" alt="Avatar" />
                                    </div>
                                    <button type="button" onClick={() => setAvatarIndex(i => (i + 1) % AVATARS.length)} className="p-2 hover:bg-white/10 rounded border border-transparent hover:border-white/10 text-slate-400 hover:text-white transition-all">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
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
                                    onClick={() => joinParam ? handleDirectJoin() : setMode('join')}
                                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-blue-100"
                                >
                                    <UserPlus className="w-8 h-8 group-hover:scale-110 transition-transform text-blue-400" />
                                    <span className="font-semibold tracking-wide text-sm">{joinParam ? `Join ${joinParam}` : 'Join Private'}</span>
                                </button>
                            </div>
                            {!joinParam && (
                                <button
                                    disabled={!playerName.trim()}
                                    onClick={() => setMode('public')}
                                    className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white uppercase tracking-widest text-sm font-bold mt-4"
                                >
                                    <Globe className="w-5 h-5" />
                                    Browse Public Rooms
                                </button>
                            )}
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
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-1">Game Type</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button type="button" onClick={() => setGameType('paranoia')} className={`p-3 rounded-lg border text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${gameType === 'paranoia' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-black/50 border-white/10 text-slate-400 hover:border-white/30'}`}>
                                            Paranoia
                                        </button>
                                        <button type="button" onClick={() => setGameType('shadow-duel')} className={`p-3 rounded-lg border text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${gameType === 'shadow-duel' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-black/50 border-white/10 text-slate-400 hover:border-white/30'}`}>
                                            Shadow Duel
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-1">Visibility</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button type="button" onClick={() => setIsPublic(true)} className={`p-3 rounded-lg border text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${isPublic ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-black/50 border-white/10 text-slate-400 hover:border-white/30'}`}>
                                            <Globe className="w-4 h-4" /> Public
                                        </button>
                                        <button type="button" onClick={() => setIsPublic(false)} className={`p-3 rounded-lg border text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${!isPublic ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-black/50 border-white/10 text-slate-400 hover:border-white/30'}`}>
                                            <Lock className="w-4 h-4" /> Private
                                        </button>
                                    </div>
                                </div>
                                {gameType === 'paranoia' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-1">Number of Jacks</label>
                                        <input
                                            type="number" min="1" max="10"
                                            value={jacksCount} onChange={e => setJacksCount(Number(e.target.value))}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                        />
                                    </div>
                                )}
                                {gameType === 'shadow-duel' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-1">Number of Turns (Max 10)</label>
                                        <input
                                            type="number" min="1" max="10"
                                            value={sdRounds} onChange={e => setSdRounds(Number(e.target.value))}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                        />
                                    </div>
                                )}
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

                    {mode === 'public' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 relative">
                            <div className="flex items-center gap-4 mb-6">
                                <button type="button" onClick={() => setMode('initial')} className="text-slate-400 hover:text-white text-sm">
                                    ← Back
                                </button>
                                <h2 className="text-xl font-bold flex items-center gap-2"><Globe className="w-6 h-6" /> Public Rooms</h2>
                            </div>

                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                {publicRoomsList.length === 0 ? (
                                    <div className="text-center p-8 border border-dashed border-white/10 rounded-xl text-slate-500">
                                        No public rooms available right now.
                                    </div>
                                ) : (
                                    publicRoomsList.map(r => (
                                        <div key={r.id} className="bg-black/40 border border-white/10 p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors">
                                            <div>
                                                <div className="font-mono text-lg font-bold text-slate-200 tracking-wider mb-1">ROOM {r.id}</div>
                                                <div className="text-xs text-slate-400 flex items-center gap-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.gameType === 'shadow-duel' ? 'bg-purple-500/20 text-purple-300' : 'bg-red-500/20 text-red-300'}`}>
                                                        {r.gameType === 'shadow-duel' ? 'Shadow Duel' : 'Paranoia'}
                                                    </span>
                                                    <Users className="w-3 h-3" /> {Object.keys(r.players || {}).length} Players
                                                    {(r.gameType === 'paranoia' || !r.gameType) && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{r.jacksCount} Jack{r.jacksCount !== 1 ? 's' : ''}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                disabled={loading}
                                                onClick={async () => {
                                                    setLoading(true);
                                                    try {
                                                        await joinGame(playerName, avatarIndex, r.id);
                                                        navigate(`/room/${r.id}`);
                                                    } catch (e) {
                                                        console.error(e);
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                                className="bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg font-bold text-sm tracking-wider uppercase transition-colors"
                                            >
                                                Join
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
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
