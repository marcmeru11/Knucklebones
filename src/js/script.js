import { redFirebase } from './FirebaseService.js?v=3';
import { setLanguage, t } from './i18n.js?v=3';
import { UIManager } from './UIManager.js?v=3';

const game = new MatatenaLogic();
const ai = new MatatenaAI();
let turnoActual = 'jugador1';
let currentDataSala = null;
let isSinglePlayer = false;
let aiDifficulty = 'easy';

const { elements } = UIManager;

setLanguage('en'); 

elements.langEnBtn.addEventListener('click', () => {
    elements.langEnBtn.classList.add('active');
    elements.langEsBtn.classList.remove('active');
    setLanguage('en');
});

elements.langEsBtn.addEventListener('click', () => {
    elements.langEsBtn.classList.add('active');
    elements.langEnBtn.classList.remove('active');
    setLanguage('es');
});

window.addEventListener('languageChanged', () => {
    if (isSinglePlayer) {
        UIManager.actualizarIndicadorTurno(null, turnoActual, true);
        elements.opponentNameDisplay.textContent = `CPU (${t(aiDifficulty)})`;
        return;
    }

    if (currentDataSala && redFirebase.getRol()) {
        UIManager.actualizarIndicadorTurno(currentDataSala, redFirebase.getRol());
        if (checkGameOver() && !elements.modalOverlay.classList.contains('hidden')) {
            const pJugador = parseInt(elements.playerTotalScore.textContent);
            const pOponente = parseInt(elements.opponentTotalScore.textContent);
            UIManager.mostrarModalFinal(pJugador, pOponente);
        }
        
        if (redFirebase.getRol() === 'jugador1') {
            elements.opponentNameDisplay.textContent = currentDataSala.jugador2 ? currentDataSala.jugador2.nombre : t('waitingRival');
        } else {
            elements.opponentNameDisplay.textContent = currentDataSala.jugador1 ? currentDataSala.jugador1.nombre : t('host');
        }
    }
});

function parseArrayFB(arr) {
    if (!arr) return [[], [], []];
    return [
       Array.isArray(arr[0]) ? arr[0] : [],
       Array.isArray(arr[1]) ? arr[1] : [],
       Array.isArray(arr[2]) ? arr[2] : []
    ];
}

function checkGameOver() {
    let playerSlots = 0, oppSlots = 0;
    for(let i=0; i<3; i++) {
        playerSlots += game.tableroJugador[i].length;
        oppSlots += game.tableroOponente[i].length;
    }
    return (playerSlots === 9 || oppSlots === 9);
}

async function salirAlLobby() {
    if (!isSinglePlayer) {
        await redFirebase.abandonarSala();
    }
    elements.gameWrapper.classList.add('hidden');
    elements.modeSelectionOverlay.classList.remove('hidden');
    elements.lobbyOverlay.classList.add('hidden');
    elements.aiOverlay.classList.add('hidden');
    elements.leaveBtn.classList.add('hidden');
    
    isSinglePlayer = false;
    currentDataSala = null;
    turnoActual = 'jugador1';
    game.dadoActual = 0;
    game.tableroJugador = [[], [], []];
    game.tableroOponente = [[], [], []];
    UIManager.renderTableros(game);
    UIManager.actualizarPuntos(game);
    elements.modalOverlay.classList.add('hidden');
}

elements.leaveBtn.addEventListener('click', async () => {
    await salirAlLobby();
});

function reaccionarCambioServidor(dataSala, miRol) {
    if (isSinglePlayer) return;
    if (!dataSala) {
        alert(t('roomClosedMessage'));
        salirAlLobby();
        return;
    }
    currentDataSala = dataSala;
    const estado = dataSala.estado;
    if(!estado) return;

    turnoActual = estado.turno;
    game.dadoActual = estado.dadoActual || 0;

    if (miRol === 'jugador1') {
        game.tableroJugador = parseArrayFB(estado.tablero1);
        game.tableroOponente = parseArrayFB(estado.tablero2);
        elements.opponentNameDisplay.textContent = dataSala.jugador2 ? dataSala.jugador2.nombre : t('waitingRival');
    } else {
        game.tableroJugador = parseArrayFB(estado.tablero2);
        game.tableroOponente = parseArrayFB(estado.tablero1);
        elements.opponentNameDisplay.textContent = dataSala.jugador1 ? dataSala.jugador1.nombre : t('host');
    }

    UIManager.renderTableros(game);
    UIManager.actualizarPuntos(game);
    UIManager.actualizarIndicadorTurno(dataSala, miRol);

    const faltaRival = !dataSala.jugador1 || !dataSala.jugador2;
    UIManager.actualizarEstadoDados(game.dadoActual, turnoActual, miRol, faltaRival);

    if (checkGameOver() && elements.modalOverlay.classList.contains('hidden')) {
        const pJugador = parseInt(elements.playerTotalScore.textContent);
        const pOponente = parseInt(elements.opponentTotalScore.textContent);
        UIManager.mostrarModalFinal(pJugador, pOponente);
    }
}

