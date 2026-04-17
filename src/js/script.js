import { redFirebase } from './FirebaseService.js';
import { setLanguage, t } from './i18n.js';

const game = new MatatenaLogic();
let turnoActual = 'jugador1';

// --- ELEMENTOS DOM ---
const rollBtn = document.getElementById('roll-btn');
const dieValueSpan = document.getElementById('die-value');
const currentDieContainer = document.getElementById('current-die');
const opponentTotalScore = document.getElementById('opponent-total-score');
const playerTotalScore = document.getElementById('player-total-score');
const hintText = document.getElementById('action-hint');

const modalOverlay = document.getElementById('game-over-modal');
const winnerTitle = document.getElementById('winner-title');
const winnerScoreText = document.getElementById('winner-score');
const restartBtn = document.getElementById('restart-btn');

const loginOverlay = document.getElementById('login-overlay');
const loginGithubBtn = document.getElementById('login-github-btn');
const loginGoogleBtn = document.getElementById('login-google-btn');
const lobbyOverlay = document.getElementById('lobby-overlay');
const topNav = document.getElementById('top-nav');
const loggedUserName = document.getElementById('logged-user-name');
const logoutBtn = document.getElementById('logout-btn');
const roomInput = document.getElementById('room-input');
const createRoomBtn = document.getElementById('create-room-btn');
const joinRoomBtn = document.getElementById('join-room-btn');
const gameWrapper = document.getElementById('game-wrapper');
const playerNameDisplay = document.getElementById('player-name-display');
const opponentNameDisplay = document.querySelector('.opponent-zone .player-name');

const langEnBtn = document.getElementById('lang-en');
const langEsBtn = document.getElementById('lang-es');

let currentDataSala = null;

// --- IDIOMAS ---
setLanguage('en'); // Init 

langEnBtn.addEventListener('click', () => {
    langEnBtn.classList.add('active');
    langEsBtn.classList.remove('active');
    setLanguage('en');
});

langEsBtn.addEventListener('click', () => {
    langEsBtn.classList.add('active');
    langEnBtn.classList.remove('active');
    setLanguage('es');
});

window.addEventListener('languageChanged', () => {
    if (currentDataSala && redFirebase.getRol()) {
        // Re-render UI text depending on state
        actualizarIndicadorTurno(currentDataSala, redFirebase.getRol());
        if (checkGameOver() && !modalOverlay.classList.contains('hidden')) {
            mostrarModalFinal();
        }
        
        // Re-render Opponent name if waiting
        if (redFirebase.getRol() === 'jugador1') {
            opponentNameDisplay.textContent = currentDataSala.jugador2 ? currentDataSala.jugador2.nombre : t('waitingRival');
        } else {
            opponentNameDisplay.textContent = currentDataSala.jugador1 ? currentDataSala.jugador1.nombre : t('host');
        }
    }
});

function getDiceSVG(valor) {
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
}

function parseArrayFB(arr) {
    if (!arr) return [[], [], []];
    return [
       Array.isArray(arr[0]) ? arr[0] : [],
       Array.isArray(arr[1]) ? arr[1] : [],
       Array.isArray(arr[2]) ? arr[2] : []
    ];
}

function renderTableros() {
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
}

function actualizarPuntos() {
    let ptosTotalesJugador = 0, ptosTotalesOponente = 0;
    for (let i = 0; i < 3; i++) {
        const ptosJugador = game.calcularPuntosColumna(game.tableroJugador[i]);
        document.getElementById(`player-col-score-${i}`).textContent = ptosJugador;
        ptosTotalesJugador += ptosJugador;

        const ptosOponente = game.calcularPuntosColumna(game.tableroOponente[i]);
        document.getElementById(`opp-col-score-${i}`).textContent = ptosOponente;
        ptosTotalesOponente += ptosOponente;
    }
    playerTotalScore.textContent = ptosTotalesJugador;
    opponentTotalScore.textContent = ptosTotalesOponente;
}

