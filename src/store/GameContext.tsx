import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ref, onValue, set, update, get, remove } from 'firebase/database';
import { db } from '../lib/firebase';
import { v4 as uuidv4 } from 'uuid';

export interface Player {
    id: string;
    name: string;
    avatarIndex?: number;
    isHost: boolean;
    isApproved?: boolean;
    role?: 'player' | 'jack';
    symbol?: 'hearts' | 'spades' | 'diamonds' | 'clubs';
    sessionToken?: string;
    isDead?: boolean;
    selectedSymbol?: 'hearts' | 'spades' | 'diamonds' | 'clubs';
    sdRole?: 'human' | 'zombie';
    sdCards?: string[];
    sdLockedCard?: string;
    sdDuelResult?: any;
}

export interface GameRequest {
    id: string;
    fromId: string;
    toId: string;
    replySymbol?: 'hearts' | 'spades' | 'diamonds' | 'clubs';
}

export interface Room {
    id: string;
    isPublic?: boolean;
    gameType?: 'paranoia' | 'shadow-duel';
    status: 'waiting' | 'discussion' | 'voting' | 'finished' | 'sd_lock_in' | 'sd_resolution' | 'sd_interrogation';
    jacksCount: number;
    discussionTime: number;
    votingTime: number;
    discussionEndTime?: number;
    votingEndTime?: number;
    winner?: 'jacks' | 'players' | 'humans' | 'zombies';
    players: Record<string, Player>;
    requests?: Record<string, GameRequest>;
    sdCurrentRound?: number;
    sdTotalRounds?: number;
}

