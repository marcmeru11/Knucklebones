const translations = {
    en: {
        pageTitle: "Knucklebones",
        gameTitle: "Knucklebones",
        gameSubtitle: "Cult of the Lamb fan game",
        hello: "Hi, ",
        loginTitle: "Log in to save your progress and join a match.",
        loginGithub: "Log in with GitHub",
        loginGoogle: "Log in with Google",
        logout: "Log Out",
        multiplayer: "Multiplayer",
        roomSub: "Enter a code to create a room or join a friend's room.",
        roomPlaceholder: "E.g. secret-room...",
        createRoom: "Create Room",
        joinRoom: "Join Room",
        currentDie: "Current Die",
        rollBtn: "🎲 Roll",
        rollYou: "🎲 Roll (YOU)",
        rollWait: "Wait...",
        rollWaiting: "Waiting...",
        hintText: "Roll the die to start your turn.",
        score: "Score",
        you: "YOU",
        victory: "Victory!",
        lost: "You Lost",
        tie: "Tie!",
        playAgain: "Play Again",
        loading: "Loading...",
        statusWaiting: "Status: Waiting for opponent...",
        turnYou: "Turn: YOU",
        turnOpponent: "Turn: ",
        errorRoomCode: "Enter a room code first.",
        errorRoomExists: "That room already exists. Join it or pick another name.",
        errorRoomNoExist: "Room doesn't exist. Check the code.",
        errorRoomFull: "The room is already full and playing.",
        errorLogin: "An error occurred.",
        errorFirebase: "Firebase Error: ",
        waitingRival: "Waiting for opponent...",
        host: "Host",
        leaveRoom: "Leave Match",
        roomClosedMessage: "The match was closed because a player left.",
        singlePlayer: "Single Player",
        difficulty: "Difficulty",
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",
        startSinglePlayerByDiff: "Level: ",
        cpuThinking: "CPU is thinking...",
        cpuTurn: "Turn: CPU"
    },
    es: {
        pageTitle: "Matatena",
        gameTitle: "Matatena",
        gameSubtitle: "Fan game de Cult of the Lamb",
        hello: "Hola, ",
        loginTitle: "Inicia sesión para guardar tu progreso y unirte a una partida.",
        loginGithub: "Iniciar sesión con GitHub",
        loginGoogle: "Iniciar sesión con Google",
        logout: "Cerrar Sesión",
        multiplayer: "Multijugador",
        roomSub: "Escribe un código para crear una sala o unirte a la de un amigo.",
        roomPlaceholder: "Ej: sala-secreta...",
        createRoom: "Crear Sala",
        joinRoom: "Unirse a Sala",
        currentDie: "Dado Actual",
        rollBtn: "🎲 Lanzar",
        rollYou: "🎲 Lanzar (TÚ)",
        rollWait: "Espera...",
        rollWaiting: "Esperando...",
        hintText: "Lanza el dado para comenzar tu turno.",
        score: "Puntuación",
        you: "TÚ",
        victory: "¡Victoria!",
        lost: "Has perdido",
        tie: "¡Empate!",
        playAgain: "Jugar de Nuevo",
        loading: "Cargando...",
        statusWaiting: "Estado: Esperando rival...",
        turnYou: "Turno: TÚ",
        turnOpponent: "Turno: ",
        errorRoomCode: "Escribe un código de sala primero.",
        errorRoomExists: "Esa sala ya existe. Únete a ella o elige otro nombre.",
        errorRoomNoExist: "La sala no existe. Verifica el código.",
        errorRoomFull: "La sala ya está llena y la partida ha empezado.",
        errorLogin: "Ocurrió un error.",
        errorFirebase: "Error de Firebase: ",
        waitingRival: "Esperando rival...",
        host: "Host",
        leaveRoom: "Salir de Partida",
        roomClosedMessage: "La partida se cerró porque un jugador se retiró.",
        singlePlayer: "Un jugador",
        difficulty: "Dificultad",
        easy: "Fácil",
        medium: "Medio",
        hard: "Difícil",
        startSinglePlayerByDiff: "Nivel: ",
        cpuThinking: "La CPU está pensando...",
        cpuTurn: "Turno: CPU"
    }
};

let currentLanguage = 'en';

export function getLanguage() {
    return currentLanguage;
}

export function setLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
        updateDOMTranslations();
    }
}

export function t(key) {
    return translations[currentLanguage][key] || key;
}

export function updateDOMTranslations() {
    // 1. Static element contents
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLanguage][key]) {
            el.innerHTML = translations[currentLanguage][key];
        }
    });

    // 2. Input placeholders
    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[currentLanguage][key]) {
            el.setAttribute('placeholder', translations[currentLanguage][key]);
        }
    });
    
    // 3. Dispatch an event for dynamically generated JS content
    window.dispatchEvent(new Event('languageChanged'));
}
