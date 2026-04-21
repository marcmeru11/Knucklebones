import { GameStrategy } from './GameStrategy.js?v=5';
import { redFirebase } from '../FirebaseService.js?v=5';
import { t } from '../i18n.js?v=5';
import { ScreenManager } from '../ScreenManager.js?v=5';

/**
 * OnlineStrategy.js
 * Strategy for Firebase Multiplayer.
 */
export class OnlineStrategy extends GameStrategy {
    constructor(game, ui) {
        super(game, ui);
        this.currentDataSala = null;
        this.miRol = null;
    }

    async init(config) {
        // En modo online, el init suele ocurrir tras unirse a una sala
        this.miRol = redFirebase.getRol();
        ScreenManager.showScreen('game-wrapper');
        
        redFirebase.escucharCambiosSala((data, rol) => this.handleServerUpdate(data, rol));
    }

    async roll() {
        if (this.ui.elements.rollBtn.disabled) return;
        
        this.emit('requestRollAnimation', async () => {
            const valorDado = Math.floor(Math.random() * 6) + 1;
            await redFirebase.enviarDado(valorDado);
        });
    }

    async place(colIndex) {
        const diceValue = this.game.dadoActual;
        const res = this.game.colocarDado(colIndex, true);
        if (res && res.success) {
            this.emit('dicePlaced', { colIndex, esJugador: true, diceValue, res });
            
            const nuevoTurno = this.miRol === 'jugador1' ? 'jugador2' : 'jugador1';
            await redFirebase.enviarMovimiento(this.game.tableroJugador, this.game.tableroOponente, nuevoTurno);
        }
    }

    async restart() {
        await redFirebase.reiniciarSala();
    }

    async leave() {
        await redFirebase.abandonarSala();
    }

    handleServerUpdate(dataSala, miRol) {
        if (!dataSala) {
            alert(t('roomClosedMessage'));
            window.dispatchEvent(new CustomEvent('game-exit-requested'));
            return;
        }

        const oldTablero1 = this.game.tableroJugador;
        const oldTablero2 = this.game.tableroOponente;

        this.currentDataSala = dataSala;
        this.miRol = miRol;
        const estado = dataSala.estado;
        if (!estado) return;

        const turnoActual = estado.turno;
        this.game.dadoActual = estado.dadoActual || 0;

        const parseArrayFB = (arr) => {
            if (!arr) return [[], [], []];
            return [Array.isArray(arr[0]) ? arr[0] : [], Array.isArray(arr[1]) ? arr[1] : [], Array.isArray(arr[2]) ? arr[2] : []];
        };

        let newTablero1, newTablero2;
        if (miRol === 'jugador1') {
            newTablero1 = parseArrayFB(estado.tablero1);
            newTablero2 = parseArrayFB(estado.tablero2);
            const name = dataSala.jugador2 ? dataSala.jugador2.nombre : t('waitingRival');
            this.emit('gameStart', { p1Name: dataSala.jugador1.nombre, p2Name: name });
        } else {
            newTablero1 = parseArrayFB(estado.tablero2);
            newTablero2 = parseArrayFB(estado.tablero1);
            const name = dataSala.jugador1 ? dataSala.jugador1.nombre : t('host');
            this.emit('gameStart', { p1Name: dataSala.jugador2.nombre, p2Name: name });
        }

        // Detect massive elimination (only if not a reset)
        const isReset = newTablero1.every(col => col.length === 0) && newTablero2.every(col => col.length === 0);
        let massiveElimination = false;
        
        if (!isReset) {
            for (let i = 0; i < 3; i++) {
                const diff1 = (oldTablero1[i]?.length || 0) - (newTablero1[i]?.length || 0);
                const diff2 = (oldTablero2[i]?.length || 0) - (newTablero2[i]?.length || 0);
                if (diff1 >= 3 || diff2 >= 3) massiveElimination = true;
            }
        }
        if (massiveElimination) this.emit('shakeRequest', null);

        // Identify last move
        let lastMove = null;
        if (turnoActual === miRol) {
            for (let i = 0; i < 3; i++) {
                if (newTablero2[i].length > (oldTablero2[i]?.length || 0)) {
                    lastMove = { colIndex: i, esJugador: false };
                    break;
                }
            }
        }

        this.game.tableroJugador = newTablero1;
        this.game.tableroOponente = newTablero2;

        this.emit('stateUpdated', {
            game: this.game,
            turnoActual: turnoActual,
            miRol: miRol,
            lastMove: lastMove,
            dataSala: dataSala
        });

        if (this.checkGameOver()) {
            const p1Score = this.game.calcularPuntosColumna(this.game.tableroJugador[0]) + this.game.calcularPuntosColumna(this.game.tableroJugador[1]) + this.game.calcularPuntosColumna(this.game.tableroJugador[2]);
            const p2Score = this.game.calcularPuntosColumna(this.game.tableroOponente[0]) + this.game.calcularPuntosColumna(this.game.tableroOponente[1]) + this.game.calcularPuntosColumna(this.game.tableroOponente[2]);
            this.emit('gameOver', { p1Score, p2Score });
        } else {
            // Si la partida no ha terminado, asegúrate de ocultar cualquier modal (como el de Game Over)
            // Esto permite que el reinicio de la sala se refleje en ambos jugadores
            ScreenManager.showScreen('game-wrapper');
        }
    }
}


