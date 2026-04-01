import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, Skull, Heart, Spade, Diamond, Club } from 'lucide-react';
import { useGame } from '../store/GameContext';

const Suits = {
    hearts: <Heart className="fill-red-500 text-red-500" />,
    spades: <Spade className="fill-slate-800 text-slate-800" />,
    diamonds: <Diamond className="fill-red-500 text-red-500" />,
    clubs: <Club className="fill-slate-800 text-slate-800" />
};

export default function Room() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { me, room, subscribeToRoom, startGame, leaveGame, cancelGame, sendRequest, replyRequest, submitVote, advanceToVoting, resolveRound, error } = useGame();
    const [timeLeft, setTimeLeft] = useState(0);
    const [localVote, setLocalVote] = useState<'hearts' | 'spades' | 'diamonds' | 'clubs' | null>(null);

    // Reset local vote when round changes to voting
    useEffect(() => {
        if (room?.status !== 'voting') {
            setLocalVote(null);
        }
    }, [room?.status]);

    useEffect(() => {
        if (roomId) subscribeToRoom(roomId);
    }, [roomId, subscribeToRoom]);

    useEffect(() => {
        if (!me && sessionStorage.getItem('paranoia_id') === null) {
            navigate('/');
        }
    }, [me, navigate]);

    // Handle case where we were removed from the room (kicked/left/died)
    useEffect(() => {
        if (room && !me) {
            sessionStorage.removeItem('paranoia_id');
            navigate('/');
        }
    }, [room, me, navigate]);

    // Auto-resolve voting if everyone has voted
    useEffect(() => {
        if (!room || !me?.isHost || room.status !== 'voting') return;
        const alivePlayers = Object.values(room.players).filter(p => !p.isDead);
        if (alivePlayers.length > 0 && alivePlayers.every(p => p.selectedSymbol != null)) {
            resolveRound();
        }
    }, [room, me?.isHost, resolveRound]);

    // Game Loop Timer (Drives host transitions & updates local UI timer)
    useEffect(() => {
        if (!room) return;
        const interval = setInterval(() => {
            let targetTime = 0;
            if (room.status === 'discussion' && room.discussionEndTime) {
                targetTime = room.discussionEndTime;
            } else if (room.status === 'voting' && room.votingEndTime) {
                targetTime = room.votingEndTime;
            }

            if (targetTime > 0) {
                const remaining = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
                setTimeLeft(remaining);

                if (remaining <= 0 && me?.isHost) {
                    if (room.status === 'discussion') {
                        advanceToVoting();
                    } else if (room.status === 'voting') {
                        resolveRound();
                    }
                }
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [room, me, advanceToVoting, resolveRound]);

    if (!me || !room) return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-slate-950 text-white">Loading Lobby...</div>
    );

    const playersArr = Object.values(room.players);
    const alivePlayers = playersArr.filter(p => !p.isDead && p.id !== me.id);
    const myRequests = Object.values(room.requests || {}).filter(r => r.fromId === me.id);
    const incomingRequests = Object.values(room.requests || {}).filter(r => r.toId === me.id);

    // VIEWS
    if (room.status === 'finished') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 bg-slate-950">
                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl text-center border border-white/10 shadow-2xl max-w-md w-full animate-in zoom-in-95">
                    <h1 className="text-4xl font-black text-red-500 mb-6 uppercase tracking-widest">Game Over</h1>
                    <p className="text-xl text-slate-200 mb-8 font-bold uppercase tracking-[0.2em]">
                        {room.winner === 'players' ? 'THE PLAYERS SURVIVED' : 'THE JACK OF HEARTS WINS'}
                    </p>
                    {me.isHost ? (
                        <button onClick={cancelGame} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-lg">DISMANTLE FACILITY</button>
                    ) : (
                        <button onClick={leaveGame} className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-4 rounded-lg">LEAVE FACILITY</button>
                    )}
                </div>
            </div>
        );
    }

    if (room.status === 'voting') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 bg-slate-950 relative">
                {!me.isDead && <div className="absolute top-8 sm:top-12 text-4xl sm:text-6xl font-black font-mono text-red-500 tracking-widest animate-pulse">{timeLeft}s</div>}
                {me.isDead ? (
                    <DeathScreen />
                ) : (
                    <div className="max-w-md w-full text-center space-y-4 sm:space-y-6 mt-12 sm:mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-[0.2em] mb-2">Cast Your Vote</h2>
                        <p className="text-slate-400 uppercase tracking-widest text-xs sm:text-sm mb-6 sm:mb-8">Identify the symbol on your collar.</p>
                        {me.selectedSymbol ? (
                            <div className="p-6 sm:p-8 bg-black/60 border border-green-500/30 text-green-400 rounded-2xl flex flex-col items-center justify-center space-y-4 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                                <span className="text-xs sm:text-sm uppercase tracking-widest font-black">Vote Locked</span>
                                <div className="transform scale-[1.25] sm:scale-150">
                                    {Suits[me.selectedSymbol]}
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-4 opacity-70">Awaiting execution...</span>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    {(['hearts', 'spades', 'diamonds', 'clubs'] as const).map(sym => {
                                        const isSelected = localVote === sym;
                                        return (
                                            <button key={sym} onClick={() => setLocalVote(sym)} className={`p-8 sm:p-12 border border-white/10 rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500/20 border-blue-500 scale-105 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : 'bg-white/5 hover:bg-white/10 opacity-60 hover:opacity-100 hover:scale-105'}`}>
                                                <div className="transform scale-[1.5] sm:scale-[2]">{Suits[sym]}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    disabled={!localVote}
                                    onClick={() => localVote && submitVote(localVote)}
                                    className="w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]"
                                >
                                    LOCK VOTE
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    if (room.status === 'discussion') {
        return (
            <div className="flex flex-col min-h-[100dvh] p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white max-w-4xl mx-auto w-full">
                <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6 mt-4">
                    <div>
                        <h1 className="text-2xl font-black text-red-500 tracking-[0.2em] uppercase">PARANOIA</h1>
                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Trust No One</p>
                        {me.role === 'jack' && <div className="mt-3 text-xs font-black text-red-500 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded uppercase tracking-[0.2em] inline-block shadow-[0_0_10px_rgba(220,38,38,0.2)]">YOUR ROLE: JACK OF HEARTS</div>}
                        {me.role === 'player' && <div className="mt-3 text-xs font-black text-blue-400 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded uppercase tracking-[0.2em] inline-block">YOUR ROLE: PLAYER</div>}
                    </div>
                    <div className="text-5xl font-mono font-black text-red-500 tabular-nums">{timeLeft}</div>
                </div>

                {me.isDead ? (
                    <DeathScreen />
                ) : (
                    <div className="grid gap-8 md:grid-cols-2">
                        {/* Players List */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/10 pb-3">Other Survivors</h3>
                            {alivePlayers.length === 0 && <p className="text-slate-500 text-sm italic">You are the last one walking.</p>}
                            {alivePlayers.map(p => {
                                const askedAlready = myRequests.some(r => r.toId === p.id);
                                return (
                                    <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl shadow-lg backdrop-blur-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center shadow-inner">
                                                {p.symbol && Suits[p.symbol]}
                                            </div>
                                            <span className="font-bold text-lg tracking-wide">{p.name} {p.role === 'jack' && me.role === 'jack' && <span className="text-xs text-red-500 ml-2">(Jack)</span>}</span>
                                        </div>
                                        <button
                                            disabled={askedAlready}
                                            onClick={() => sendRequest(p.id)}
                                            className="px-4 py-2 text-xs font-black bg-white/5 text-slate-300 border border-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all active:scale-95"
                                        >
                                            {askedAlready ? 'Queried' : 'Query'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Comm Center */}
                        <div className="space-y-8">
                            {/* Incoming */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/10 pb-3">Incoming Queries</h3>
                                {incomingRequests.length === 0 && <p className="text-sm text-slate-600 italic">Radio silence.</p>}
                                {incomingRequests.map(r => {
                                    const fromName = room.players[r.fromId]?.name;
                                    if (r.replySymbol) {
                                        return <div key={r.id} className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 p-3 rounded-xl uppercase tracking-widest font-bold">You transmitted {r.replySymbol} to {fromName}</div>
                                    }
                                    return (
                                        <div key={r.id} className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-4 shadow-lg backdrop-blur-sm">
                                            <p className="text-sm pt-1 tracking-wide"><span className="font-black text-red-400 uppercase">{fromName}</span> requests you to establish their symbol.</p>
                                            <div className="flex gap-2">
                                                {(['hearts', 'spades', 'diamonds', 'clubs'] as const).map(sym => (
                                                    <button key={sym} onClick={() => replyRequest(r.id, sym)} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex-1 flex justify-center transition-transform hover:scale-105 active:scale-95 shadow-md">
                                                        {Suits[sym]}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Outgoing */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/10 pb-3">Intelligence Gathered</h3>
                                {myRequests.length === 0 && <p className="text-sm text-slate-600 italic">No queries deployed.</p>}
                                {myRequests.map(r => {
                                    const toName = room.players[r.toId]?.name;
                                    return (
                                        <div key={r.id} className="p-4 bg-white/5 border border-white/10 rounded-xl text-sm flex items-center justify-between shadow-lg backdrop-blur-sm">
                                            <span className="text-slate-400 font-medium">To: <span className="text-slate-200 font-bold">{toName}</span></span>
                                            {r.replySymbol ? (
                                                <div className="flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs ml-4 px-3 py-1 bg-black/40 rounded-lg border border-white/5">
                                                    {r.replySymbol} {Suits[r.replySymbol]}
                                                </div>
                                            ) : (
                                                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Awaiting Signal</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // LOBBY VIEW (waiting)
    return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4 sm:p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
            <h1 className="text-3xl sm:text-4xl font-black text-red-500 mb-6 tracking-[0.2em]">LOBBY</h1>
            <div className="bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-3xl text-center border border-white/10 shadow-2xl max-w-md w-full">
                <p className="text-slate-400 mb-3 uppercase text-[10px] sm:text-xs font-bold tracking-[0.2em]">Transmit Code to Subjects</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 sm:mb-10">
                    <div className="text-4xl sm:text-5xl font-mono tracking-[0.2em] sm:tracking-[0.3em] font-black text-white bg-black/60 py-3 sm:py-4 pl-6 sm:pl-8 pr-4 rounded-xl inline-block border border-white/5 shadow-inner select-all">
                        {roomId}
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Invite link copied!'); }} className="p-4 sm:p-5 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-slate-400 hover:text-white hover:scale-105 active:scale-95 w-full sm:w-auto" title="Copy Invite Link">
                        <Copy className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="sm:hidden text-xs uppercase font-bold tracking-widest">Copy Link</span>
                    </button>
                </div>

                <div className="text-left space-y-4">
                    <div className="flex justify-between items-end border-b border-white/10 pb-3">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Subjects Enrolled</h2>
                        <span className="text-sm text-red-400 font-black tracking-widest">{Object.keys(room.players).length} ONLINE</span>
                    </div>
                    <div className="text-lg max-h-60 overflow-y-auto pr-2 space-y-3">
                        {Object.values(room.players).map(p => (
                            <div key={p.id} className="flex justify-between items-center py-3 px-4 rounded-xl bg-black/40 border border-white/5 shadow-inner">
                                <span className="font-bold text-slate-200 tracking-wide">{p.name} {p.id === me.id && <span className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-3">You</span>}</span>
                                {p.isHost && <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-2 py-1 rounded uppercase tracking-widest border border-red-500/20">Host</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {me.isHost ? (
                    <div className="mt-10 space-y-3">
                        <button onClick={startGame} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 px-4 rounded-xl transition-all uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]">Commence Event</button>
                        <button onClick={cancelGame} className="w-full bg-transparent border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white font-bold py-4 px-4 rounded-xl transition-colors uppercase tracking-[0.2em] text-sm">Dismantle Room</button>
                    </div>
                ) : (
                    <button onClick={leaveGame} className="mt-10 w-full bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-bold py-4 px-4 rounded-xl transition-colors uppercase tracking-[0.2em] text-sm">Leave Room</button>
                )}
                {error && <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 text-red-400 font-bold tracking-wide rounded-xl text-sm">{error}</div>}
            </div>
        </div>
    );
}

function DeathScreen() {
    const { leaveGame } = useGame();
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-1000 mt-10 sm:mt-20">
            <Skull className="w-24 h-24 sm:w-32 sm:h-32 text-red-600 mb-6 sm:mb-8 drop-shadow-[0_0_25px_rgba(220,38,38,0.8)] animate-pulse" />
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-4">You Are Dead</h2>
            <p className="text-slate-400 mb-8 sm:mb-10 max-w-sm text-sm sm:text-lg leading-relaxed font-medium">Your collar has detonated. You failed to identify your suit.</p>
            <button onClick={() => { leaveGame(); sessionStorage.removeItem('paranoia_id'); navigate('/'); }} className="border border-white/20 hover:bg-red-900/40 hover:text-red-400 hover:border-red-500/50 px-6 sm:px-8 py-3 rounded-xl uppercase text-[10px] sm:text-xs font-black tracking-[0.2em] text-slate-400 transition-all active:scale-95">Return to Home</button>
        </div>
    );
}
