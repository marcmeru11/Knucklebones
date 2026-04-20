/**
 * GameStrategy.js
 * Base class for all game mode strategies.
 */
export class GameStrategy {
    constructor(game, uiManager) {
        this.game = game;
        this.ui = uiManager;
    }

    /**
     * Called when the mode starts.
     * @param {Object} config - Optional configuration (difficulty, roomCode, etc.)
     */
    async init(config) {}

    /**
     * Executes a die roll.
     */
    async roll() {}

    /**
     * Places the current die into a column.
     * @param {number} colIndex 
     */
    async place(colIndex) {}

    /**
     * Restarts the current match.
     */
    async restart() {}

    /**
     * Leaves the match and clean up.
     */
    async leave() {}

    /**
     * Helper to check if the game is over.
     */
    checkGameOver() {
        let playerSlots = 0, oppSlots = 0;
        for(let i=0; i<3; i++) {
            playerSlots += this.game.tableroJugador[i].length;
            oppSlots += this.game.tableroOponente[i].length;
        }
        return (playerSlots === 9 || oppSlots === 9);
    }
}
