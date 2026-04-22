import { describe, it, expect, beforeEach } from 'vitest';
import { MatatenaLogic } from '../../src/js/models/MatatenaLogic.js';

describe('MatatenaLogic', () => {
    let game;

    beforeEach(() => {
        game = new MatatenaLogic();
    });

    it('should initialize with empty boards and zero dice value', () => {
        expect(game.tableroJugador).toEqual([[], [], []]);
        expect(game.tableroOponente).toEqual([[], [], []]);
        expect(game.dadoActual).toBe(0);
    });

    it('should roll a die between 1 and 6', () => {
        const val = game.lanzarDado();
        expect(val).toBeGreaterThanOrEqual(1);
        expect(val).toBeLessThanOrEqual(6);
        expect(game.dadoActual).toBe(val);
    });

    describe('calcularPuntosColumna', () => {
        it('should calculate points for a column with single dice', () => {
            expect(game.calcularPuntosColumna([1, 2, 3])).toBe(6);
        });

        it('should calculate points for a column with doubles (n*2)*2', () => {
            // (2*2)*2 = 8. Total = 8 + 3 = 11
            expect(game.calcularPuntosColumna([2, 2, 3])).toBe(11);
        });

        it('should calculate points for a column with triples (n*3)*3', () => {
            // (4*3)*3 = 36
            expect(game.calcularPuntosColumna([4, 4, 4])).toBe(36);
        });
    });

    describe('colocarDado', () => {
        it('should place a die correctly', () => {
            game.dadoActual = 5;
            const res = game.colocarDado(0, true);
            expect(res.success).toBe(true);
            expect(game.tableroJugador[0]).toEqual([5]);
            expect(game.dadoActual).toBe(0);
        });

        it('should not place a die if none rolled', () => {
            game.dadoActual = 0;
            const res = game.colocarDado(0, true);
            expect(res.success).toBe(false);
        });

        it('should not place in a full column', () => {
            game.tableroJugador[0] = [1, 2, 3];
            game.dadoActual = 5;
            const res = game.colocarDado(0, true);
            expect(res.success).toBe(false);
            expect(game.tableroJugador[0]).toEqual([1, 2, 3]);
        });
    });

    describe('destruirDados', () => {
        it('should eliminate opponent dice of the same value', () => {
            game.tableroOponente[0] = [3, 4, 3];
            game.dadoActual = 3;
            // Place 3 in Player Col 0, should eliminate two 3s from Opponent Col 0
            const res = game.colocarDado(0, true);
            expect(res.destroyedCount).toBe(2);
            expect(game.tableroOponente[0]).toEqual([4]);
            expect(game.tableroJugador[0]).toEqual([3]);
        });
    });
});
