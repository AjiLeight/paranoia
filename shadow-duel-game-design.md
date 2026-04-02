# Game Design Document: Shadow Duel

A 15-minute, high-stakes hidden role mobile game based on anonymous 1-on-1 interactions, paranoia, and social deduction.

> **Project Goal:** This document serves as the blueprint for an AI agent or developer to build the complete mobile game, detailing the core loop, logic, edge cases, and technical architecture.

---

## 1. Core Concept & Lobby System

**Shadow Duel** scales dynamically based on the lobby size ($N$). The number of players dictates the exact number of rounds and the exact hand size.

* **Player Count:** Minimum 4 players. Odd numbers (e.g., 5, 7, 9) are fully supported via the "Isolation" mechanic.
* **Game Length:** Exactly $N$ rounds (e.g., 7 players = 7 rounds).
* **Hand Size:** Exactly $N$ cards dealt to each player at the start.
* **No Card Drawing:** Players start with a fixed hand. Once a card is played, it is burned for the remainder of the match.

---

## 2. Secret Identities

At the start of the match, the server secretly assigns every player to a team. This is their **Identity**, which is distinct from the cards in their hand.

* **The Starting Zombie (1 Player):** The sole infected player attempting to spread the virus.
* **The Humans (Remaining Players):** Uninfected players trying to survive and eliminate the Zombies.

> **Crucial Logic:** Identities can change dynamically during the match. If a Human is infected, their backend Identity updates to 'Zombie'. If a Zombie is cured, their Identity reverts to 'Human'.

---

## 3. The Deck & Card Effects

Every player receives exactly $N$ cards. The composition of the hand depends entirely on their current Identity. 

| Card Name | Quantity | Faction | Effect & Resolution |
| :--- | :--- | :--- | :--- |
| **Shotgun** | 1 | Both | **Lethal.** Kills a Zombie instantly. If it hits a Human, it backfires and the shooter is eliminated. |
| **Infection** | 1 | Zombies | **Bite.** Turns a Human into a Zombie. Fails if used against another Zombie. |
| **Cure** | 1 | Humans | **Heal.** Turns a Zombie into a Human. Fails if used against another Human. |
| **Recon** | N - 2 | Both | **Intel.** Numbered 1 through (N-2). In a Recon vs. Recon duel, the highest number wins and reveals the opponent's true Identity and Username to the winner. |

### Dynamic Card Morphing
If a player's Identity changes mid-game (e.g., a Human is Infected), their unused **Cure** card instantly morphs into an **Infection** card in their UI, and vice versa.

---

## 4. The Game Loop

The game executes in a strict loop for $N$ rounds. Each round consists of four phases.

### Phase 1: The Lock-In (15 Seconds)
All players view their remaining cards and select exactly ONE card to play face-down. 

### Phase 2: The Dark Room Matchmaking (Automated)
The server completely anonymizes the active players and shuffles them into random 1-on-1 pairs.
* **The Isolation Rule (Odd Numbers):** If the active player count is odd, one random player is left out of the matchmaking. They are placed in "Isolation." Their selected card is burned (discarded without effect), and they cannot be attacked or interact for this round.

### Phase 3: The Resolution (Instant)
The 1-on-1 pairs reveal their cards simultaneously. The server resolves the interactions based on the card logic.
* *UI/UX Note:* Players see the shadow silhouette of their opponent and the card played against them, but **never** the opponent's username (unless a Recon duel was won).
* Infection/Cure triggers a screen flash (Green/Blue) for the affected player.

### Phase 4: The Interrogation (45 Seconds)
All surviving players (including isolated ones) are returned to a global chat lobby.
* Players use text/voice chat to share intel, lie, bluff, or coordinate Shotgun strikes for the next round.
* When the timer expires, the loop resets to Phase 1.

---

## 5. Win Conditions & Elimination

Players are **Eliminated** if they are shot by a Shotgun or if their own Shotgun backfires. Eliminated players discard their hands and enter a read-only spectator mode.

The match ends immediately upon either condition:
1.  **Total Wipeout:** All players of one faction are eliminated.
2.  **Time Exhaustion:** All $N$ rounds are completed.

Upon match end, the server forces an identity reveal. The faction with the most surviving players wins.