interface GameContextType {
    room: Room | null;
    me: Player | null;
    createGame: (name: string, avatarIndex: number, jacks: number, discTime: number, isPublic?: boolean, gameType?: 'paranoia' | 'shadow-duel', sdRounds?: number) => Promise<string>;
    joinGame: (name: string, avatarIndex: number, roomId: string) => Promise<void>;
    approvePlayer: (playerId: string) => Promise<void>;
    rejectPlayer: (playerId: string) => Promise<void>;
    subscribeToRoom: (roomId: string) => void;
    startGame: () => Promise<void>;
    leaveGame: () => Promise<void>;
    cancelGame: () => Promise<void>;
    sendRequest: (toId: string) => Promise<void>;
    replyRequest: (requestId: string, symbol: 'hearts' | 'spades' | 'diamonds' | 'clubs') => Promise<void>;
    submitVote: (symbol: 'hearts' | 'spades' | 'diamonds' | 'clubs') => Promise<void>;
    advanceToVoting: () => Promise<void>;
    resolveRound: () => Promise<void>;
    error: string | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
    const [room, setRoom] = useState<Room | null>(null);
    const [me, setMe] = useState<Player | null>(null);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!activeRoomId) return;
        const roomRef = ref(db, `rooms/${activeRoomId}`);
        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setRoom(data);

                const storedId = sessionStorage.getItem('paranoia_id');
                const storedToken = sessionStorage.getItem('paranoia_session');

                if (storedId && data.players && data.players[storedId]) {
                    const remoteToken = data.players[storedId].sessionToken;

                    // If the DB has a different session token, this browser was hijacked!
                    if (remoteToken && storedToken && remoteToken !== storedToken) {
                        setMe(null);
                        setActiveRoomId(null);
                        sessionStorage.removeItem('paranoia_id');
                        sessionStorage.removeItem('paranoia_session');
                        return;
                    }

                    // ALWAYS update me to reflect the server state!
                    setMe(data.players[storedId]);
                }
            } else {
                setRoom(null);
                setMe(null);
                setActiveRoomId(null);
                sessionStorage.removeItem('paranoia_id');
                sessionStorage.removeItem('paranoia_session');
            }
        }, (err) => {
            console.error(err);
            setError("Failed to sync room data.");
        });

        return () => unsubscribe();
    }, [activeRoomId]);

    const createGame = async (name: string, avatarIndex: number, jacks: number, discTime: number, isPublic: boolean = false, gameType: 'paranoia' | 'shadow-duel' = 'paranoia', sdRounds: number = 5) => {
        try {
            const roomId = uuidv4().slice(0, 6).toUpperCase();
            const myId = sessionStorage.getItem('paranoia_id') || uuidv4();
            const sessionToken = uuidv4();

            sessionStorage.setItem('paranoia_id', myId);
            sessionStorage.setItem('paranoia_session', sessionToken);

            const newRoom: Room = {
                id: roomId,
                isPublic,
                gameType,
                status: 'waiting',
                jacksCount: jacks,
                discussionTime: discTime,
                votingTime: 30,
                sdTotalRounds: sdRounds,
                players: {
                    [myId]: { id: myId, name, avatarIndex, isHost: true, isApproved: true, sessionToken }
                }
            };

            await set(ref(db, `rooms/${roomId}`), newRoom);
            setMe({ id: myId, name, avatarIndex, isHost: true, isApproved: true, sessionToken });
            setActiveRoomId(roomId);
            setError(null);
            return roomId;
        } catch (e: any) {
            setError(e.message || "Could not create room.");
            throw e;
        }
    };

    const joinGame = async (name: string, avatarIndex: number, roomId: string) => {
        try {
            const rId = roomId.toUpperCase();
            const snapshot = await get(ref(db, `rooms/${rId}`));
            if (!snapshot.exists()) {
                throw new Error('Room not found');
            }

            const roomData = snapshot.val() as Room;
            const cleanName = name.trim();
            const matchingPlayer = roomData.players ? Object.values(roomData.players).find(p => p.name.toLowerCase() === cleanName.toLowerCase()) : undefined;

            if (roomData.status !== 'waiting' && !matchingPlayer) {
                throw new Error('Game has already started, and your name does not match any current players.');
            }

            let myId = sessionStorage.getItem('paranoia_id');
            let isHost = false;

            if (matchingPlayer) {
                myId = matchingPlayer.id;
                isHost = matchingPlayer.isHost;
            }

            if (!myId) {
                myId = uuidv4();
            }

            const sessionToken = uuidv4();
            sessionStorage.setItem('paranoia_id', myId);
            sessionStorage.setItem('paranoia_session', sessionToken);

            const existingPlayer = roomData.players?.[myId];

            const playerData: any = {
                id: myId,
                name: cleanName,
                avatarIndex,
                isHost,
                isApproved: isHost ? true : false,
                sessionToken
            };

            if (existingPlayer?.role) playerData.role = existingPlayer.role;
            if (existingPlayer?.symbol) playerData.symbol = existingPlayer.symbol;
            if (existingPlayer?.isApproved !== undefined) playerData.isApproved = existingPlayer.isApproved;

            await update(ref(db, `rooms/${rId}/players/${myId}`), playerData);

            setMe(playerData as Player);
            setActiveRoomId(rId);
            setError(null);
        } catch (e: any) {
            setError(e.message || "Could not join room.");
            throw e;
        }
    };

    const subscribeToRoom = (roomId: string) => {
        setActiveRoomId(roomId.toUpperCase());
    };

    const leaveGame = async () => {
        if (!room || !me) return;
        try {
            await remove(ref(db, `rooms/${room.id}/players/${me.id}`));
            setMe(null);
            setRoom(null);
            setActiveRoomId(null);
            sessionStorage.removeItem('paranoia_id');
        } catch (e: any) {
            setError(e.message || "Could not leave room.");
            throw e;
        }
    };

    const cancelGame = async () => {
        if (!room || !me?.isHost) return;
        try {
            await remove(ref(db, `rooms/${room.id}`));
        } catch (e: any) {
            setError(e.message || "Could not cancel room.");
            throw e;
        }
    };

    const approvePlayer = async (playerId: string) => {
        if (!room || !me?.isHost) return;
        try {
            await update(ref(db, `rooms/${room.id}/players/${playerId}`), { isApproved: true });
        } catch (e: any) {
            setError(e.message || "Could not approve player.");
            throw e;
        }
    };

    const rejectPlayer = async (playerId: string) => {
        if (!room || !me?.isHost) return;
        try {
            await remove(ref(db, `rooms/${room.id}/players/${playerId}`));
        } catch (e: any) {
            setError(e.message || "Could not reject player.");
            throw e;
        }
    };

    const startGame = async () => {
        if (!room || !me?.isHost) return;
        try {
            const approvedPlayers = Object.values(room.players).filter(p => p.isApproved);
            const playerIds = approvedPlayers.map(p => p.id);
            const shuffledIds = [...playerIds].sort(() => Math.random() - 0.5);

            const updates: Record<string, any> = {};
            const symbols = ['hearts', 'spades', 'diamonds', 'clubs'] as const;

            Object.values(room.players).forEach(p => {
                if (!p.isApproved) {
                    updates[`rooms/${room.id}/players/${p.id}`] = null;
                }
            });

            shuffledIds.forEach((pId, idx) => {
                const isJack = idx < room.jacksCount;
                const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                updates[`rooms/${room.id}/players/${pId}/role`] = isJack ? 'jack' : 'player';
                updates[`rooms/${room.id}/players/${pId}/symbol`] = randomSymbol;
                updates[`rooms/${room.id}/players/${pId}/isDead`] = false;
                updates[`rooms/${room.id}/players/${pId}/selectedSymbol`] = null;
            });

            updates[`rooms/${room.id}/status`] = 'discussion';
            updates[`rooms/${room.id}/discussionEndTime`] = Date.now() + room.discussionTime * 1000;
            updates[`rooms/${room.id}/requests`] = null; // Clear any old requests

            await update(ref(db), updates);
        } catch (e: any) {
            setError(e.message || "Failed to start game.");
            throw e;
        }
    };

    const sendRequest = async (toId: string) => {
        if (!room || !me) return;
        const reqId = `${me.id}_${toId}`;
        await update(ref(db, `rooms/${room.id}/requests/${reqId}`), {
            id: reqId,
            fromId: me.id,
            toId
        });
    };

    const replyRequest = async (requestId: string, symbol: 'hearts' | 'spades' | 'diamonds' | 'clubs') => {
        if (!room) return;
        await set(ref(db, `rooms/${room.id}/requests/${requestId}/replySymbol`), symbol);
    };

    const submitVote = async (symbol: 'hearts' | 'spades' | 'diamonds' | 'clubs') => {
        if (!room || !me) return;
        await set(ref(db, `rooms/${room.id}/players/${me.id}/selectedSymbol`), symbol);
    };

    const advanceToVoting = async () => {
        if (!room || !me?.isHost) return;
        await update(ref(db, `rooms/${room.id}`), {
            status: 'voting',
            votingEndTime: Date.now() + 60 * 1000 // Exactly 60 seconds
        });
    };

    const resolveRound = async () => {
        if (!room || !me?.isHost) return;

        // Evaluate deaths
        const updates: Record<string, any> = {};
        let aliveJacks = 0;
        let alivePlayers = 0;

        Object.values(room.players).forEach(p => {
            if (p.isDead) return; // Already dead

            // If they didn't guess correctly or missed the vote, they die
            if (p.selectedSymbol !== p.symbol) {
                updates[`rooms/${room.id}/players/${p.id}/isDead`] = true;
            } else {
                // They lived! Re-roll their symbol
                const symbols = ['hearts', 'spades', 'diamonds', 'clubs'] as const;
                const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                updates[`rooms/${room.id}/players/${p.id}/symbol`] = randomSymbol;
                // Count alive roles assuming they didn't just die
                if (p.role === 'jack') aliveJacks++;
                else alivePlayers++;
            }
            // Reset their vote whether they lived or died 
            updates[`rooms/${room.id}/players/${p.id}/selectedSymbol`] = null;
        });

        // Check Win Conditons
        if (aliveJacks === 0 && alivePlayers === 0) {
            // Tie/everyone dead
            updates[`rooms/${room.id}/status`] = 'finished';
            updates[`rooms/${room.id}/winner`] = 'players'; // Technically players win if jack is dead
        } else if (aliveJacks === 0) {
            updates[`rooms/${room.id}/status`] = 'finished';
            updates[`rooms/${room.id}/winner`] = 'players';
        } else if (alivePlayers === 0) {
            updates[`rooms/${room.id}/status`] = 'finished';
            updates[`rooms/${room.id}/winner`] = 'jacks';
        } else {
            // New Round
            updates[`rooms/${room.id}/status`] = 'discussion';
            updates[`rooms/${room.id}/discussionEndTime`] = Date.now() + room.discussionTime * 1000;
            updates[`rooms/${room.id}/requests`] = null; // Clear old requests to save storage
        }

        await update(ref(db), updates);
    };

    return (
        <GameContext.Provider value={{ room, me, createGame, joinGame, approvePlayer, rejectPlayer, subscribeToRoom, startGame, leaveGame, cancelGame, sendRequest, replyRequest, submitVote, advanceToVoting, resolveRound, error }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};
