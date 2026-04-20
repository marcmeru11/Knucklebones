import { GameStrategy } from './GameStrategy.js?v=4';
import { t } from '../i18n.js?v=4';
import { ScreenManager } from '../ScreenManager.js?v=4';

/**
 * LocalStrategy.js
 * Strategy for Player vs CPU.
 */
export class LocalStrategy extends GameStrategy {
    constructor(game, ui, ai) {
        super(game, ui);
        this.ai = ai;
        this.difficulty = 'easy';
        this.turnoActual = 'jugador1';
    }

    async init(config) {
        this.difficulty = config.difficulty || 'easy';
        this.turnoActual = 'jugador1';
        
        this.game.tableroJugador = [[], [], []];
        this.game.tableroOponente = [[], [], []];
        this.game.dadoActual = 0;

        this.ui.elements.playerNameDisplay.textContent = t('you');
        this.ui.elements.opponentNameDisplay.textContent = `CPU (${t(this.difficulty)})`;
        
        this.ui.renderTableros(this.game);
        this.ui.actualizarPuntos(this.game);
        this.ui.actualizarEstadoDados(0, this.turnoActual, 'jugador1', false);
        this.ui.actualizarIndicadorTurno(null, 'jugador1', true);
        
        ScreenManager.showScreen('game-wrapper');
    }

    async roll() {
        if (this.turnoActual !== 'jugador1' || this.game.dadoActual !== 0) return;
        
        this.game.dadoActual = Math.floor(Math.random() * 6) + 1;
        this.ui.actualizarEstadoDados(this.game.dadoActual, this.turnoActual, 'jugador1', false);
    }

    async place(colIndex) {
        if (this.turnoActual !== 'jugador1' || this.game.dadoActual === 0) return;

        const movValido = this.game.colocarDado(colIndex, true);
        if (movValido) {
            this.turnoActual = 'jugador2';
            this.ui.renderTableros(this.game);
            this.ui.actualizarPuntos(this.game);
            this.ui.actualizarEstadoDados(0, this.turnoActual, 'jugador1', false);
            this.ui.actualizarIndicadorTurno(null, 'jugador1', true);
            
            if (this.checkGameOver()) {
                this.finalizarPartida();
            } else {
                await this.ejecutarTurnoIA();
            }
        }
    }

    async ejecutarTurnoIA() {
        this.ui.actualizarIndicadorTurno(null, 'jugador2', true, true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.game.dadoActual = Math.floor(Math.random() * 6) + 1;
        this.ui.actualizarEstadoDados(this.game.dadoActual, 'jugador2', 'jugador1', false);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const colIdx = this.ai.suggestMove(this.game.tableroJugador, this.game.tableroOponente, this.game.dadoActual, this.difficulty);
        this.game.colocarDado(colIdx, false);
        
        this.turnoActual = 'jugador1';
        this.ui.renderTableros(this.game);
        this.ui.actualizarPuntos(this.game);
        this.ui.actualizarEstadoDados(0, this.turnoActual, 'jugador1', false);
        this.ui.actualizarIndicadorTurno(null, 'jugador1', true);
        
        if (this.checkGameOver()) {
            this.finalizarPartida();
        }
    }

    finalizarPartida() {
        const pJugador = parseInt(this.ui.elements.playerTotalScore.textContent);
        const pOponente = parseInt(this.ui.elements.opponentTotalScore.textContent);
        this.ui.mostrarModalFinal(pJugador, pOponente);
    }

    async restart() {
        this.init({ difficulty: this.difficulty });
    }

    async leave() {
        // Nada específico que limpiar localmente
    }
}
