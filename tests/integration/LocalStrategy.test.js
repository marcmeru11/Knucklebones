import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStrategy } from '../../src/js/strategies/LocalStrategy.js';
import { MatatenaLogic } from '../../src/js/models/MatatenaLogic.js';

describe('LocalStrategy Integration', () => {
    let game, ui, ai, strategy;

    beforeEach(() => {
        game = new MatatenaLogic();
        ui = { 
            renderTableros: vi.fn(),
            actualizarPuntos: vi.fn(),
            actualizarIndicadorTurno: vi.fn(),
            actualizarEstadoDados: vi.fn(),
            playRollAnimation: vi.fn(cb => cb()) 
        };
        ai = { suggestMove: vi.fn(() => 0) };
        strategy = new LocalStrategy(game, ui, ai);
    });

    it('should initialize game state', async () => {
        const spy = vi.fn();
        strategy.on('gameStart', spy);
        
        await strategy.init({ difficulty: 'medium' });
        
        expect(strategy.difficulty).toBe('medium');
        expect(strategy.turnoActual).toBe('jugador1');
        expect(spy).toHaveBeenCalled();
    });

    it('should handle player die roll', async () => {
        const spy = vi.fn((cb) => cb(4));
        strategy.on('requestRollAnimation', spy);
        
        await strategy.roll();
        
        expect(spy).toHaveBeenCalled();
        expect(game.dadoActual).toBeGreaterThan(0);
    });

    it('should switch turns after player places a die', async () => {
        game.dadoActual = 5;
        
        // Mocking executing CPU turn to avoid long timeouts/async issues in this specific test
        vi.spyOn(strategy, 'ejecutarTurnoIA').mockImplementation(() => Promise.resolve());

        await strategy.place(0);
        
        expect(game.tableroJugador[0]).toContain(5);
        expect(strategy.turnoActual).toBe('jugador2');
        expect(strategy.ejecutarTurnoIA).toHaveBeenCalled();
    });
});
