import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIManager } from '../../src/js/ui/UIManager.js';
import { MatatenaLogic } from '../../src/js/models/MatatenaLogic.js';

describe('UIManager', () => {
    beforeEach(() => {
        // Setup minimal DOM for UIManager
        document.body.innerHTML = `
            <div id="game-wrapper">
                <div id="player-total-score">0</div>
                <div id="opponent-total-score">0</div>
                <div id="die-value"></div>
                <div id="current-die"></div>
                <button id="roll-btn"></button>
                <div id="action-hint"></div>
                <div id="winner-title"></div>
                <div id="winner-score"></div>
                <div id="game-over-modal"></div>
                <div id="player-col-score-0">0</div>
                <div id="player-col-score-1">0</div>
                <div id="player-col-score-2">0</div>
                <div id="opp-col-score-0">0</div>
                <div id="opp-col-score-1">0</div>
                <div id="opp-col-score-2">0</div>
            </div>
        `;
        UIManager.init();
    });

    it('should calculate dice SVG correctly', () => {
        const svg = UIManager.getDiceSVG(1);
        expect(svg).toContain('<svg');
        expect(svg).toContain('circle');
        expect(svg).toContain('cx="50"'); // Single dot for value 1
    });

    it('should update total scores in the DOM', () => {
        const game = new MatatenaLogic();
        game.tableroJugador[0] = [3, 3]; // (3*2)*2 = 12
        game.tableroOponente[1] = [5];   // 5
        
        UIManager.actualizarPuntos(game);
        
        expect(document.getElementById('player-total-score').textContent).toBe('12');
        expect(document.getElementById('opponent-total-score').textContent).toBe('5');
    });

    it('should enable/disable roll button based on state', () => {
        // Turn: Player, No die rolled yet
        UIManager.actualizarEstadoDados(0, 'jugador1', 'jugador1', false);
        expect(document.getElementById('roll-btn').disabled).toBe(false);

        // Die already rolled
        UIManager.actualizarEstadoDados(4, 'jugador1', 'jugador1', false);
        expect(document.getElementById('roll-btn').disabled).toBe(true);

        // Not player turn
        UIManager.actualizarEstadoDados(0, 'jugador2', 'jugador1', false);
        expect(document.getElementById('roll-btn').disabled).toBe(true);
    });

    it('should display winner info in modal', () => {
        UIManager.mostrarModalFinal(25, 15);
        expect(document.getElementById('winner-title').textContent).toBe('Victory!');
        expect(document.getElementById('winner-score').textContent).toBe('25 a 15');
    });
});
