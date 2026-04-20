import { GameStrategy } from './GameStrategy.js?v=5';
import { t } from '../i18n.js?v=5';
import { ScreenManager } from '../ScreenManager.js?v=5';

/**
 * LocalPvpStrategy.js
 * Strategy for Player vs Player on the same device.
 */
export class LocalPvpStrategy extends GameStrategy {
    constructor(game, ui) {
        super(game, ui);
        this.turnoActual = 'jugador1';
    }

    async init(config) {
        this.turnoActual = 'jugador1';
        
        this.game.tableroJugador = [[], [], []];
        this.game.tableroOponente = [[], [], []];
        this.game.dadoActual = 0;

        // In Local PVP, Player 1 is Bottom (you), Player 2 is Top (opponent)
        this.ui.elements.playerNameDisplay.textContent = t('player1');
        this.ui.elements.opponentNameDisplay.textContent = t('player2');
        
        this.ui.renderTableros(this.game);
        this.ui.actualizarPuntos(this.game);
        this.ui.actualizarEstadoDados(0, this.turnoActual, 'jugador1', false);
        this.ui.actualizarIndicadorTurno(null, this.turnoActual, true, false, true);
        
        ScreenManager.showScreen('game-wrapper');
    }

    async roll() {
        // Any of the two players can roll if it's their turn and no die is active
        if (this.game.dadoActual !== 0) return;
        
        this.ui.playRollAnimation(() => {
            this.game.dadoActual = Math.floor(Math.random() * 6) + 1;
            this.ui.actualizarEstadoDados(this.game.dadoActual, this.turnoActual, 'jugador1', false);
            this.ui.actualizarIndicadorTurno(null, this.turnoActual, true, false, true);
        });
    }

    async place(colIndex) {
        if (this.game.dadoActual === 0) return;

        const isPlayer1 = this.turnoActual === 'jugador1';
        const diceValue = this.game.dadoActual;
        const res = this.game.colocarDado(colIndex, isPlayer1);
        
        if (res && res.success) {
            if (res.destroyedCount > 0) {
                await this.ui.animateElimination(colIndex, isPlayer1, diceValue);
            }
            if (res.destroyedCount === 3) this.ui.shakeScreen();

            // Switch turn
            this.turnoActual = (this.turnoActual === 'jugador1') ? 'jugador2' : 'jugador1';
            
            this.ui.renderTableros(this.game, { colIndex, esJugador: isPlayer1 });
            this.ui.actualizarPuntos(this.game);
            this.ui.actualizarEstadoDados(0, this.turnoActual, 'jugador1', false);
            this.ui.actualizarIndicadorTurno(null, this.turnoActual, true, false, true);
            
            if (this.checkGameOver()) {
                this.finalizarPartida();
            }
        }
    }



    finalizarPartida() {
        const p1Score = parseInt(this.ui.elements.playerTotalScore.textContent);
        const p2Score = parseInt(this.ui.elements.opponentTotalScore.textContent);
        
        // We override the modal titles slightly to be more generic for PVP
        if (p1Score > p2Score) {
            this.ui.elements.winnerTitle.textContent = `${t('player1')} ${t('victory')}`;
        } else if (p2Score > p1Score) {
            this.ui.elements.winnerTitle.textContent = `${t('player2')} ${t('victory')}`;
        } else {
            this.ui.elements.winnerTitle.textContent = t('tie');
        }
        
        this.ui.elements.winnerScoreText.textContent = `${p1Score} - ${p2Score}`;
        this.ui.elements.modalOverlay.classList.remove('hidden');
    }

    async restart() {
        this.init({});
    }

    async leave() {
        // Nothing to clean up
    }
}
