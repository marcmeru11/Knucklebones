import { describe, it, expect, beforeEach } from 'vitest';
import { MatatenaAI } from '../../src/js/models/MatatenaAI.js';
import { MatatenaLogic } from '../../src/js/models/MatatenaLogic.js';

describe('MatatenaAI', () => {
    let ai;
    let game;

    beforeEach(() => {
        ai = new MatatenaAI();
        game = new MatatenaLogic();
    });

    it('should find a valid move in "easy" difficulty', () => {
        game.dadoActual = 5;
        const col = ai.suggestMove(game.tableroJugador, game.tableroOponente, game.dadoActual, 'easy');
        expect(col).toBeGreaterThanOrEqual(0);
        expect(col).toBeLessThanOrEqual(2);
        expect(game.tableroOponente[col].length).toBeLessThan(3);
    });

    it('should find a valid move in "hard" difficulty', () => {
        game.dadoActual = 6;
        const col = ai.suggestMove(game.tableroJugador, game.tableroOponente, game.dadoActual, 'hard');
        expect(col).toBeGreaterThanOrEqual(0);
        expect(col).toBeLessThanOrEqual(2);
        expect(game.tableroOponente[col].length).toBeLessThan(3);
    });

    it('should return 0 (default) if no valid moves are available', () => {
        game.tableroOponente = [[1, 2, 3], [4, 5, 6], [1, 2, 3]];
        const col = ai.suggestMove(game.tableroJugador, game.tableroOponente, game.dadoActual, 'medium');
        expect(col).toBe(0);
    });

    it('should prefer columns where it can destroy opponent dice in "hard" mode', () => {
        // Opponent has 6 in col 1
        game.tableroJugador[1] = [6];
        game.tableroOponente[0] = [1];
        game.tableroOponente[1] = [2];
        game.tableroOponente[2] = [3];
        game.dadoActual = 6;

        const col = ai.suggestMove(game.tableroJugador, game.tableroOponente, game.dadoActual, 'hard');
        // AI should pick col 1 to destroy opponent's 6
        expect(col).toBe(1);
    });
});
