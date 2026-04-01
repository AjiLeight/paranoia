import { Link } from 'react-router-dom';
import { ShieldAlert, Users, Skull, Target } from 'lucide-react';

export default function Rules() {
    return (
        <div className="min-h-[100dvh] p-6 sm:p-12 bg-slate-950 text-slate-200">
            <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">

                <div className="flex justify-between items-center border-b border-white/10 pb-6">
                    <h1 className="text-3xl sm:text-4xl font-black text-red-500 tracking-[0.2em] uppercase">How to Play</h1>
                    <Link to="/" className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-400 hover:text-white transition-colors border border-white/20 px-4 py-2 rounded-lg hover:bg-white/5 active:scale-95">
                        Return
                    </Link>
                </div>

                <div className="space-y-10">
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
            </div>
        </div>
    );
}
