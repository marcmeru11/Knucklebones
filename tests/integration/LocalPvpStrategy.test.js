import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalPvpStrategy } from '../../src/js/strategies/LocalPvpStrategy.js';
import { MatatenaLogic } from '../../src/js/models/MatatenaLogic.js';

describe('LocalPvpStrategy Integration', () => {
    let game, ui, strategy;

    beforeEach(() => {
        game = new MatatenaLogic();
        ui = { 
            renderTableros: vi.fn(),
            actualizarPuntos: vi.fn(),
            actualizarIndicadorTurno: vi.fn(),
            actualizarEstadoDados: vi.fn(),
            playRollAnimation: vi.fn(cb => cb()) 
        };
        strategy = new LocalPvpStrategy(game, ui);
    });

    it('should initialize with specific player names', async () => {
        const spy = vi.fn();
        strategy.on('gameStart', spy);
        
        await strategy.init({});
        
        expect(strategy.turnoActual).toBe('jugador1');
        expect(spy).toHaveBeenCalled();
    });

    it('should correctly toggle turns between jugador1 and jugador2', async () => {
        game.dadoActual = 3;
        
        // Player 1 places
        await strategy.place(0);
        expect(strategy.turnoActual).toBe('jugador2');
        
        // Simulate Player 2's turn
        game.dadoActual = 4;
        await strategy.place(1);
        expect(strategy.turnoActual).toBe('jugador1');
    });

    it('should not allow rolling if it is not the players turn or die already rolled', async () => {
        const spy = vi.fn();
        strategy.on('requestRollAnimation', spy);
        
        // First roll
        await strategy.roll();
        expect(spy).toHaveBeenCalledTimes(1);
        
        // Second roll before placing (should be blocked)
        game.dadoActual = 6;
        await strategy.roll();
        expect(spy).toHaveBeenCalledTimes(1);
    });
});
