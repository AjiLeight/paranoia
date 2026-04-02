import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Users, Skull, Target, Ghost, Crosshair, HeartPulse, Search } from 'lucide-react';

export default function Rules() {
    const [tab, setTab] = useState<'paranoia' | 'shadow-duel'>('shadow-duel');

    return (
        <div className="min-h-[100dvh] p-6 sm:p-12 bg-slate-950 text-slate-200 pb-24">
            <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-white/10 pb-6">
                    <h1 className="text-3xl sm:text-4xl font-black text-red-500 tracking-[0.2em] uppercase">How to Play</h1>
                    <Link to="/" className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-400 hover:text-white transition-colors border border-white/20 px-4 py-2 rounded-lg hover:bg-white/5 active:scale-95 text-center">
                        Return
                    </Link>
                </div>

                <div className="flex gap-4">
                    <button onClick={() => setTab('paranoia')} className={`flex-1 px-6 py-4 rounded-xl font-bold tracking-widest uppercase text-sm transition-all flex flex-col items-center gap-2 ${tab === 'paranoia' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-black/50 text-slate-400 border border-white/10 hover:border-white/30'}`}>
                        <Skull className="w-6 h-6" />
                        Paranoia
                    </button>
                    <button onClick={() => setTab('shadow-duel')} className={`flex-1 px-6 py-4 rounded-xl font-bold tracking-widest uppercase text-sm transition-all flex flex-col items-center gap-2 ${tab === 'shadow-duel' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'bg-black/50 text-slate-400 border border-white/10 hover:border-white/30'}`}>
                        <Ghost className="w-6 h-6" />
                        Shadow Duel
                    </button>
                </div>

                {tab === 'paranoia' ? (
                    <div className="space-y-10 animate-in fade-in">
                        <section className="space-y-4">
                            <div className="flex items-center gap-4 text-red-400">
                                <Target className="w-8 h-8" />
                                <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">The Objective</h2>
                            </div>
                            <p className="text-slate-400 leading-relaxed font-medium text-sm sm:text-base">
                                <strong className="text-white">Players:</strong> Survive by deducing the symbol on the back of your own collar. Eliminate the Jack of Hearts to win.<br /><br />
                                <strong className="text-white">Jack of Hearts:</strong> Manipulate and lie to players to cause their deaths. You win if all other players are eliminated.
                                <br /><br />
                                <em className="text-slate-500">At the start of each round, a new symbol is randomly assigned to everyone's collar.</em>
                            </p>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center gap-4 text-blue-400">
                                <Users className="w-8 h-8" />
                                <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">Discussion Phase</h2>
                            </div>
                            <p className="text-slate-400 leading-relaxed font-medium text-sm sm:text-base">
                                During the discussion phase, you can see the symbols of all other players, but not your own. You may use the <strong className="text-white">Query</strong> system to ask other players what symbol is on your collar. However, remember that any player, including the Jack, can reply with any symbol to lie to you. Trust no one.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center gap-4 text-green-400">
                                <ShieldAlert className="w-8 h-8" />
                                <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">Voting Phase</h2>
                            </div>
                            <p className="text-slate-400 leading-relaxed font-medium text-sm sm:text-base">
                                Lock in the symbol you believe is on your collar. You have exactly 60 seconds (or less if the host bypasses the timer when all votes are in). Select carefully, your life depends on it.
                            </p>
                        </section>

                        <section className="space-y-4 border border-red-500/30 bg-red-500/5 p-6 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.05)]">
                            <div className="flex items-center gap-4 text-red-500">
                                <Skull className="w-6 h-6 animate-pulse" />
                                <h2 className="text-lg font-black tracking-widest uppercase">Lethal Consequences</h2>
                            </div>
                            <p className="text-slate-300 leading-relaxed font-medium text-sm">
                                Failing to vote within the time limit or selecting the incorrect symbol results in immediate execution. The game continues indefinitely until the Jack is dead, or all standard players are dead.
                            </p>
                        </section>
                    </div>
                ) : (
                    <div className="space-y-10 animate-in fade-in">
                        <section className="space-y-4">
                            <div className="flex items-center gap-4 text-purple-400">
                                <Target className="w-8 h-8" />
                                <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">The Objective</h2>
                            </div>
                            <p className="text-slate-400 leading-relaxed font-medium text-sm sm:text-base">
                                Shadow Duel is a fast-paced game of deception. At the start of the match, half the lobby are secretly assigned as <strong className="text-green-400">Zombies</strong> and the other half are <strong className="text-blue-400">Humans</strong>. The game runs for a selected number of turns (max 10).<br /><br />
                                The faction that has the most survivors at the end of the final turn wins!
                            </p>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center gap-4 text-slate-300">
                                <Search className="w-8 h-8" />
                                <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">Turn Phases</h2>
                            </div>
                            <ul className="text-slate-400 space-y-4 font-medium text-sm sm:text-base list-disc list-inside">
                                <li><strong>Interrogation (60s):</strong> Text chat to bluff, scheme, or find allies.</li>
                                <li><strong>Lock-in (15s):</strong> Secretly choose one card from your hand to play this round. Played cards are BURNED forever!</li>
                                <li><strong>Resolution:</strong> The server shuffles everyone into random 1-on-1 blind duels. Actions resolve instantly.</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center gap-4 text-red-400">
                                <Crosshair className="w-8 h-8" />
                                <h2 className="text-xl sm:text-2xl font-black tracking-widest uppercase">The Cards</h2>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                                    <h3 className="font-bold text-red-400 uppercase tracking-widest mb-2 flex flex-row items-center gap-2"><Crosshair className="w-4 h-4" /> Shotgun (All Roles)</h3>
                                    <p className="text-sm text-slate-400">Lethal force. Instantly kills a Zombie. However, if you shoot a Human, it backfires and YOU die!</p>
                                </div>
                                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                                    <h3 className="font-bold text-green-400 uppercase tracking-widest mb-2 flex flex-row items-center gap-2"><Skull className="w-4 h-4" /> Infection (Zombies)</h3>
                                    <p className="text-sm text-slate-400">Bite a Human and forcibly turn them into a Zombie on your team.</p>
                                </div>
                                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                                    <h3 className="font-bold text-blue-400 uppercase tracking-widest mb-2 flex flex-row items-center gap-2"><HeartPulse className="w-4 h-4" /> Cure (Humans)</h3>
                                    <p className="text-sm text-slate-400">Counter-agent. Reverts a Zombie back into a Human on your team.</p>
                                </div>
                                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                                    <h3 className="font-bold text-yellow-400 uppercase tracking-widest mb-2 flex flex-row items-center gap-2"><Search className="w-4 h-4" /> Recon (All Roles)</h3>
                                    <p className="text-sm text-slate-400">Numbered intel cards. If both duelers play Recon, the higher number wins and discovers the true identity of their opponent!</p>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