async function ejecutarTurnoIA() {
    if (!isSinglePlayer || turnoActual !== 'jugador2') return;

    UIManager.actualizarIndicadorTurno(null, 'jugador2', true, true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 1. Lanzar Dado
    game.dadoActual = Math.floor(Math.random() * 6) + 1;
    UIManager.actualizarEstadoDados(game.dadoActual, 'jugador2', 'jugador1', false);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. IA elige movimiento
    const colIdx = ai.suggestMove(game.tableroJugador, game.tableroOponente, game.dadoActual, aiDifficulty);
    
    // 3. Ejecutar movimiento
    game.colocarDado(colIdx, false); // false = es Oponente
    
    turnoActual = 'jugador1';
    UIManager.renderTableros(game);
    UIManager.actualizarPuntos(game);
    UIManager.actualizarEstadoDados(0, turnoActual, 'jugador1', false);
    UIManager.actualizarIndicadorTurno(null, 'jugador1', true);
    
    if (checkGameOver()) {
        const pJugador = parseInt(elements.playerTotalScore.textContent);
        const pOponente = parseInt(elements.opponentTotalScore.textContent);
        UIManager.mostrarModalFinal(pJugador, pOponente);
    }
}

elements.rollBtn.addEventListener('click', async () => {
    let miRol = isSinglePlayer ? 'jugador1' : redFirebase.getRol();
    if (elements.rollBtn.disabled || turnoActual !== miRol || game.dadoActual !== 0) return;
    
    const valorDado = Math.floor(Math.random() * 6) + 1;
    
    if (isSinglePlayer) {
        game.dadoActual = valorDado;
        UIManager.actualizarEstadoDados(game.dadoActual, turnoActual, 'jugador1', false);
    } else {
        await redFirebase.enviarDado(valorDado);
    }
});

for (let i = 0; i < 3; i++) {
    const playerCol = document.getElementById(`player-col-${i}`);
    playerCol.addEventListener('click', async () => {
        let miRol = isSinglePlayer ? 'jugador1' : redFirebase.getRol();
        if (turnoActual !== miRol || game.dadoActual === 0) return;

        const movValido = game.colocarDado(i, true);
        if (movValido) {
            if (isSinglePlayer) {
                turnoActual = 'jugador2';
                UIManager.renderTableros(game);
                UIManager.actualizarPuntos(game);
                UIManager.actualizarEstadoDados(0, turnoActual, 'jugador1', false);
                UIManager.actualizarIndicadorTurno(null, 'jugador1', true);
                
                if (checkGameOver()) {
                    const pJugador = parseInt(elements.playerTotalScore.textContent);
                    const pOponente = parseInt(elements.opponentTotalScore.textContent);
                    UIManager.mostrarModalFinal(pJugador, pOponente);
                } else {
                    ejecutarTurnoIA();
                }
            } else {
                let nuevoTurno = miRol === 'jugador1' ? 'jugador2' : 'jugador1';
                await redFirebase.enviarMovimiento(game.tableroJugador, game.tableroOponente, nuevoTurno);
            }
        }
    });
}

elements.restartBtn.addEventListener('click', async () => {
    elements.modalOverlay.classList.add('hidden');
    if (isSinglePlayer) {
        game.tableroJugador = [[], [], []];
        game.tableroOponente = [[], [], []];
        game.dadoActual = 0;
        turnoActual = 'jugador1';
        UIManager.renderTableros(game);
        UIManager.actualizarPuntos(game);
        UIManager.actualizarEstadoDados(0, turnoActual, 'jugador1', false);
        UIManager.actualizarIndicadorTurno(null, 'jugador1', true);
    } else {
        await redFirebase.reiniciarSala();
    }
});

elements.loginGithubBtn.addEventListener('click', async () => {
    try {
        await redFirebase.iniciarSesionConGithub();
    } catch(e) {
        console.error("Error al iniciar sesión con GitHub:", e);
        alert("Ocurrió un error.");
    }
});

elements.loginGoogleBtn.addEventListener('click', async () => {
    try {
        await redFirebase.iniciarSesionConGoogle();
    } catch(e) {
        console.error("Error al iniciar sesión con Google:", e);
        alert("Ocurrió un error.");
    }
});

elements.logoutBtn.addEventListener('click', async () => {
    try {
        if (!elements.gameWrapper.classList.contains('hidden')) {
            await redFirebase.abandonarSala();
        }
        await redFirebase.cerrarSesion();
        window.location.reload();
    } catch(e) {
        console.error("Error al cerrar sesión:", e);
    }
});

elements.createRoomBtn.addEventListener('click', async () => {
    try {
        const code = elements.roomInput.value.trim();
        if(!code) return alert(t('errorRoomCode'));
        
        elements.createRoomBtn.innerHTML = `<span class="roll-btn-text">${t('loading')}</span>`;
        
        await redFirebase.crearSala(code, elements.playerNameDisplay.textContent);
        
        elements.createRoomBtn.innerHTML = `<span class="roll-btn-text">${t('createRoom')}</span><span class="roll-btn-shine"></span>`;
        elements.lobbyOverlay.classList.add('hidden');
        elements.gameWrapper.classList.remove('hidden');
        elements.leaveBtn.classList.remove('hidden');
        
        redFirebase.escucharCambiosSala(reaccionarCambioServidor);
    } catch (error) {
        elements.createRoomBtn.innerHTML = `<span class="roll-btn-text">${t('createRoom')}</span><span class="roll-btn-shine"></span>`;
        console.error(error);
        alert(t('errorFirebase') + error.message);
    }
});

elements.joinRoomBtn.addEventListener('click', async () => {
    try {
        const code = elements.roomInput.value.trim();
        if(!code) return alert(t('errorRoomCode'));
        
        elements.joinRoomBtn.innerHTML = `<span class="roll-btn-text">${t('loading')}</span>`;
        
        await redFirebase.unirseASala(code, elements.playerNameDisplay.textContent);
        
        elements.joinRoomBtn.innerHTML = `<span class="roll-btn-text">${t('joinRoom')}</span><span class="roll-btn-shine"></span>`;
        elements.lobbyOverlay.classList.add('hidden');
        elements.gameWrapper.classList.remove('hidden');
        elements.leaveBtn.classList.remove('hidden');
        
        redFirebase.escucharCambiosSala(reaccionarCambioServidor);
    } catch (error) {
        elements.joinRoomBtn.innerHTML = `<span class="roll-btn-text">${t('joinRoom')}</span><span class="roll-btn-shine"></span>`;
        console.error(error);
        alert(t('errorFirebase') + error.message);
    }
});

// --- SINGLE PLAYER / AI ---
elements.difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        elements.difficultyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        aiDifficulty = btn.getAttribute('data-difficulty');
    });
});

