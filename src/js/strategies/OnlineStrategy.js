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
        
        this.ui.playRollAnimation(async () => {
            const valorDado = Math.floor(Math.random() * 6) + 1;
            await redFirebase.enviarDado(valorDado);
        });
    }

    async place(colIndex) {
        const diceValue = this.game.dadoActual;
        const res = this.game.colocarDado(colIndex, true);
        if (res && res.success) {
            if (res.destroyedCount > 0) {
                await this.ui.animateElimination(colIndex, true, diceValue);
            }
            if (res.destroyedCount === 3) this.ui.shakeScreen();
            
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
            this.ui.elements.opponentNameDisplay.textContent = dataSala.jugador2 ? dataSala.jugador2.nombre : t('waitingRival');
        } else {
            newTablero1 = parseArrayFB(estado.tablero2);
            newTablero2 = parseArrayFB(estado.tablero1);
            this.ui.elements.opponentNameDisplay.textContent = dataSala.jugador1 ? dataSala.jugador1.nombre : t('host');
        }

        // Detect massive elimination from server update (for the passive player)
        let massiveElimination = false;
        for (let i = 0; i < 3; i++) {
            const diff1 = (oldTablero1[i]?.length || 0) - (newTablero1[i]?.length || 0);
            const diff2 = (oldTablero2[i]?.length || 0) - (newTablero2[i]?.length || 0);
            if (diff1 >= 3 || diff2 >= 3) massiveElimination = true;
        }
        if (massiveElimination) this.ui.shakeScreen();

        // Identify last move to highlight it (only if it's NOT our turn, i.e., opponent just played)
        let lastMove = null;
        if (turnoActual === miRol) {
            // It's our turn now, so the last move was by the opponent
            for (let i = 0; i < 3; i++) {
                if (newTablero2[i].length > (oldTablero2[i]?.length || 0)) {
                    lastMove = { colIndex: i, esJugador: false };
                    break;
                }
            }
        }

        this.game.tableroJugador = newTablero1;
        this.game.tableroOponente = newTablero2;

        this.ui.renderTableros(this.game, lastMove);
        this.ui.actualizarPuntos(this.game);
        this.ui.actualizarIndicadorTurno(dataSala, miRol);

        const faltaRival = !dataSala.jugador1 || !dataSala.jugador2;
        this.ui.actualizarEstadoDados(this.game.dadoActual, turnoActual, miRol, faltaRival);

        if (this.checkGameOver() && this.ui.elements.modalOverlay.classList.contains('hidden')) {
            const pJugador = parseInt(this.ui.elements.playerTotalScore.textContent);
            const pOponente = parseInt(this.ui.elements.opponentTotalScore.textContent);
            this.ui.mostrarModalFinal(pJugador, pOponente);
        }
    }
}


