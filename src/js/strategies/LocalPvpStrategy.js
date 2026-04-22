import { GameStrategy } from './GameStrategy.js?v=5';
import { t } from '../utils/i18n.js?v=5';
import { ScreenManager } from '../ui/ScreenManager.js?v=5';

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

        this.emit('gameStart', {
            p1Name: t('player1'),
            p2Name: t('player2')
        });
        
        this.sync();
        ScreenManager.showScreen('game-wrapper');
    }

    sync() {
        this.emit('stateUpdated', {
            game: this.game,
            turnoActual: this.turnoActual,
            miRol: 'jugador1'
        });
        this.emit('turnChanged', { 
            turn: this.turnoActual, 
            isPvpLocal: true 
        });
    }

    async roll() {
        if (this.game.dadoActual !== 0) return;
        
        this.emit('requestRollAnimation', () => {
            this.game.dadoActual = Math.floor(Math.random() * 6) + 1;
            this.sync();
        });
    }

    async place(colIndex) {
        if (this.game.dadoActual === 0) return;

        const isPlayer1 = this.turnoActual === 'jugador1';
        const diceValue = this.game.dadoActual;
        const res = this.game.colocarDado(colIndex, isPlayer1);
        
        if (res && res.success) {
            this.emit('dicePlaced', { colIndex, esJugador: isPlayer1, diceValue, res });

            this.turnoActual = (this.turnoActual === 'jugador1') ? 'jugador2' : 'jugador1';
            this.sync();
            
            if (this.checkGameOver()) {
                this.finalizarPartida();
            }
        }
    }

    finalizarPartida() {
        const p1Score = this.game.calcularPuntosColumna(this.game.tableroJugador[0]) + this.game.calcularPuntosColumna(this.game.tableroJugador[1]) + this.game.calcularPuntosColumna(this.game.tableroJugador[2]);
        const p2Score = this.game.calcularPuntosColumna(this.game.tableroOponente[0]) + this.game.calcularPuntosColumna(this.game.tableroOponente[1]) + this.game.calcularPuntosColumna(this.game.tableroOponente[2]);
        
        this.emit('gameOver', { p1Score, p2Score, isPvpLocal: true });
    }


    async restart() {
        this.init({});
    }

    async leave() {
        // Nothing to clean up
    }
}
