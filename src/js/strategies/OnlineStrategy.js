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
        const valorDado = Math.floor(Math.random() * 6) + 1;
        await redFirebase.enviarDado(valorDado);
    }

    async place(colIndex) {
        const movValido = this.game.colocarDado(colIndex, true);
        if (movValido) {
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
            // Esto debería disparar un evento para que el controlador salga
            window.dispatchEvent(new CustomEvent('game-exit-requested'));
            return;
        }

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

        if (miRol === 'jugador1') {
            this.game.tableroJugador = parseArrayFB(estado.tablero1);
            this.game.tableroOponente = parseArrayFB(estado.tablero2);
            this.ui.elements.opponentNameDisplay.textContent = dataSala.jugador2 ? dataSala.jugador2.nombre : t('waitingRival');
        } else {
            this.game.tableroJugador = parseArrayFB(estado.tablero2);
            this.game.tableroOponente = parseArrayFB(estado.tablero1);
            this.ui.elements.opponentNameDisplay.textContent = dataSala.jugador1 ? dataSala.jugador1.nombre : t('host');
        }

        this.ui.renderTableros(this.game);
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
