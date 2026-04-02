import { createContext, useContext, type ReactNode } from 'react';
import { ref, update } from 'firebase/database';
import { db } from '../lib/firebase';
import { useGame } from './GameContext';

interface ShadowDuelContextType {
    startSDGame: () => Promise<void>;
    startSDRound: () => Promise<void>;
    lockInCard: (cardName: string) => Promise<void>;
    resolveSDRound: () => Promise<void>;
    startInterrogation: () => Promise<void>;
}

const ShadowDuelContext = createContext<ShadowDuelContextType | undefined>(undefined);

export const ShadowDuelProvider = ({ children }: { children: ReactNode }) => {
    const { room, me } = useGame();

    const startSDGame = async () => {
        if (!room || !me?.isHost) return;
        try {
            const approvedPlayers = Object.values(room.players).filter(p => !p.isDead && p.isApproved);
            const N = room.sdTotalRounds || 5;
            if (approvedPlayers.length < 2) throw new Error("Not enough players to start.");

            const playerIds = approvedPlayers.map(p => p.id);
            const shuffledIds = [...playerIds].sort(() => Math.random() - 0.5);
            const numZombies = Math.max(1, Math.floor(shuffledIds.length / 2));

            const updates: Record<string, any> = {};

            shuffledIds.forEach((pId, idx) => {
                const isZombie = idx < numZombies;
                updates[`rooms/${room.id}/players/${pId}/sdRole`] = isZombie ? 'zombie' : 'human';
                updates[`rooms/${room.id}/players/${pId}/isDead`] = false;
                updates[`rooms/${room.id}/players/${pId}/sdLockedCard`] = null;
                updates[`rooms/${room.id}/players/${pId}/sdDuelResult`] = null;

                // Deal N cards
                const hand = ['Shotgun'];
                hand.push(isZombie ? 'Infection' : 'Cure');
                for (let i = 1; i <= N - 2; i++) {
                    hand.push(`Recon_${i}`);
                }
                updates[`rooms/${room.id}/players/${pId}/sdCards`] = hand;
            });

            updates[`rooms/${room.id}/status`] = 'sd_interrogation';
            updates[`rooms/${room.id}/sdCurrentRound`] = 1;
            updates[`rooms/${room.id}/sdTotalRounds`] = N;
            const interTime = room.discussionTime || 60;
            updates[`rooms/${room.id}/discussionEndTime`] = Date.now() + interTime * 1000;

            await update(ref(db), updates);
        } catch (e: any) {
            console.error(e);
            throw e;
        }
    };

    const startSDRound = async () => {
        if (!room || !me?.isHost) return;
        try {
            const updates: Record<string, any> = {};
            updates[`rooms/${room.id}/status`] = 'sd_lock_in';
            updates[`rooms/${room.id}/votingEndTime`] = Date.now() + 15 * 1000; // 15 seconds lock in time
            await update(ref(db), updates);
        } catch (e: any) {
            console.error(e);
        }
    };

    const lockInCard = async (cardName: string) => {
        if (!room || !me) return;
        await update(ref(db, `rooms/${room.id}/players/${me.id}`), {
            sdLockedCard: cardName
        });
    };

    const resolveSDRound = async () => {
        if (!room || !me?.isHost) return;
        try {
            const updates: Record<string, any> = {};
            const alivePlayers = Object.values(room.players).filter(p => !p.isDead && p.isApproved);

            let pool = [...alivePlayers];

            // Isolation
            if (pool.length % 2 !== 0) {
                const isolatedIdx = Math.floor(Math.random() * pool.length);
                const isolatedPlayer = pool[isolatedIdx];

                // Pick a random card if none is locked
                let lockedCard = isolatedPlayer.sdLockedCard;
                if (!lockedCard && isolatedPlayer.sdCards?.length) {
                    lockedCard = isolatedPlayer.sdCards[Math.floor(Math.random() * isolatedPlayer.sdCards.length)];
                }

                // Burn their locked card
                if (lockedCard && isolatedPlayer.sdCards) {
                    updates[`rooms/${room.id}/players/${isolatedPlayer.id}/sdCards`] =
                        isolatedPlayer.sdCards.filter(c => c !== lockedCard);
                }
                updates[`rooms/${room.id}/players/${isolatedPlayer.id}/sdDuelResult`] = {
                    type: 'isolated',
                    message: "You were isolated in the dark. Your card was burned."
                };
                updates[`rooms/${room.id}/players/${isolatedPlayer.id}/sdLockedCard`] = null;

                pool.splice(isolatedIdx, 1);
            }

            // Shuffle remaining for pairs
            pool = pool.sort(() => Math.random() - 0.5);

            for (let i = 0; i < pool.length; i += 2) {
                const p1 = pool[i];
                const p2 = pool[i + 1];

                // Auto-pick if missing
                let card1 = p1.sdLockedCard;
                if (!card1 && p1.sdCards && p1.sdCards.length > 0) {
                    card1 = p1.sdCards[Math.floor(Math.random() * p1.sdCards.length)];
                }

                let card2 = p2.sdLockedCard;
                if (!card2 && p2.sdCards && p2.sdCards.length > 0) {
                    card2 = p2.sdCards[Math.floor(Math.random() * p2.sdCards.length)];
                }

                // Burn cards
                if (card1 && card1 !== 'Infection' && p1.sdCards) updates[`rooms/${room.id}/players/${p1.id}/sdCards`] = p1.sdCards.filter(c => c !== card1);
                if (card2 && card2 !== 'Infection' && p2.sdCards) updates[`rooms/${room.id}/players/${p2.id}/sdCards`] = p2.sdCards.filter(c => c !== card2);

                let result1: any = { opponentName: "??", type: 'neutral', cardPlayedAgainstYou: card2 || "None", cardYouPlayed: card1 || "None" };
                let result2: any = { opponentName: "??", type: 'neutral', cardPlayedAgainstYou: card1 || "None", cardYouPlayed: card2 || "None" };

                let p1Role = p1.sdRole;
                let p2Role = p2.sdRole;
                let p1Dead = p1.isDead;
                let p2Dead = p2.isDead;

                const evaluateAction = (_actorRole: string, targetRole: string, actorCard?: string, targetCard?: string) => {
                    if (actorCard === 'Shotgun') {
                        if (targetCard === 'Shotgun') return { targetDead: true, actorDead: true };
                        if (targetRole === 'zombie' || targetCard === 'Infection') return { targetDead: true };
                        if (targetRole === 'human') return { actorDead: true };
                    }
                    if (actorCard === 'Infection') {
                        if (targetRole === 'human' && targetCard !== 'Cure') return { targetRoleChange: 'zombie' };
                    }
                    if (actorCard === 'Cure') {
                        if (targetRole === 'zombie' && targetCard !== 'Infection') return { targetRoleChange: 'human' };
                    }
                    return {};
                };

                const parseRecon = (card?: string) => card?.startsWith('Recon_') ? parseInt(card.split('_')[1]) : 0;

                // Apply Actions
                const act1 = evaluateAction(p1Role || '', p2Role || '', card1, card2);
                const act2 = evaluateAction(p2Role || '', p1Role || '', card2, card1);

                let p1Dies = act1.actorDead || act2.targetDead;
                let p2Dies = act2.actorDead || act1.targetDead;

                if (p1Dies) p1Dead = true;
                if (p2Dies) p2Dead = true;

                if (!p2Dead && !p1Dead && act1.targetRoleChange) p2Role = act1.targetRoleChange as any;
                if (!p1Dead && !p2Dead && act2.targetRoleChange) p1Role = act2.targetRoleChange as any;

                // Recon Duel
                const r1 = parseRecon(card1);
                const r2 = parseRecon(card2);
                if (r1 > 0 && r2 > 0) {
                    if (r1 > r2) {
                        result1.opponentName = p2.name;
                        result1.opponentRole = p2Role; // Expose true identity
                    } else if (r2 > r1) {
                        result2.opponentName = p1.name;
                        result2.opponentRole = p1Role;
                    }
                }

                // UI Feedback
                if (!p1Dead && !p2Dead && (act1.targetRoleChange || act2.targetRoleChange)) {
                    if (act1.targetRoleChange) result2.type = 'infected_or_cured';
                    if (act2.targetRoleChange) result1.type = 'infected_or_cured';
                }
                if (p2Dead) result2.type = 'shot';
                if (p1Dead) result1.type = 'shot';

                updates[`rooms/${room.id}/players/${p1.id}/sdDuelResult`] = result1;
                updates[`rooms/${room.id}/players/${p2.id}/sdDuelResult`] = result2;

                updates[`rooms/${room.id}/players/${p1.id}/isDead`] = p1Dead;
                updates[`rooms/${room.id}/players/${p2.id}/isDead`] = p2Dead;
                updates[`rooms/${room.id}/players/${p1.id}/sdRole`] = p1Role;
                updates[`rooms/${room.id}/players/${p2.id}/sdRole`] = p2Role;

                // Clear locked cards
                updates[`rooms/${room.id}/players/${p1.id}/sdLockedCard`] = null;
                updates[`rooms/${room.id}/players/${p2.id}/sdLockedCard`] = null;
            }

            // Morph unused Cure/Infection based on new identity
            Object.values(room.players).forEach(p => {
                const updatedRole = updates[`rooms/${room.id}/players/${p.id}/sdRole`] || p.sdRole;
                let currentCards = updates[`rooms/${room.id}/players/${p.id}/sdCards`] || p.sdCards;
                if (currentCards) {
                    currentCards = currentCards.map((c: string) => {
                        if (c === 'Cure' && updatedRole === 'zombie') return 'Infection';
                        if (c === 'Infection' && updatedRole === 'human') return 'Cure';
                        return c;
                    });
                    updates[`rooms/${room.id}/players/${p.id}/sdCards`] = currentCards;
                }
            });

            // Check Win Conditions
            // Wait, we need to count alive Zombies vs Humans from updates or current state
            let aliveZombies = 0;
            let aliveHumans = 0;
            Object.values(room.players).forEach(p => {
                const isDead = updates[`rooms/${room.id}/players/${p.id}/isDead`] ?? p.isDead;
                const role = updates[`rooms/${room.id}/players/${p.id}/sdRole`] ?? p.sdRole;
                if (!isDead && p.isApproved) {
                    if (role === 'zombie') aliveZombies++;
                    else if (role === 'human') aliveHumans++;
                }
            });

            const currentRound = room.sdCurrentRound || 1;
            const totalRounds = room.sdTotalRounds || 1;

            if (currentRound >= totalRounds || aliveZombies + aliveHumans <= 1) {
                // Game Over
                updates[`rooms/${room.id}/status`] = 'finished';
                if (aliveZombies > aliveHumans) updates[`rooms/${room.id}/winner`] = 'zombies';
                else if (aliveHumans > aliveZombies) updates[`rooms/${room.id}/winner`] = 'humans';
                else updates[`rooms/${room.id}/winner`] = 'players'; // Tie
            } else {
                updates[`rooms/${room.id}/status`] = 'sd_resolution'; // View results
                updates[`rooms/${room.id}/votingEndTime`] = Date.now() + 10 * 1000; // 10 seconds to view results
            }

            await update(ref(db), updates);
        } catch (e) {
            console.error(e);
        }
    };

    const startInterrogation = async () => {
        if (!room || !me?.isHost) return;
        const updates: Record<string, any> = {};
        updates[`rooms/${room.id}/status`] = 'sd_interrogation';
        const interTime = room.discussionTime || 60;
        updates[`rooms/${room.id}/discussionEndTime`] = Date.now() + interTime * 1000;

        let round = room.sdCurrentRound || 1;
        updates[`rooms/${room.id}/sdCurrentRound`] = round + 1;
        await update(ref(db), updates);
    };

    return (
        <ShadowDuelContext.Provider value={{ startSDGame, startSDRound, lockInCard, resolveSDRound, startInterrogation }}>
            {children}
        </ShadowDuelContext.Provider>
    );
};

export const useShadowDuel = () => {
    const context = useContext(ShadowDuelContext);
    if (!context) throw new Error("useShadowDuel must be used inside ShadowDuelProvider");
    return context;
};
