import { t } from './i18n.js?v=5';
import { ScreenManager } from './ScreenManager.js?v=5';

export const UIManager = {
    // --- ELEMENTOS DOM ---
    elements: {},

    /**
     * Initializes DOM references AFTER the DOM is ready.
     */
    init() {
        console.log("UIManager: Initializing elements...");
        this.elements = {
            rollBtn: document.getElementById('roll-btn'),
            dieValueSpan: document.getElementById('die-value'),
            currentDieContainer: document.getElementById('current-die'),
            opponentTotalScore: document.getElementById('opponent-total-score'),
            playerTotalScore: document.getElementById('player-total-score'),
            hintText: document.getElementById('action-hint'),
            modalOverlay: document.getElementById('game-over-modal'),
            winnerTitle: document.getElementById('winner-title'),
            winnerScoreText: document.getElementById('winner-score'),
            restartBtn: document.getElementById('restart-btn'),
            loginOverlay: document.getElementById('login-overlay'),
            loginGithubBtn: document.getElementById('login-github-btn'),
            loginGoogleBtn: document.getElementById('login-google-btn'),
            lobbyOverlay: document.getElementById('lobby-overlay'),
            topNav: document.getElementById('top-nav'),
            loggedUserName: document.getElementById('logged-user-name'),
            logoutBtn: document.getElementById('logout-btn'),
            leaveBtn: document.getElementById('leave-btn'),
            roomInput: document.getElementById('room-input'),
            createRoomBtn: document.getElementById('create-room-btn'),
            joinRoomBtn: document.getElementById('join-room-btn'),
            gameWrapper: document.getElementById('game-wrapper'),
            playerNameDisplay: document.getElementById('player-name-display'),
            opponentNameDisplay: document.querySelector('.opponent-zone .player-name'),
            langEnBtn: document.getElementById('lang-en'),
            langEsBtn: document.getElementById('lang-es'),
            startSinglePlayerBtn: document.getElementById('start-single-player-btn'),
            difficultyBtns: document.querySelectorAll('.difficulty-btn'),
            modeSelectionOverlay: document.getElementById('mode-selection-overlay'),
            modeOnlineBtn: document.getElementById('mode-online-btn'),
            modeCpuBtn: document.getElementById('mode-cpu-btn'),
            modeLocalPvpBtn: document.getElementById('mode-pvp-local-btn'),
            aiOverlay: document.getElementById('ai-overlay'),
            lobbyBackBtn: document.getElementById('lobby-back-btn'),
            aiBackBtn: document.getElementById('ai-back-btn')
        };

        // Verification
        Object.entries(this.elements).forEach(([key, el]) => {
            if (!el && key !== 'difficultyBtns') { // difficultyBtns is a NodeList
                console.warn(`UIManager: Element not found -> ${key}`);
            }
        });
    },

    getDiceSVG(valor) {
        if (!valor || valor < 1 || valor > 6) return '';
        const dotRadius = 12;
        const offset1 = 20;
        const offset2 = 50;
        const offset3 = 80;
        
        const dots = {
            1: [{cx: offset2, cy: offset2, r: 18}],
            2: [{cx: offset1, cy: offset1}, {cx: offset3, cy: offset3}],
            3: [{cx: offset1, cy: offset1}, {cx: offset2, cy: offset2}, {cx: offset3, cy: offset3}],
            4: [{cx: offset1, cy: offset1}, {cx: offset3, cy: offset1}, {cx: offset1, cy: offset3}, {cx: offset3, cy: offset3}],
            5: [{cx: offset1, cy: offset1}, {cx: offset3, cy: offset1}, {cx: offset2, cy: offset2}, {cx: offset1, cy: offset3}, {cx: offset3, cy: offset3}],
            6: [{cx: offset1, cy: offset1}, {cx: offset1, cy: offset2}, {cx: offset1, cy: offset3}, {cx: offset3, cy: offset1}, {cx: offset3, cy: offset2}, {cx: offset3, cy: offset3}]
        };
        
        let dotsSVG = '';
        dots[valor].forEach(dot => {
            dotsSVG += `<circle cx="${dot.cx}" cy="${dot.cy}" r="${dot.r || dotRadius}" fill="currentColor" />`;
        });
        
        return `
          <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; display: block;" xmlns="http://www.w3.org/2000/svg">
            ${dotsSVG}
          </svg>
        `;
    },

    renderTableros(game) {
        const { getDiceSVG } = this;
        
        game.tableroJugador.forEach((columna, colIndex) => {
            const slots = document.querySelectorAll(`#player-col-${colIndex} .dice-slot`);
            slots.forEach(slot => { slot.innerHTML = ''; slot.classList.remove('filled', 'pop'); slot.style.borderColor = ''; slot.style.boxShadow = ''; });
            
            const conteo = {};
            columna.forEach(d => conteo[d] = (conteo[d] || 0) + 1);

            columna.forEach((dado, rowIndex) => {
                if (slots[rowIndex]) {
                    const cantidad = conteo[dado];
                    slots[rowIndex].innerHTML = getDiceSVG(dado);
                    slots[rowIndex].classList.add('filled', 'pop');
                    
                    if (cantidad === 3) {
                        slots[rowIndex].style.color = 'var(--clr-accent)';
                        slots[rowIndex].style.borderColor = 'var(--clr-accent)';
                    } else if (cantidad === 2) {
                        slots[rowIndex].style.color = '#ffffff';
                        slots[rowIndex].style.borderColor = '#ffffff';
                    } else {
                        slots[rowIndex].style.color = 'var(--clr-player)';
                        slots[rowIndex].style.borderColor = 'var(--clr-player)';
                    }
                }
            });
        });

        game.tableroOponente.forEach((columna, colIndex) => {
            const slots = document.querySelectorAll(`#opp-col-${colIndex} .dice-slot`);
            slots.forEach(slot => { slot.innerHTML = ''; slot.classList.remove('filled', 'pop'); slot.style.borderColor = ''; slot.style.boxShadow = ''; });
            
            const conteo = {};
            columna.forEach(d => conteo[d] = (conteo[d] || 0) + 1);

            columna.forEach((dado, rowIndex) => {
                if (slots[rowIndex]) {
                    const cantidad = conteo[dado];
                    slots[rowIndex].innerHTML = getDiceSVG(dado);
                    slots[rowIndex].classList.add('filled', 'pop');
                    
                    if (cantidad === 3) {
                        slots[rowIndex].style.color = 'var(--clr-accent)';
                        slots[rowIndex].style.borderColor = 'var(--clr-accent)';
                    } else if (cantidad === 2) {
                        slots[rowIndex].style.color = '#ffffff';
                        slots[rowIndex].style.borderColor = '#ffffff';
                    } else {
                        slots[rowIndex].style.color = '#d45b5b';
                        slots[rowIndex].style.borderColor = '#d45b5b';
                    }
                }
            });
        });
    },

    actualizarPuntos(game) {
        let ptosTotalesJugador = 0, ptosTotalesOponente = 0;
        for (let i = 0; i < 3; i++) {
            const ptosJugador = game.calcularPuntosColumna(game.tableroJugador[i]);
            document.getElementById(`player-col-score-${i}`).textContent = ptosJugador;
            ptosTotalesJugador += ptosJugador;

            const ptosOponente = game.calcularPuntosColumna(game.tableroOponente[i]);
            document.getElementById(`opp-col-score-${i}`).textContent = ptosOponente;
            ptosTotalesOponente += ptosOponente;
        }
        this.elements.playerTotalScore.textContent = ptosTotalesJugador;
        this.elements.opponentTotalScore.textContent = ptosTotalesOponente;
    },

    actualizarIndicadorTurno(dataSala, miRol, isLocal = false, isCpuThinking = false, isPvpLocal = false) {
        const { hintText } = this.elements;
        const rollBtnText = document.querySelector('.roll-btn-text');

        if (isLocal) {
            if (isPvpLocal) {
                const pName = (miRol === 'jugador1') ? t('player1') : t('player2');
                const pColor = (miRol === 'jugador1') ? 'var(--clr-player)' : '#8f5bd4';
                hintText.innerHTML = `${t('turnOpponent')}<strong style="color: ${pColor}">${pName.toUpperCase()}</strong>`;
                rollBtnText.textContent = `${t('rollBtn')} (${pName.toUpperCase()})`;
                return;
            }

            if (isCpuThinking) {
                hintText.innerHTML = `<strong style="color: #d45b5b">${t('cpuThinking')}</strong>`;
                rollBtnText.textContent = t('rollWait');
                return;
            }

            if (miRol === 'jugador1') {
                hintText.innerHTML = `<strong style="color: var(--clr-player)">${t('turnYou')}</strong>`;
                rollBtnText.textContent = t('rollYou');
            } else {
                hintText.innerHTML = `<strong style="color: #d45b5b">${t('cpuTurn')}</strong>`;
                rollBtnText.textContent = t('rollWait');
            }
            return;
        }

        if (!dataSala || !dataSala.estado) return;
        const turnoServer = dataSala.estado.turno;
        
        const faltaRival = !dataSala.jugador1 || !dataSala.jugador2;
        if (faltaRival) {
            hintText.innerHTML = `<strong style="color: var(--clr-text-muted)">${t('statusWaiting')}</strong>`;
            rollBtnText.textContent = t('rollWaiting');
            return;
        }
        
        const nombreJ1 = dataSala.jugador1 ? dataSala.jugador1.nombre.split(' ')[0] : 'J1';
        const nombreJ2 = dataSala.jugador2 ? dataSala.jugador2.nombre.split(' ')[0] : 'J2';

        if (turnoServer === miRol) {
            hintText.innerHTML = `<strong style="color: var(--clr-player)">${t('turnYou')}</strong>`;
            rollBtnText.textContent = t('rollYou');
        } else {
            const nombreRival = miRol === 'jugador1' ? nombreJ2 : nombreJ1;
            hintText.innerHTML = `${t('turnOpponent')}<strong style="color: #d45b5b">${nombreRival.toUpperCase()}</strong>`;
            rollBtnText.textContent = t('rollWait');
        }
    },

    mostrarModalFinal(puntosJugador, puntosOponente) {
        const { winnerTitle, winnerScoreText, modalOverlay } = this.elements;
        
        winnerTitle.className = 'winner-title';
        if (puntosJugador > puntosOponente) {
            winnerTitle.textContent = t('victory'); winnerTitle.classList.add('win');
        } else if (puntosOponente > puntosJugador) {
            winnerTitle.textContent = t('lost'); winnerTitle.classList.add('lose');
        } else {
            winnerTitle.textContent = t('tie'); winnerTitle.classList.add('tie');
        }
        
        winnerScoreText.textContent = `${puntosJugador} a ${puntosOponente}`;
        ScreenManager.showScreen('game-over-modal');
    },

    actualizarEstadoDados(dadoActual, turnoActual, miRol, faltaRival) {
        const { dieValueSpan, currentDieContainer, rollBtn } = this.elements;
        if (dadoActual === 0) {
            dieValueSpan.innerHTML = '';
            currentDieContainer.classList.remove('has-value');
            dieValueSpan.style.color = '';
            currentDieContainer.style.borderColor = '';
            rollBtn.disabled = (turnoActual !== miRol) || faltaRival;
        } else {
            dieValueSpan.innerHTML = this.getDiceSVG(dadoActual);
            currentDieContainer.classList.add('has-value');
            rollBtn.disabled = true;
            
            if (turnoActual === miRol) {
                dieValueSpan.style.color = 'var(--clr-player)'; currentDieContainer.style.borderColor = 'var(--clr-player)';
            } else {
                dieValueSpan.style.color = '#d45b5b'; currentDieContainer.style.borderColor = '#d45b5b';
            }
        }
    }
};
