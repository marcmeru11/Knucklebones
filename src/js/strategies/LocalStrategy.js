import { GameStrategy } from './GameStrategy.js?v=5';
import { t } from '../i18n.js?v=5';
import { ScreenManager } from '../ScreenManager.js?v=5';

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

        this.emit('gameStart', {
            p1Name: t('you'),
            p2Name: `CPU (${t(this.difficulty)})`
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
    }

    async roll() {
        if (this.turnoActual !== 'jugador1' || this.game.dadoActual !== 0) return;
        
        this.emit('diceRollStart', null);
        
        // Wait for potential UI animation if needed, or handle it via mediator
        // To be agile, we handle the callback in the mediator
        this.emit('requestRollAnimation', (finalValue) => {
            this.game.dadoActual = Math.floor(Math.random() * 6) + 1;
            this.sync();
        });
    }

    async place(colIndex) {
        if (this.turnoActual !== 'jugador1' || this.game.dadoActual === 0) return;

        const diceValue = this.game.dadoActual;
        const res = this.game.colocarDado(colIndex, true);
        
        if (res && res.success) {
            this.emit('dicePlaced', { colIndex, esJugador: true, diceValue, res });
            
            this.turnoActual = 'jugador2';
            this.sync();
            
            if (this.checkGameOver()) {
                this.finalizarPartida();
            } else {
                await this.ejecutarTurnoIA();
            }
        }
    }

    async ejecutarTurnoIA() {
        this.emit('turnChanged', { turn: 'jugador2', isCpuThinking: true });
        await new Promise(resolve => setTimeout(resolve, 600));
        
        this.emit('requestRollAnimation', () => {
            this.game.dadoActual = Math.floor(Math.random() * 6) + 1;
            this.sync();
            
            setTimeout(async () => {
                const colIdx = this.ai.suggestMove(this.game.tableroJugador, this.game.tableroOponente, this.game.dadoActual, this.difficulty);
                const diceValueIA = this.game.dadoActual;
                const resIA = this.game.colocarDado(colIdx, false);
                
                if (resIA && resIA.success) {
                    this.emit('dicePlaced', { colIndex: colIdx, esJugador: false, diceValue: diceValueIA, res: resIA });
                    this.turnoActual = 'jugador1';
                    this.sync();
                    
                    if (this.checkGameOver()) {
                        this.finalizarPartida();
                    }
                }
            }, 800);
        });
    }

    finalizarPartida() {
        this.emit('gameOver', {
            p1Score: this.game.calcularPuntosColumna(this.game.tableroJugador[0]) + this.game.calcularPuntosColumna(this.game.tableroJugador[1]) + this.game.calcularPuntosColumna(this.game.tableroJugador[2]),
            p2Score: this.game.calcularPuntosColumna(this.game.tableroOponente[0]) + this.game.calcularPuntosColumna(this.game.tableroOponente[1]) + this.game.calcularPuntosColumna(this.game.tableroOponente[2])
        });
    }


    async restart() {
        this.init({ difficulty: this.difficulty });
    }

    async leave() {
        // Nada específico que limpiar localmente
    }
}