function actualizarIndicadorTurno(dataSala, miRol) {
    if (!dataSala || !dataSala.estado) return;
    const turnoServer = dataSala.estado.turno;
    
    const faltaRival = !dataSala.jugador1 || !dataSala.jugador2;
    if (faltaRival) {
        hintText.innerHTML = `<strong style="color: var(--clr-text-muted)">${t('statusWaiting')}</strong>`;
        document.querySelector('.roll-btn-text').textContent = t('rollWaiting');
        return;
    }
    
    const nombreJ1 = dataSala.jugador1 ? dataSala.jugador1.nombre.split(' ')[0] : 'J1';
    const nombreJ2 = dataSala.jugador2 ? dataSala.jugador2.nombre.split(' ')[0] : 'J2';

    if (turnoServer === miRol) {
        hintText.innerHTML = `<strong style="color: var(--clr-player)">${t('turnYou')}</strong>`;
        document.querySelector('.roll-btn-text').textContent = t('rollYou');
    } else {
        const nombreRival = miRol === 'jugador1' ? nombreJ2 : nombreJ1;
        hintText.innerHTML = `${t('turnOpponent')}<strong style="color: #d45b5b">${nombreRival.toUpperCase()}</strong>`;
        document.querySelector('.roll-btn-text').textContent = t('rollWait');
    }
}

function checkGameOver() {
    let playerSlots = 0, oppSlots = 0;
    for(let i=0; i<3; i++) {
        playerSlots += game.tableroJugador[i].length;
        oppSlots += game.tableroOponente[i].length;
    }
    return (playerSlots === 9 || oppSlots === 9);
}

function mostrarModalFinal() {
    let ptosTotalesJugador = parseInt(playerTotalScore.textContent);
    let ptosTotalesOponente = parseInt(opponentTotalScore.textContent);
    
    winnerTitle.className = 'winner-title';
    if (ptosTotalesJugador > ptosTotalesOponente) {
        winnerTitle.textContent = t('victory'); winnerTitle.classList.add('win');
    } else if (ptosTotalesOponente > ptosTotalesJugador) {
        winnerTitle.textContent = t('lost'); winnerTitle.classList.add('lose');
    } else {
        winnerTitle.textContent = t('tie'); winnerTitle.classList.add('tie');
    }
    
    winnerScoreText.textContent = `${ptosTotalesJugador} a ${ptosTotalesOponente}`;
    modalOverlay.classList.remove('hidden');
}

function reaccionarCambioServidor(dataSala, miRol) {
    currentDataSala = dataSala;
    const estado = dataSala.estado;
    if(!estado) return;

    turnoActual = estado.turno;
    game.dadoActual = estado.dadoActual || 0;

    if (miRol === 'jugador1') {
        game.tableroJugador = parseArrayFB(estado.tablero1);
        game.tableroOponente = parseArrayFB(estado.tablero2);
        opponentNameDisplay.textContent = dataSala.jugador2 ? dataSala.jugador2.nombre : t('waitingRival');
    } else {
        game.tableroJugador = parseArrayFB(estado.tablero2);
        game.tableroOponente = parseArrayFB(estado.tablero1);
        opponentNameDisplay.textContent = dataSala.jugador1 ? dataSala.jugador1.nombre : t('host');
    }

    renderTableros();
    actualizarPuntos();
    actualizarIndicadorTurno(dataSala, miRol);

    const faltaRival = !dataSala.jugador1 || !dataSala.jugador2;
    if (game.dadoActual === 0) {
        dieValueSpan.innerHTML = '';
        currentDieContainer.classList.remove('has-value');
        dieValueSpan.style.color = '';
        currentDieContainer.style.borderColor = '';
        rollBtn.disabled = (turnoActual !== miRol) || faltaRival;
    } else {
        dieValueSpan.innerHTML = getDiceSVG(game.dadoActual);
        currentDieContainer.classList.add('has-value');
        rollBtn.disabled = true;
        
        if (turnoActual === miRol) {
            dieValueSpan.style.color = 'var(--clr-player)'; currentDieContainer.style.borderColor = 'var(--clr-player)';
        } else {
            dieValueSpan.style.color = '#d45b5b'; currentDieContainer.style.borderColor = '#d45b5b';
        }
    }

    if (checkGameOver() && modalOverlay.classList.contains('hidden')) {
        mostrarModalFinal();
    }
}


