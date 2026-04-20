import { redFirebase } from './FirebaseService.js?v=4';
import { setLanguage, t } from './i18n.js?v=4';
import { UIManager } from './UIManager.js?v=4';
import { ScreenManager } from './ScreenManager.js?v=4';
import { LocalStrategy } from './strategies/LocalStrategy.js?v=4';
import { OnlineStrategy } from './strategies/OnlineStrategy.js?v=4';

UIManager.init();

const game = new MatatenaLogic();
const ai = new MatatenaAI();
let currentStrategy = null;
let aiDifficulty = 'easy';

const { elements } = UIManager;

setLanguage('en'); 

// --- LENGUAJE ---
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
    if (currentStrategy instanceof LocalStrategy) {
        elements.opponentNameDisplay.textContent = `CPU (${t(currentStrategy.difficulty)})`;
    }
});

// --- ACCIONES GLOBALES ---
async function salirAlLobby() {
    if (currentStrategy) {
        await currentStrategy.leave();
    }
    currentStrategy = null;
    ScreenManager.showScreen('mode-selection-overlay');
}

window.addEventListener('game-exit-requested', () => {
    salirAlLobby();
});

elements.leaveBtn.addEventListener('click', async () => {
    await salirAlLobby();
});

elements.rollBtn.addEventListener('click', async () => {
    if (currentStrategy) await currentStrategy.roll();
});

for (let i = 0; i < 3; i++) {
    const playerCol = document.getElementById(`player-col-${i}`);
    playerCol.addEventListener('click', async () => {
        if (currentStrategy) await currentStrategy.place(i);
    });
}

elements.restartBtn.addEventListener('click', async () => {
    if (currentStrategy) await currentStrategy.restart();
});

// --- AUTH ---
elements.loginGithubBtn.addEventListener('click', async () => {
    try {
        await redFirebase.iniciarSesionConGithub();
    } catch(e) {
        console.error("Error al iniciar sesión con GitHub:", e);
    }
});

elements.loginGoogleBtn.addEventListener('click', async () => {
    try {
        await redFirebase.iniciarSesionConGoogle();
    } catch(e) {
        console.error("Error al iniciar sesión con Google:", e);
    }
});

elements.logoutBtn.addEventListener('click', async () => {
    try {
        if (currentStrategy) await currentStrategy.leave();
        await redFirebase.cerrarSesion();
        window.location.reload();
    } catch(e) {
        console.error("Error al cerrar sesión:", e);
    }
});

// --- LOBBY & MODOS ---
elements.createRoomBtn.addEventListener('click', async () => {
    try {
        const code = elements.roomInput.value.trim();
        if(!code) return alert(t('errorRoomCode'));
        
        elements.createRoomBtn.innerHTML = `<span class="roll-btn-text">${t('loading')}</span>`;
        await redFirebase.crearSala(code, elements.playerNameDisplay.textContent);
        elements.createRoomBtn.innerHTML = `<span class="roll-btn-text">${t('createRoom')}</span><span class="roll-btn-shine"></span>`;
        
        currentStrategy = new OnlineStrategy(game, UIManager);
        await currentStrategy.init();
    } catch (error) {
        elements.createRoomBtn.innerHTML = `<span class="roll-btn-text">${t('createRoom')}</span><span class="roll-btn-shine"></span>`;
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
        
        currentStrategy = new OnlineStrategy(game, UIManager);
        await currentStrategy.init();
    } catch (error) {
        elements.joinRoomBtn.innerHTML = `<span class="roll-btn-text">${t('joinRoom')}</span><span class="roll-btn-shine"></span>`;
        alert(t('errorFirebase') + error.message);
    }
});

elements.difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        elements.difficultyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        aiDifficulty = btn.getAttribute('data-difficulty');
    });
});

elements.startSinglePlayerBtn.addEventListener('click', async () => {
    currentStrategy = new LocalStrategy(game, UIManager, ai);
    await currentStrategy.init({ difficulty: aiDifficulty });
});

elements.modeOnlineBtn.addEventListener('click', () => {
    ScreenManager.showScreen('lobby-overlay');
});

elements.modeCpuBtn.addEventListener('click', () => {
    ScreenManager.showScreen('ai-overlay');
});

elements.lobbyBackBtn.addEventListener('click', (e) => {
    e.preventDefault();
    ScreenManager.showScreen('mode-selection-overlay');
});

elements.aiBackBtn.addEventListener('click', (e) => {
    e.preventDefault();
    ScreenManager.showScreen('mode-selection-overlay');
});

// --- KEYBOARD ---
window.addEventListener('keydown', async (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if (elements.gameWrapper.classList.contains('hidden')) return;

    if (e.code === 'Space') {
        e.preventDefault();
        if (currentStrategy) await currentStrategy.roll();
    }
    
    if (['1', '2', '3'].includes(e.key)) {
        const colIndex = parseInt(e.key) - 1;
        if (currentStrategy) await currentStrategy.place(colIndex);
    }
});

// --- SESSION ---
redFirebase.observarEstadoSesion(async (user) => {
    if (user) {
        const shortName = user.displayName || user.email || 'Player';
        elements.playerNameDisplay.textContent = shortName;
        elements.loggedUserName.textContent = shortName;
        
        redFirebase.limpiarSalasInactivas();
        
        const salaIdActual = await redFirebase.checkActiveSession();
        if (salaIdActual && !currentStrategy) {
            try {
                await redFirebase.unirseASala(salaIdActual, shortName);
                currentStrategy = new OnlineStrategy(game, UIManager);
                await currentStrategy.init();
            } catch (error) {
                console.error("Room missing or expired", error);
                await redFirebase.clearActiveSession();
                ScreenManager.showScreen('mode-selection-overlay');
            }
        } else if (!currentStrategy) {
            ScreenManager.showScreen('mode-selection-overlay');
        }
    } else {
        ScreenManager.showScreen('login-overlay');
    }
});