elements.startSinglePlayerBtn.addEventListener('click', () => {
    isSinglePlayer = true;
    elements.aiOverlay.classList.add('hidden');
    elements.gameWrapper.classList.remove('hidden');
    elements.leaveBtn.classList.remove('hidden');
    
    elements.playerNameDisplay.textContent = t('you');
    elements.opponentNameDisplay.textContent = `CPU (${t(aiDifficulty)})`;
    
    turnoActual = 'jugador1';
    game.tableroJugador = [[], [], []];
    game.tableroOponente = [[], [], []];
    game.dadoActual = 0;
    UIManager.renderTableros(game);
    UIManager.actualizarPuntos(game);
    UIManager.actualizarEstadoDados(0, turnoActual, 'jugador1', false);
    UIManager.actualizarIndicadorTurno(null, 'jugador1', true);
});

// --- NAVIGATION ---
elements.modeOnlineBtn.addEventListener('click', () => {
    elements.modeSelectionOverlay.classList.add('hidden');
    elements.lobbyOverlay.classList.remove('hidden');
});

elements.modeCpuBtn.addEventListener('click', () => {
    elements.modeSelectionOverlay.classList.add('hidden');
    elements.aiOverlay.classList.remove('hidden');
});

elements.lobbyBackBtn.addEventListener('click', () => {
    elements.lobbyOverlay.classList.add('hidden');
    elements.modeSelectionOverlay.classList.remove('hidden');
});

