const game = new MatatenaLogic();

const rollBtn = document.getElementById('roll-btn');
const dieValueSpan = document.getElementById('die-value');
const currentDieContainer = document.getElementById('current-die');
const opponentTotalScore = document.getElementById('opponent-total-score');
const playerTotalScore = document.getElementById('player-total-score');
const hintText = document.getElementById('action-hint');

// Elementos del Modal
const modalOverlay = document.getElementById('game-over-modal');
const winnerTitle = document.getElementById('winner-title');
const winnerScoreText = document.getElementById('winner-score');
const restartBtn = document.getElementById('restart-btn');

// Control de Turnos
let turnoActual = 'jugador'; // o 'oponente'

// Función que genera un SVG para la cara del dado
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

function renderTableros() {
    // Renderear jugador
    game.tableroJugador.forEach((columna, colIndex) => {
        const slots = document.querySelectorAll(`#player-col-${colIndex} .dice-slot`);
        slots.forEach(slot => {
            slot.innerHTML = '';
            slot.classList.remove('filled', 'pop');
            slot.style.borderColor = ''; // reset inline style
            slot.style.boxShadow = '';
        });
        
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

    // Renderear oponente
    game.tableroOponente.forEach((columna, colIndex) => {
        const slots = document.querySelectorAll(`#opp-col-${colIndex} .dice-slot`);
        slots.forEach(slot => {
            slot.innerHTML = '';
            slot.classList.remove('filled', 'pop');
            slot.style.borderColor = '';
            slot.style.boxShadow = '';
        });
        
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
    let ptosTotalesJugador = 0;
    let ptosTotalesOponente = 0;

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

function actualizarIndicadorTurno() {
    if (turnoActual === 'jugador') {
        hintText.innerHTML = 'Turno: <strong style="color: var(--clr-player)">TÚ</strong>';
        document.querySelector('.roll-btn-text').textContent = '🎲 Lanzar (TÚ)';
    } else {
        hintText.innerHTML = 'Turno: <strong style="color: #d45b5b">RATAU</strong>';
        document.querySelector('.roll-btn-text').textContent = '🎲 Lanzar (RATAU)';
    }
}

function cambiarTurno() {
    turnoActual = (turnoActual === 'jugador') ? 'oponente' : 'jugador';
    actualizarIndicadorTurno();
    
    // Resetear el estilo del dado actual para que vuelva al estado vacío
    dieValueSpan.style.color = '';
    currentDieContainer.style.borderColor = '';
}

function checkGameOver() {
    let playerSlotsFilled = 0;
    let oppSlotsFilled = 0;
    
    for(let i=0; i<3; i++) {
        playerSlotsFilled += game.tableroJugador[i].length;
        oppSlotsFilled += game.tableroOponente[i].length;
    }
    
    return (playerSlotsFilled === 9 || oppSlotsFilled === 9);
}

function mostrarModalFinal() {
    let ptosTotalesJugador = parseInt(playerTotalScore.textContent);
    let ptosTotalesOponente = parseInt(opponentTotalScore.textContent);
    
    winnerTitle.className = 'winner-title'; // reset classes
    
    if (ptosTotalesJugador > ptosTotalesOponente) {
        winnerTitle.textContent = '¡Victoria!';
        winnerTitle.classList.add('win');
    } else if (ptosTotalesOponente > ptosTotalesJugador) {
        winnerTitle.textContent = 'Gana Ratau';
        winnerTitle.classList.add('lose');
    } else {
        winnerTitle.textContent = '¡Empate!';
        winnerTitle.classList.add('tie');
    }
    
    winnerScoreText.textContent = `${ptosTotalesJugador} a ${ptosTotalesOponente}`;
    modalOverlay.classList.remove('hidden');
}

restartBtn.addEventListener('click', () => {
    // Vaciar el constructor interno del juego
    game.tableroJugador = [[], [], []];
    game.tableroOponente = [[], [], []];
    game.dadoActual = 0;
    
    turnoActual = 'jugador';
    
    modalOverlay.classList.add('hidden');
    
    renderTableros();
    actualizarPuntos();
    actualizarIndicadorTurno();
    
    // Resetear panel del dado
    dieValueSpan.innerHTML = '';
    dieValueSpan.style.color = '';
    currentDieContainer.style.borderColor = '';
    currentDieContainer.classList.remove('has-value');
    rollBtn.disabled = false;
});

rollBtn.addEventListener('click', () => {
    if (rollBtn.disabled) return;
    
    const valorDado = game.lanzarDado();
    dieValueSpan.innerHTML = getDiceSVG(valorDado);
    currentDieContainer.classList.add('has-value');
    
    // Colorear el dado actual igual que el jugador al que le toca
    if (turnoActual === 'jugador') {
        dieValueSpan.style.color = 'var(--clr-player)';
        currentDieContainer.style.borderColor = 'var(--clr-player)';
    } else {
        dieValueSpan.style.color = '#d45b5b';
        currentDieContainer.style.borderColor = '#d45b5b';
    }
    
    rollBtn.disabled = true;
});

for (let i = 0; i < 3; i++) {
    // Columnas de TÚ (Jugador)
    const playerCol = document.getElementById(`player-col-${i}`);
    playerCol.addEventListener('click', () => {
        if (turnoActual !== 'jugador') return;
        if (game.dadoActual === 0) return;

        const movValido = game.colocarDado(i, true);
        if (movValido) {
            dieValueSpan.innerHTML = '';
            currentDieContainer.classList.remove('has-value');
            
            renderTableros();
            actualizarPuntos();
            
            if (checkGameOver()) {
                mostrarModalFinal();
                return; // Stop turn flip
            }
            
            cambiarTurno();
            rollBtn.disabled = false;
        }
    });

    // Columnas de RATAU (Oponente)
    const oppCol = document.getElementById(`opp-col-${i}`);
    oppCol.addEventListener('click', () => {
        if (turnoActual !== 'oponente') return;
        if (game.dadoActual === 0) return;

        const movValido = game.colocarDado(i, false);
        if (movValido) {
            dieValueSpan.innerHTML = '';
            currentDieContainer.classList.remove('has-value');
            
            renderTableros();
            actualizarPuntos();
            
            if (checkGameOver()) {
                mostrarModalFinal();
                return; // Stop turn flip
            }
            
            cambiarTurno();
            rollBtn.disabled = false;
        }
    });
}

// Inicialización
renderTableros();
actualizarPuntos();
actualizarIndicadorTurno();