rollBtn.addEventListener('click', async () => {
    let miRol = redFirebase.getRol();
    if (rollBtn.disabled || turnoActual !== miRol || game.dadoActual !== 0) return;
    
    const valorDado = Math.floor(Math.random() * 6) + 1;
    await redFirebase.enviarDado(valorDado);
});

for (let i = 0; i < 3; i++) {
    const playerCol = document.getElementById(`player-col-${i}`);
    playerCol.addEventListener('click', async () => {
        let miRol = redFirebase.getRol();
        if (turnoActual !== miRol || game.dadoActual === 0) return;

        const movValido = game.colocarDado(i, true);
        if (movValido) {
            let nuevoTurno = miRol === 'jugador1' ? 'jugador2' : 'jugador1';
            await redFirebase.enviarMovimiento(game.tableroJugador, game.tableroOponente, nuevoTurno);
        }
    });
}

restartBtn.addEventListener('click', async () => {
    modalOverlay.classList.add('hidden');
    await redFirebase.reiniciarSala();
});

loginGithubBtn.addEventListener('click', async () => {
    try {
        await redFirebase.iniciarSesionConGithub();
    } catch(e) {
        console.error("Error al iniciar sesión con GitHub:", e);
        alert("Ocurrió un error.");
    }
});

loginGoogleBtn.addEventListener('click', async () => {
    try {
        await redFirebase.iniciarSesionConGoogle();
    } catch(e) {
        console.error("Error al iniciar sesión con Google:", e);
        alert("Ocurrió un error.");
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await redFirebase.cerrarSesion();
        window.location.reload();
    } catch(e) {
        console.error("Error al cerrar sesión:", e);
    }
});

createRoomBtn.addEventListener('click', async () => {
    try {
        const code = roomInput.value.trim();
        if(!code) return alert(t('errorRoomCode'));
        
        createRoomBtn.innerHTML = `<span class="roll-btn-text">${t('loading')}</span>`;
        
        await redFirebase.crearSala(code, playerNameDisplay.textContent);
        
        createRoomBtn.innerHTML = `<span class="roll-btn-text">${t('createRoom')}</span><span class="roll-btn-shine"></span>`;
        lobbyOverlay.classList.add('hidden');
        gameWrapper.classList.remove('hidden');
        
        redFirebase.escucharCambiosSala(reaccionarCambioServidor);
    } catch (error) {
        createRoomBtn.innerHTML = `<span class="roll-btn-text">${t('createRoom')}</span><span class="roll-btn-shine"></span>`;
        console.error(error);
        alert(t('errorFirebase') + error.message);
    }
});

joinRoomBtn.addEventListener('click', async () => {
    try {
        const code = roomInput.value.trim();
        if(!code) return alert(t('errorRoomCode'));
        
        joinRoomBtn.innerHTML = `<span class="roll-btn-text">${t('loading')}</span>`;
        
        await redFirebase.unirseASala(code, playerNameDisplay.textContent);
        
        joinRoomBtn.innerHTML = `<span class="roll-btn-text">${t('joinRoom')}</span><span class="roll-btn-shine"></span>`;
        lobbyOverlay.classList.add('hidden');
        gameWrapper.classList.remove('hidden');
        
        redFirebase.escucharCambiosSala(reaccionarCambioServidor);
    } catch (error) {
        joinRoomBtn.innerHTML = `<span class="roll-btn-text">${t('joinRoom')}</span><span class="roll-btn-shine"></span>`;
        console.error(error);
        alert(t('errorFirebase') + error.message);
    }
});

redFirebase.observarEstadoSesion((user) => {
    if (user) {
        const shortName = user.displayName || user.email || 'Player';
        playerNameDisplay.textContent = shortName;
        loggedUserName.textContent = shortName;
        
        loginOverlay.classList.add('hidden');
        topNav.classList.remove('hidden');
        lobbyOverlay.classList.remove('hidden');
        gameWrapper.classList.add('hidden');
    } else {
        loginOverlay.classList.remove('hidden');
        topNav.classList.add('hidden');
        lobbyOverlay.classList.add('hidden');
        gameWrapper.classList.add('hidden');
    }
});