elements.aiBackBtn.addEventListener('click', () => {
    elements.aiOverlay.classList.add('hidden');
    elements.modeSelectionOverlay.classList.remove('hidden');
});

window.addEventListener('keydown', async (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if (elements.gameWrapper.classList.contains('hidden')) return;

    let miRol = isSinglePlayer ? 'jugador1' : redFirebase.getRol();
    
    if (e.code === 'Space') {
        if (elements.rollBtn.disabled || turnoActual !== miRol || game.dadoActual !== 0) return;
        e.preventDefault();
        
        const valorDado = Math.floor(Math.random() * 6) + 1;
        if (isSinglePlayer) {
            game.dadoActual = valorDado;
            UIManager.actualizarEstadoDados(game.dadoActual, turnoActual, 'jugador1', false);
        } else {
            await redFirebase.enviarDado(valorDado);
        }
    }
    
    if (['1', '2', '3'].includes(e.key)) {
        if (turnoActual !== miRol || game.dadoActual === 0) return;
        
        const colIndex = parseInt(e.key) - 1;
        const movValido = game.colocarDado(colIndex, true);
        if (movValido) {
            if (isSinglePlayer) {
                turnoActual = 'jugador2';
                UIManager.renderTableros(game);
                UIManager.actualizarPuntos(game);
                UIManager.actualizarEstadoDados(0, turnoActual, 'jugador1', false);
                UIManager.actualizarIndicadorTurno(null, 'jugador1', true);
                
                if (checkGameOver()) {
                    const pJugador = parseInt(elements.playerTotalScore.textContent);
                    const pOponente = parseInt(elements.opponentTotalScore.textContent);
                    UIManager.mostrarModalFinal(pJugador, pOponente);
                } else {
                    ejecutarTurnoIA();
                }
            } else {
                const nuevoTurno = miRol === 'jugador1' ? 'jugador2' : 'jugador1';
                await redFirebase.enviarMovimiento(game.tableroJugador, game.tableroOponente, nuevoTurno);
            }
        }
    }
});

redFirebase.observarEstadoSesion(async (user) => {
    if (user) {
        const shortName = user.displayName || user.email || 'Player';
        elements.playerNameDisplay.textContent = shortName;
        elements.loggedUserName.textContent = shortName;
        
        elements.loginOverlay.classList.add('hidden');
        elements.topNav.classList.remove('hidden');
        
        redFirebase.limpiarSalasInactivas();
        
        const salaIdActual = await redFirebase.checkActiveSession();
        if (salaIdActual && !isSinglePlayer) {
            try {
                await redFirebase.unirseASala(salaIdActual, shortName);
                elements.modeSelectionOverlay.classList.add('hidden');
                elements.lobbyOverlay.classList.add('hidden');
                elements.aiOverlay.classList.add('hidden');
                elements.gameWrapper.classList.remove('hidden');
                elements.leaveBtn.classList.remove('hidden');
                redFirebase.escucharCambiosSala(reaccionarCambioServidor);
            } catch (error) {
                console.error("Room missing or expired", error);
                await redFirebase.clearActiveSession();
                elements.modeSelectionOverlay.classList.remove('hidden');
                elements.lobbyOverlay.classList.add('hidden');
                elements.aiOverlay.classList.add('hidden');
                elements.gameWrapper.classList.add('hidden');
                elements.leaveBtn.classList.add('hidden');
            }
        } else if (!isSinglePlayer) {
            elements.modeSelectionOverlay.classList.remove('hidden');
            elements.lobbyOverlay.classList.add('hidden');
            elements.aiOverlay.classList.add('hidden');
            elements.gameWrapper.classList.add('hidden');
            elements.leaveBtn.classList.add('hidden');
        }
    } else {
        elements.loginOverlay.classList.remove('hidden');
        elements.topNav.classList.add('hidden');
        elements.modeSelectionOverlay.classList.add('hidden');
        elements.lobbyOverlay.classList.add('hidden');
        elements.aiOverlay.classList.add('hidden');
        elements.gameWrapper.classList.add('hidden');
        elements.leaveBtn.classList.add('hidden');
    }
});
